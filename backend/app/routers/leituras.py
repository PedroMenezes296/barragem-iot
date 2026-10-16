from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.leitura import LeituraCreate, LeituraOut
from app.services.leituras_service import registrar_lote, listar_leituras

router = APIRouter()


@router.post("", response_model=list[LeituraOut], status_code=201)
def receber_leituras(payload: list[LeituraCreate], db: Session = Depends(get_db)):
    return registrar_lote(db, payload)


@router.get("", response_model=list[LeituraOut])
def obter_leituras(limite: int = 100, db: Session = Depends(get_db)):
    return listar_leituras(db, limite)


@router.get("/atual", response_model=LeituraOut | None)
def obter_leitura_atual(db: Session = Depends(get_db)):
    leituras = listar_leituras(db, 1)
    return leituras[0] if leituras else None
