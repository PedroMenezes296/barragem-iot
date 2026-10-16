
import httpx

from app.config import LATITUDE, LONGITUDE

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


def buscar_previsao_tempo() -> dict:
    parametros = {
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "hourly": "temperature_2m,precipitation",
        "forecast_days": 3,
        "timezone": "America/Sao_Paulo",
    }

    resposta = httpx.get(
        OPEN_METEO_URL,
        params=parametros,
        timeout=15.0,
    )
    resposta.raise_for_status()

    return resposta.json()
