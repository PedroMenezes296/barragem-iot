
from datetime import datetime
from zoneinfo import ZoneInfo

import httpx

from app.config import LATITUDE, LONGITUDE


OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
FUSO_HORARIO = ZoneInfo("America/Sao_Paulo")


def buscar_previsoes_tempo() -> list[dict]:
    """Consulta a Open-Meteo e organiza as previsões por hora."""

    params = {
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "hourly": "temperature_2m,precipitation",
        "forecast_days": 3,
        "timezone": "America/Sao_Paulo",
    }

    response = httpx.get(
        OPEN_METEO_URL,
        params=params,
        timeout=15.0,
    )
    response.raise_for_status()

    dados = response.json()
    hourly = dados["hourly"]

    horarios = hourly["time"]
    temperaturas = hourly["temperature_2m"]
    precipitacoes = hourly["precipitation"]

    if not (
        len(horarios) == len(temperaturas) == len(precipitacoes)
    ):
        raise ValueError(
            "A API retornou listas com tamanhos diferentes."
        )

    previsoes = []

    for horario, temperatura, precipitacao in zip(
        horarios, temperaturas, precipitacoes
    ):
        timestamp = datetime.fromisoformat(horario).replace(
            tzinfo=FUSO_HORARIO
        )

        previsoes.append(
            {
                "timestamp_previsao": timestamp,
                "temperatura": temperatura,
                "precipitacao": precipitacao,
            }
        )

    return previsoes
