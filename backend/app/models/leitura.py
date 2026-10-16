from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base


class Leitura(Base):
    __tablename__ = "leituras"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nivel: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp_rtc: Mapped[object] = mapped_column(DateTime(timezone=True), nullable=False, index=True, unique=True)
    timestamp_recebimento: Mapped[object] = mapped_column(DateTime(timezone=True), nullable=False)
    dispositivo_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
