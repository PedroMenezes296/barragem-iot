
import httpx

from app.config import LATITUDE, LONGITUDE

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


def atualizar_previsao_tempo() -> None:
    """Consulta a Open-Meteo e exibe as previsões meteorológicas."""

    parametros = {
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "hourly": "temperature_2m,precipitation",
        "forecast_days": 3,
        "timezone": "America/Sao_Paulo",
    }

    try:
        resposta = httpx.get(
            OPEN_METEO_URL,
            params=parametros,
            timeout=15.0,
        )

        resposta.raise_for_status()
        dados = resposta.json()

        horarios = dados["hourly"]["time"]
        temperaturas = dados["hourly"]["temperature_2m"]
        precipitacoes = dados["hourly"]["precipitation"]

        print("Previsão meteorológica recebida com sucesso!")
        print(f"Latitude: {dados['latitude']}")
        print(f"Longitude: {dados['longitude']}")
        print(f"Quantidade de horários: {len(horarios)}")

        for i in range(min(5, len(horarios))):
            print(
                f"Horário: {horarios[i]} | "
                f"Temperatura: {temperaturas[i]} °C | "
                f"Precipitação: {precipitacoes[i]} mm"
            )

    except httpx.HTTPStatusError as erro:
        print(f"Erro HTTP ao consultar a Open-Meteo: {erro.response.status_code}")
        print(erro.response.text)

    except httpx.RequestError as erro:
        print(f"Erro de conexão com a Open-Meteo: {erro}")

    except (KeyError, TypeError, ValueError) as erro:
        print(f"Erro ao interpretar a resposta da API: {erro}")


if __name__ == "__main__":
    atualizar_previsao_tempo()
