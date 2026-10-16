from datetime import datetime
from pydantic import BaseModel, ConfigDict


class PrevisaoNivelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    leitura_referencia_id: int
    nivel_previsto: float | None
    risco: str
    timestamp_previsao: datetime
