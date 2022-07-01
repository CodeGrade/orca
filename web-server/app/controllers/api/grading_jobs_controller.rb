require "json-schema"

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
      # TODO: Can we store these in redis in a way where we don't need to sort when retrieving?
      # Sort by priority
      sorted_grading_jobs = grading_jobs.sort_by { |grading_job| grading_job["priority"] }
      render json: sorted_grading_jobs
    end

    # Update a grading job (move position in queue)
    # TODO: Dont update if already in back/front
    def update
      priority_config = JSON.parse(request.raw_post)
      sub_id_to_move = params[:id]
      new_priority_pos = priority_config["priority"] # 'front' or 'back'

      if (new_priority_pos == "front")
        new_priority = Time.now.to_i
      elsif (new_priority_pos == "back")
        last_job = $redis.zrange("GradingQueue", -1, -1, :with_scores=>true)
        new_priority = last_job[0][1].to_i + 10
      else
        # error - invalid pos
      end
      grading_job_to_move = JSON.parse($redis.get("QueuedGradingInfo.#{sub_id_to_move}"))
      grading_job_to_move["priority"] = new_priority
      $redis.set("QueuedGradingInfo.#{sub_id_to_move}", grading_job_to_move.to_json)
      $redis.expireat("QueuedGradingInfo.#{sub_id_to_move}", new_priority)
      if priority_config["user_id"]
        user_id = priority_config["user_id"]
        $redis.zadd("GradingQueue", new_priority, "user.#{user_id}")
        $redis.expireat("SubmitterInfo.user.#{user_id}", new_priority)
      elsif priority_config["team_id"]
        team_id = priority_config["team_id"]
        $redis.zadd("GradingQueue", new_priority, "team.#{team_id}")
        $redis.expireat("SubmitterInfo.team.#{team_id}", new_priority)
      else
        $redis.zadd("GradingQueue", new_priority, "sub.#{sub_id_to_move}")
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
        $redis.del("SubmitterInfo.user.#{user_id}")
      elsif parsed_grading_job_to_delete["team_id"]
        team_id = parsed_grading_job_to_delete["team_id"]
        $redis.zrem("GradingQueue", "team.#{team_id}")
        $redis.del("SubmitterInfo.team.#{team_id}")
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
      lifetime = [priority + 10, $redis.expiretime("QueuedGradingInfo.#{sub_id}")].max # 10s
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
      $redis.lpush("SubmitterInfo.#{next_task}", sub_id)
      $redis.expireat("SubmitterInfo.#{next_task}", lifetime)
      $redis.zadd("GradingQueue", priority, next_task)
      # redirect_to :action => 'index'
    end

    private
    def is_valid_grading_job_config(config)
      # return JSON::Validator.validate(ValidationSchemas::GradingJobConfigSchema.schema, config)
      return JSON::Validator.validate(@@grading_config_schema, config)
    end

  end
end