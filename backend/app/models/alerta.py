from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base


class Alerta(Base):
    __tablename__ = "alertas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    previsao_nivel_id: Mapped[int] = mapped_column(ForeignKey("previsoes_nivel.id"), nullable=False)
    nivel_risco: Mapped[str] = mapped_column(String(20), nullable=False)
    mensagem: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp_criacao: Mapped[object] = mapped_column(DateTime(timezone=True), nullable=False)
