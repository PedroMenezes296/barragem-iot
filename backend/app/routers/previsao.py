from fastapi import APIRouter

router = APIRouter()


@router.get("")
def obter_previsao():
    return {"detail": "Endpoint de previsão ainda não implementado."}


@router.post("/calcular")
def calcular_previsao():
    return {"detail": "Integração com FPGA ainda não implementada."}
