from datetime import datetime, timezone
from sqlalchemy import desc, select
from sqlalchemy.orm import Session
from app.models.leitura import Leitura
from app.schemas.leitura import LeituraCreate


def registrar_lote(db: Session, payload: list[LeituraCreate]) -> list[Leitura]:
    """Registra leituras, ignorando timestamps RTC já recebidos (idempotência básica)."""
    registradas = []
    for item in payload:
        existente = db.scalar(select(Leitura).where(Leitura.timestamp_rtc == item.timestamp_rtc))
        if existente:
            continue
        leitura = Leitura(
            nivel=item.nivel,
            timestamp_rtc=item.timestamp_rtc,
            timestamp_recebimento=datetime.now(timezone.utc),
            dispositivo_id=item.dispositivo_id,
        )
        db.add(leitura)
        registradas.append(leitura)

    db.commit()
    for leitura in registradas:
        db.refresh(leitura)
    return registradas


def listar_leituras(db: Session, limite: int = 100) -> list[Leitura]:
    limite = max(1, min(limite, 1000))
    return list(db.scalars(select(Leitura).order_by(desc(Leitura.timestamp_rtc)).limit(limite)))
