from sqlalchemy import desc, select
from sqlalchemy.orm import Session
from app.models.alerta import Alerta


def criar_alerta_se_necessario(db: Session, previsao_nivel_id: int, risco: str, mensagem: str) -> Alerta | None:
    if risco.lower() not in {"alto", "critico", "crítico"}:
        return None

    from datetime import datetime, timezone
    alerta = Alerta(
        previsao_nivel_id=previsao_nivel_id,
        nivel_risco=risco,
        mensagem=mensagem,
        timestamp_criacao=datetime.now(timezone.utc),
    )
    db.add(alerta)
    db.commit()
    db.refresh(alerta)
    return alerta


def listar_alertas(db: Session, limite: int = 100) -> list[Alerta]:
    limite = max(1, min(limite, 1000))
    return list(db.scalars(select(Alerta).order_by(desc(Alerta.timestamp_criacao)).limit(limite)))
