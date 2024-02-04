import os
import dotenv
class AppConfig():

  def __init__(self) -> None:
    dotenv.load_dotenv()
    self.orca_web_server_host = os.getenv('ORCA_WEB_SERVER_HOST', 'http://localhost:4000')
    self.redis_db_url = os.getenv('REDIS_DB_URL', 'redis://localhost:6379')
    __enable_diagnostics_val = os.getenv('ENABLE_DIAGNOSTICS') or ""
    self.enable_diagnostics =  __enable_diagnostics_val.lower() == "true"

APP_CONFIG = AppConfig()
