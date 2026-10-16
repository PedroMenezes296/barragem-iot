from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class LimitesPayload(BaseModel):
    limite_atencao: float = Field(gt=0)
    limite_critico: float = Field(gt=0)


@router.post("/limites")
def configurar_limites(payload: LimitesPayload):
    # TODO: persistir configuração no banco ou em configuração central.
    return {"detail": "Limites recebidos; persistência ainda não implementada.", **payload.model_dump()}
