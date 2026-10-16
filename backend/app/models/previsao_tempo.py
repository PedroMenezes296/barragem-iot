from sqlalchemy import DateTime, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base


class PrevisaoTempo(Base):
    __tablename__ = "previsoes_tempo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    temperatura: Mapped[float | None] = mapped_column(Float, nullable=True)
    precipitacao: Mapped[float | None] = mapped_column(Float, nullable=True)
    timestamp_previsao: Mapped[object] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
