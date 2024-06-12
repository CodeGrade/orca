import os
import dotenv


class AppConfig():

    def __init__(self) -> None:
        dotenv.load_dotenv()
        self.orca_web_server_host = os.getenv(
            'ORCA_WEB_SERVER_HOST', 'http://localhost:4000')
        # NOTE: In order to work with SQLAlchemy, we need to add "pyscopg+" to
        # connect the python DB driver package (of the same name) to the ORM.
        self.postgres_url = \
            os.getenv('POSTGRES_URL',
                      'postgresql://postgres:password@localhost:5432') \
            .replace("postgresql", "postgresql+psycopg")
        enable_diagnostics_val = os.getenv('ENABLE_DIAGNOSTICS', '') or ""
        self.enable_diagnostics = enable_diagnostics_val.lower() == "true"
        self.environment = os.getenv("ENVIRONMENT", "DEV").lower()


APP_CONFIG = AppConfig()
