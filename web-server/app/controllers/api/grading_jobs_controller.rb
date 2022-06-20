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
      grading_jobs = GradingJob.all
      sorted_grading_jobs = grading_jobs.sort_by(&:priority)
      render json: sorted_grading_jobs
    end

    # Update a grading job (move position in queue)
    def update
      priority_config = JSON.parse(request.raw_post)
      new_priority_pos = priority_config["priority"] # 'front' or 'back'

      @grading_job_to_update = GradingJob.find(params[:id])
      current_priority = @grading_job_to_update.priority
      new_priority = current_priority

      # Calculate new priority based on desired position in queue
      if (new_priority_pos == "front")
        front_priority = GradingJob.minimum(:priority)
        # If not already in front
        if (front_priority != current_priority)
          new_priority = front_priority - 1
        end
      elsif (new_priority_pos == "back")
        back_priority = GradingJob.maximum(:priority)
        # If not already in back
        if (back_priority != current_priority)
          new_priority = back_priority + 1
        end
      else
        # error
      end

      # There is an update to be made
      if (new_priority != current_priority)
        # Update priority in config as well
        grading_job_config_to_update = @grading_job_to_update.config
        grading_job_config_to_update["priority"] = new_priority
        @grading_job_to_update.update(priority: new_priority, config: grading_job_config_to_update)
        return render json: {
          new_priority: new_priority
        }
      end
    end

    # Delete a grading job
    def destroy
      @grading_job_to_delete = GradingJob.find(params[:id])
      @grading_job_to_delete.destroy
      # redirect_to :action => 'index'
      head :ok # if successful
    end

    # Create a grading job
    def create
      grading_job_config = request.raw_post
      parsed_config = JSON.parse(grading_job_config)
      unless (is_valid_grading_job_config(parsed_config))
        return render json: {
          errors: [{message: "Invalid grading job config."}]
        }
      end
      @grading_job = GradingJob.new(
        config: parsed_config, 
        submission_id: parsed_config["submission_id"], 
        grade_id: parsed_config["grade_id"],
        priority: parsed_config["priority"],
      )
      if parsed_config["user_id"]
        @grading_job.user_id = parsed_config["user_id"]
      elsif parsed_config["team_id"]
        @grading_job.team_id = parsed_config["team_id"]
      end
      unless (@grading_job.save)
        return render json: {
          errors: [{message: "Invalid grading job config."}]
        }
      end
      # TODO: Add job queue "enqueue" function here.
    end

    private
    def is_valid_grading_job_config(config)
      # return JSON::Validator.validate(ValidationSchemas::GradingJobConfigSchema.schema, config)
      return JSON::Validator.validate(@@grading_config_schema, config)
    end

  end
end