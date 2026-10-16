from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.alertas_service import listar_alertas

router = APIRouter()


@router.get("")
def obter_alertas(limite: int = 100, db: Session = Depends(get_db)):
    return listar_alertas(db, limite)
