# Backend — Monitoramento de Nível

Esqueleto inicial em FastAPI. Os endpoints e serviços marcados com `TODO` ainda precisam ser implementados e validados com o hardware/FPGA.

## Requisitos
- Python 3.10+
- pip

## Executar localmente

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

No Windows PowerShell, se `copy` não funcionar, use `Copy-Item .env.example .env`.

- API: http://127.0.0.1:8000
- Swagger: http://127.0.0.1:8000/docs
- OpenAPI: http://127.0.0.1:8000/openapi.json
- Verificação: http://127.0.0.1:8000/health

## Observações importantes
- O banco SQLite e as tabelas são configurados em `app/db/database.py`; para criar as tabelas inicialmente, execute `python -c "from app.db.database import init_db; init_db()"`.
- A deduplicação por `timestamp_rtc` está implementada como ponto de partida. Para concorrência e lotes, a restrição `UNIQUE` no banco é a proteção final; trate também conflitos de integridade na aplicação.
- Os campos e nomes de colunas são um esqueleto baseado na estrutura proposta. Ajuste `nivel`, unidades, campos meteorológicos e demais tipos conforme o documento de requisitos.
- O worker Open-Meteo, o seed ANA/HidroWeb e a integração FPGA são stubs, não implementações funcionais ainda.
- Em produção, use migrações (por exemplo, Alembic) em vez de depender de `create_all`.
