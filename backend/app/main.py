from fastapi import FastAPI
from app.routers import leituras, previsao, alertas, config

app = FastAPI(
    title="API de Monitoramento de Nível",
    description="API para ingestão de leituras, previsões e alertas.",
    version="0.1.0",
)

app.include_router(leituras.router, prefix="/api/leituras", tags=["Leituras"])
app.include_router(previsao.router, prefix="/api/previsao", tags=["Previsão"])
app.include_router(alertas.router, prefix="/api/alertas", tags=["Alertas"])
app.include_router(config.router, prefix="/api/config", tags=["Configuração"])


@app.get("/health", tags=["Sistema"])
def health_check():
    return {"status": "ok"}
