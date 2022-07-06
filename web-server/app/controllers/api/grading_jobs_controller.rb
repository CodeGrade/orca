require "json-schema"

LIFETIME_BUFFER = 86400 # 1 day in seconds
MOVE_TO_BACK_BUFFER = 10 # 10 seconds

module Api
  class GradingJobsController < ApiController
    # Allows for testing 'create' without verifying CSRF token authenticity
    protect_from_forgery except: :create

    # TODO: Move to a different file
    @@grading_config_schema = {
      "type" => "object",
      "required" => ["submission_id", "grade_id", "student_code", "priority", "script"],
      "properties" => {
          "submission_id" => {"type" => "integer"},
          "grade_id" => {"type" => "integer"},
          "student_code" => {"type" => "string"},
          "priority" => {"type" => "integer"},
          "script" => {"$ref" => "#/$defs/script"}
      },
  
      "$defs" => {
        "script" => {
          "type" => "array",
          "items" => {
            "type" => "object",
            "required" => ["cmd", "on_fail", "on_complete"],
            "properties" => {
              "cmd" => {"type" => "string"},
              "on_fail" => {"type" => "string"},
              "on_complete" => {"type" => "string"}
            }
          }
        }
      }
    }

    # Get all grading jobs
    def index
      grading_jobs = []
      grading_info_keys = $redis.keys("QueuedGradingInfo.*")
      grading_info_keys.each do | grading_info_key |
        grading_jobs.push(JSON.parse($redis.get(grading_info_key)))
      end
      # Sort by priority
      sorted_grading_jobs = grading_jobs.sort_by { |grading_job| grading_job["priority"] }
      render json: sorted_grading_jobs
    end

    # Update a grading job (move position in queue to front or back)
    def update
      priority_config = JSON.parse(request.raw_post)
      sub_id_to_move = params[:id]
      new_priority_pos = priority_config["priority"] # 'front' or 'back'
      grading_job_to_move = JSON.parse($redis.get("QueuedGradingInfo.#{sub_id_to_move}"))

      if (new_priority_pos == "front")
        new_priority = move_grading_job_to_front(sub_id_to_move, grading_job_to_move, priority_config)   
      elsif (new_priority_pos == "back")
        new_priority = move_grading_job_to_back(sub_id_to_move, grading_job_to_move, priority_config)
      else
        return render json: {
          errors: [{message: "Invalid grading job position. Must be 'front' or 'back'"}]
        }
      end
      return render json: {
        new_priority: new_priority
      }
    end

    # Delete a grading job
    def destroy
      sub_id_to_delete = params[:id]
      grading_job_to_delete = $redis.get("QueuedGradingInfo.#{sub_id_to_delete}")
      parsed_grading_job_to_delete = JSON.parse(grading_job_to_delete)

      $redis.del("QueuedGradingInfo.#{sub_id_to_delete}")
      if parsed_grading_job_to_delete["user_id"]
        user_id = parsed_grading_job_to_delete["user_id"]
        $redis.zrem("GradingQueue", "user.#{user_id}")
        $redis.lrem("SubmitterInfo.user.#{user_id}", -1, sub_id_to_delete)
      elsif parsed_grading_job_to_delete["team_id"]
        team_id = parsed_grading_job_to_delete["team_id"]
        $redis.zrem("GradingQueue", "team.#{team_id}")
        $redis.lrem("SubmitterInfo.team.#{team_id}", -1, sub_id_to_delete)
      else
        $redis.zrem("GradingQueue", "sub.#{sub_id_to_delete}")
        return
      end
      # TODO: not sure what I want to send back here
      head :ok # if successful
    end

    # Create a grading job
    def create
      # TODO: Error handling for redis operations
      grading_job_config = request.raw_post
      parsed_config = JSON.parse(grading_job_config)
      unless (is_valid_grading_job_config(parsed_config))
        return render json: {
          errors: [{message: "Invalid grading job config."}]
        }
      end
      sub_id = parsed_config["submission_id"]
      priority = parsed_config["priority"]

      lifetime = [priority + LIFETIME_BUFFER, $redis.expiretime("QueuedGradingInfo.#{sub_id}")].max

      # TODO: Do I need to move this to after checking if duplicate?
      $redis.set("QueuedGradingInfo.#{sub_id}", grading_job_config)
      $redis.expireat("QueuedGradingInfo.#{sub_id}", lifetime)

      if parsed_config["user_id"]
        user_id = parsed_config["user_id"]
      elsif parsed_config["team_id"]
        team_id = parsed_config["team_id"]
      else
        # Immediate submission
        $redis.zadd("GradingQueue", priority, "sub.#{sub_id}")
        return
      end
      # Guaranteed team_id or user_id for regular submission
      next_task = team_id ? "team.#{team_id}" : "user.#{user_id}"

      if ($redis.exists("SubmitterInfo.#{next_task}") && $redis.lpos("SubmitterInfo.#{next_task}", sub_id))
        # Duplicate - Submission ID already exists in SubmitterInfo
        return
      end

      $redis.lpush("SubmitterInfo.#{next_task}", sub_id)
      $redis.expireat("SubmitterInfo.#{next_task}", lifetime)
      $redis.zadd("GradingQueue", priority, next_task)
    end

    private
    def is_valid_grading_job_config(config)
      # return JSON::Validator.validate(ValidationSchemas::GradingJobConfigSchema.schema, config)
      return JSON::Validator.validate(@@grading_config_schema, config)
    end

    def move_grading_job_to_front(sub_id, grading_job, priority_config)
      new_priority = Time.now.to_i
      # Update priority
      grading_job["priority"] = new_priority
      $redis.set("QueuedGradingInfo.#{sub_id}", grading_job.to_json)

      if priority_config["user_id"]
        user_id = priority_config["user_id"]
        # Update priority of job in GradingQueue
        $redis.zadd("GradingQueue", new_priority, "user.#{user_id}")
        move_grading_job_submitter_info("user", user_id, sub_id, "front")
      elsif priority_config["team_id"]
        team_id = priority_config["team_id"]
        # Update priority of job in GradingQueue
        $redis.zadd("GradingQueue", new_priority, "team.#{team_id}")
        move_grading_job_submitter_info("team", team_id, sub_id, "front")
      else
        # Update priority of job in GradingQueue
        $redis.zadd("GradingQueue", new_priority, "sub.#{sub_id}")
      end
      return new_priority
    end

    def move_grading_job_to_back(sub_id, grading_job, priority_config)
      last_job = $redis.zrange("GradingQueue", -1, -1, :with_scores=>true)
      new_priority = last_job[0][1].to_i + MOVE_TO_BACK_BUFFER
      lifetime = new_priority + LIFETIME_BUFFER

      # Update priority
      grading_job["priority"] = new_priority
      $redis.set("QueuedGradingInfo.#{sub_id}", grading_job.to_json)
      $redis.expireat("QueuedGradingInfo.#{sub_id}", lifetime)

      if priority_config["user_id"]
        user_id = priority_config["user_id"]
        # Update priority of job in GradingQueue
        $redis.zadd("GradingQueue", new_priority, "user.#{user_id}")
        $redis.expireat("SubmitterInfo.user.#{user_id}", lifetime)
        move_grading_job_submitter_info("user", user_id, sub_id, "back")

      elsif priority_config["team_id"]
        team_id = priority_config["team_id"]
        # Update priority of job in GradingQueue
        $redis.zadd("GradingQueue", new_priority, "team.#{team_id}")
        $redis.expireat("SubmitterInfo.team.#{team_id}", lifetime)
        move_grading_job_submitter_info("team", team_id, sub_id, "back")
      else
        # Update priority of job in GradingQueue
        $redis.zadd("GradingQueue", new_priority, "sub.#{sub_id}")
      end
      return new_priority
    end

    def move_grading_job_submitter_info(submitter_type, submitter_id, sub_id, position)
      submitter_info = (submitter_type == "team") ? "SubmitterInfo.team.#{submitter_id}" : "SubmitterInfo.user.#{submitter_id}"
      # Remove existing entry
      $redis.lrem(submitter_info, -1, sub_id)
      # Move to front/back of list
      if (position == "front")
        $redis.lpush(submitter_info, sub_id)
      elsif (position == "back")
        $redis.rpush(submitter_info, sub_id)
      else
        # TODO: Handle Invalid position
      end
    end

  end
end