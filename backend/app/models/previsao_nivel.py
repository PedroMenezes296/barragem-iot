from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base


class PrevisaoNivel(Base):
    __tablename__ = "previsoes_nivel"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    leitura_referencia_id: Mapped[int] = mapped_column(ForeignKey("leituras.id"), nullable=False)
    nivel_previsto: Mapped[float | None] = mapped_column(Float, nullable=True)
    risco: Mapped[str] = mapped_column(String(20), nullable=False, default="baixo")
    timestamp_previsao: Mapped[object] = mapped_column(DateTime(timezone=True), nullable=False)
