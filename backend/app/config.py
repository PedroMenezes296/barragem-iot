import os
from dotenv import load_dotenv

load_dotenv()

# Configurações existentes
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./monitoramento.db"
)

# Coordenadas da região que queremos consultar
LATITUDE = float(os.getenv("LATITUDE", "-31.33"))
LONGITUDE = float(os.getenv("LONGITUDE", "-54.11"))

# Configurações da Open-Meteo
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

OPEN_METEO_TIMEZONE = "America/Sao_Paulo"

OPEN_METEO_FORECAST_DAYS = 3

OPEN_METEO_HOURLY = [
    "temperature_2m",
    "precipitation",
    "precipitation_probability",
    "rain",
    "weather_code"
]