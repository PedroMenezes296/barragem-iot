import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./monitoramento.db")
LATITUDE = float(os.getenv("LATITUDE", "-31.33"))
LONGITUDE = float(os.getenv("LONGITUDE", "-54.11"))
