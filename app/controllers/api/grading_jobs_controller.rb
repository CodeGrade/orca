module Api
    class GradingJobsController < ApiController
        # Allows for testing 'create' without verifying CSRF token authenticity
        protect_from_forgery except: :create

        # Get all grading jobs
        def index
            grading_jobs = GradingJob.all
            render json: grading_jobs
        end

        # Create a grading job
        def create
            grading_job_config = request.raw_post
            create_grading_job(grading_job_config)
            # TODO: Check if it succeeded
            render json: {
                status: "OK"
            }
        end

        def create_grading_job(grading_job_config)
            @grading_job_config = grading_job_config
            parsed_config = JSON.parse(@grading_job_config)
            # TODO: Did we want config to be a string here?
            @grading_job = GradingJob.new(
              config: @grading_job_config, 
              submission_id: parsed_config["submission_id"], 
              grade_id: parsed_config["grade_id"],
              priority: parsed_config["priority"],
            )
          if parsed_config["user_id"]
            @grading_job.user_id = parsed_config["user_id"]
          elsif parsed_config["team_id"]
            @grading_job.team_id = parsed_config["team_id"]
          end
          @grading_job.save!
          # TODO: Add job queue "enqueue" function here.
          end
    end
end