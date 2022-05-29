class CreateGradingJobModel < ActiveRecord::Migration[7.0]
  def change
    create_table :grading_jobs do |t|
      t.json :config, null: false
      t.integer :grade_id, null: false
      t.integer :submission_id, null: false
      t.integer :priority, null: false
      t.integer :user_id
      t.integer :team_id
      t.timestamps
    end
  end
end