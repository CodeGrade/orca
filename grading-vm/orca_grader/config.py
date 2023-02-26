import os

class AppConfig():

  def __init__(self) -> None:
    self.orca_web_server_host = os.getenv('ORCA_WEB_SERVER_HOST', 'http://localhost:4000')
    self.redis_db_uri = os.getenv('REDIS_DB_URI', 'redis://localhost:6379')
    self.bottlenose_host = os.getenv('BOTTLENOSE_HOST', 'http://localhost:3000')

APP_CONFIG = AppConfig()
