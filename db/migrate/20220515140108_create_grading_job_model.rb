class CreateGradingJobModel < ActiveRecord::Migration[7.0]
  def change
    create_table :grading_job_models do |t|
      t.json :script
      t.integer :grade_id, null: false
      t.integer :submission_id, null: false
      t.integer :priority
      t.timestamps
    end
  end
end
