Se crea el entorno virtual en python:

python -m venv .venv
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force

Para correr el back:

. .venv\Scripts\Activate.ps1
uvicorn app:app --reload