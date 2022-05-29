class GradingJob < ApplicationRecord

  def self.avg_wait_time
    wait_times = GradingJob.all.map {|g| g.wait_time }
    avg = wait_times / wait_times.length
    return avg
  end

  def wait_time
    Time.now - self.created_at
  end

end