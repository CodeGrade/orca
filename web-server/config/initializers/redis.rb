# $redis = Redis::Namespace.new("orca", :redis => Redis.new)
require "redis"

$redis = Redis.new(host: "localhost", port: 6379)