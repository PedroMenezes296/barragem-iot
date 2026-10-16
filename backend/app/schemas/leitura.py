from datetime import datetime
from pydantic import BaseModel, ConfigDict


class LeituraCreate(BaseModel):
    nivel: float
    timestamp_rtc: datetime
    dispositivo_id: str | None = None


class LeituraOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nivel: float
    timestamp_rtc: datetime
    timestamp_recebimento: datetime
    dispositivo_id: str | None = None
