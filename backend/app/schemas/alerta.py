from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AlertaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    previsao_nivel_id: int
    nivel_risco: str
    mensagem: str
    timestamp_criacao: datetime
