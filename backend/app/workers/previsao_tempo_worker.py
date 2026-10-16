from datetime import datetime
from zoneinfo import ZoneInfo

import httpx

from app.config import (
    LATITUDE,
    LONGITUDE,
    OPEN_METEO_URL,
    OPEN_METEO_TIMEZONE,
    OPEN_METEO_FORECAST_DAYS,
    OPEN_METEO_HOURLY,
)


def consultar_previsao_tempo():
    """
    Consulta a API Open-Meteo utilizando as coordenadas
    geográficas configuradas para a região de interesse.
    """

    params = {
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "hourly": ",".join(OPEN_METEO_HOURLY),
        "forecast_days": OPEN_METEO_FORECAST_DAYS,
        "timezone": OPEN_METEO_TIMEZONE,
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            response = client.get(
                OPEN_METEO_URL,
                params=params
            )

            response.raise_for_status()

            return response.json()

    except httpx.HTTPError as erro:
        print(f"Erro ao consultar Open-Meteo: {erro}")
        raise


def processar_previsao_tempo(dados):
    """
    Transforma os arrays horários da API em uma lista
    de registros meteorológicos organizados por horário.
    """

    hourly = dados["hourly"]

    horarios = hourly["time"]

    # Valida se todas as listas correspondem aos mesmos horários
    for variavel in OPEN_METEO_HOURLY:
        if len(hourly[variavel]) != len(horarios):
            raise ValueError(
                f"Quantidade de valores inválida: {variavel}"
            )

    previsoes = []

    for indice, horario in enumerate(horarios):

        previsao = {
            "latitude_consultada": LATITUDE,
            "longitude_consultada": LONGITUDE,

            "horario_previsao": horario,

            "temperatura_c": hourly[
                "temperature_2m"
            ][indice],

            "precipitacao_mm": hourly[
                "precipitation"
            ][indice],

            "probabilidade_precipitacao_pct": hourly[
                "precipitation_probability"
            ][indice],

            "chuva_mm": hourly[
                "rain"
            ][indice],

            "codigo_tempo": hourly[
                "weather_code"
            ][indice],

            "fonte": "Open-Meteo"
        }

        previsoes.append(previsao)

    return previsoes


def executar_worker():
    print("Consultando previsão meteorológica...")

    dados = consultar_previsao_tempo()

    previsoes = processar_previsao_tempo(dados)

    print(f"Previsões recebidas: {len(previsoes)}")

    # Exibe alguns registros para validar o processamento
    for previsao in previsoes[:5]:
        print(previsao)

    return previsoes


if __name__ == "__main__":
    executar_worker()