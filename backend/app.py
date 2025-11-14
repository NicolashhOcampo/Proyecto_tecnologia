import os
from typing import Optional, Dict, Tuple, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import requests
from requests.auth import HTTPBasicAuth
from twilio.rest import Client

load_dotenv()

app = FastAPI(title="Simple ThingSpeak -> WhatsApp Notifier")

# Configurar CORS para permitir peticiones desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todos los orígenes (para desarrollo)
    allow_credentials=False,
    allow_methods=["*"],  # Permitir todos los métodos
    allow_headers=["*"],  # Permitir todos los headers
)

# Umbrales por defecto (mismos del sketch Arduino)
class Settings(BaseModel):
    hum_muy_baja: int = 20
    hum_baja: int = 40
    hum_optima: int = 60
    hum_alta: int = 80
    temp_muy_baja: int = 10
    temp_baja: int = 15
    temp_optima: int = 25
    temp_alta: int = 30
    phone: Optional[str] = None  # Ej: +34123456789

settings = Settings()

# Modelos simples
class Metrics(BaseModel):
    humidity: Optional[int]
    temperature: Optional[int]
    created_at: Optional[str] = None

class NotifyPayload(BaseModel):
    phone: str
    message: str

# Nuevo modelo para enviar datos a ThingSpeak
class WritePayload(BaseModel):
    temperature: float  # field1 en ThingSpeak
    humidity: float     # field2 en ThingSpeak

THINGSPEAK_BASE = "https://api.thingspeak.com"
THINGSPEAK_API_KEY = "SCTEW0JC7QTSKB8K"

def get_latest_metrics(channel_id: str, read_api_key: Optional[str] = None, timeout: int = 10) -> Optional[Dict]:
    params = {"results": 1}
    if read_api_key:
        params["api_key"] = read_api_key
    url = f"{THINGSPEAK_BASE}/channels/{channel_id}/feeds.json"
    resp = requests.get(url, params=params, timeout=timeout)
    resp.raise_for_status()
    data = resp.json()
    feeds = data.get("feeds", [])
    if not feeds:
        return None
    feed = feeds[0]
    # Ajustado: field1 = temperature, field2 = humidity
    temperature = feed.get("field1")
    humidity = feed.get("field2")
    try:
        temperature = int(float(temperature)) if temperature is not None else None
    except Exception:
        temperature = None
    try:
        humidity = int(float(humidity)) if humidity is not None else None
    except Exception:
        humidity = None
    return {"humidity": humidity, "temperature": temperature, "created_at": feed.get("created_at")}

def send_whatsapp(to_number: str, body: str) -> str:
    """
    Usa credenciales desde .env:
      - TWILIO_ACCOUNT_SID
      - TWILIO_AUTH_TOKEN
      - TWILIO_WHATSAPP_FROM (formato: whatsapp:+NNN...)
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_WHATSAPP_FROM")
    if not all([account_sid, auth_token, from_number]):
        raise RuntimeError("Twilio credentials not set in .env (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM)")
    client = Client(account_sid, auth_token)

    message = client.messages.create(
        from_=from_number,
        body=body,
        to=f"whatsapp:{to_number}"
    )
    return message.sid

def check_critical(humidity: Optional[int], temperature: Optional[int]) -> Tuple[bool, List[str]]:
    if humidity is None or temperature is None:
        return False, []
    msgs: List[str] = []
    low = (humidity < settings.hum_muy_baja) or (temperature < settings.temp_muy_baja)
    high = (humidity > settings.hum_alta) or (temperature > settings.temp_alta)
    if low:
        msgs.append("CRÍTICO - niveles MUY BAJOS")
    if high:
        msgs.append("CRÍTICO - niveles MUY ALTOS")
    return (low or high), msgs

@app.get("/", response_model=dict)
def root():
    return {"service": "ThingSpeak -> WhatsApp notifier", "status": "ok"}

@app.get("/metrics", response_model=Metrics)
def metrics():
    channel_id = os.getenv("THINGSPEAK_CHANNEL_ID")
    if not channel_id:
        raise HTTPException(status_code=400, detail="THINGSPEAK_CHANNEL_ID no configurado")
    data = get_latest_metrics(channel_id, os.getenv("THINGSPEAK_READ_API_KEY", None))
    if not data:
        raise HTTPException(status_code=404, detail="No hay datos en ThingSpeak")
    return data


@app.post("/check-and-notify", response_model=dict)
def check_and_notify():
    channel_id = os.getenv("THINGSPEAK_CHANNEL_ID")
    if not channel_id:
        raise HTTPException(status_code=400, detail="THINGSPEAK_CHANNEL_ID no configurado")
    data = get_latest_metrics(channel_id, os.getenv("THINGSPEAK_READ_API_KEY", None))
    if not data:
        raise HTTPException(status_code=404, detail="No hay datos en ThingSpeak")
    alarm, msgs = check_critical(data["humidity"], data["temperature"])
    phone = settings.phone or os.getenv("DEFAULT_NOTIFY_PHONE")
    if alarm and phone:
        text = f"{' | '.join(msgs)}\nH:{data['humidity']}%  T:{data['temperature']}C\n{data.get('created_at')}"
        try:
            res = send_whatsapp(phone, text)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error enviando WhatsApp: {e}")
        return {"notified": True, "twilio_sid": res}
    return {"notified": False, "messages": msgs, "metrics": data}

@app.post("/notify", response_model=dict)
def notify_now(payload: NotifyPayload):
    try:
        res = send_whatsapp(payload.phone, payload.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"sent": True, "twilio_sid": res}

@app.post("/send-to-thingspeak", response_model=dict)
def send_to_thingspeak(payload: WritePayload):
    """
    Envia temperatura (field1) y humedad (field2) a ThingSpeak usando la API de escritura.
    Usa la variable de entorno THINGSPEAK_WRITE_API_KEY; si no está, usa THINGSPEAK_API_KEY.
    """
    write_key = os.getenv("THINGSPEAK_WRITE_API_KEY", THINGSPEAK_API_KEY)
    if not write_key:
        raise HTTPException(status_code=400, detail="THINGSPEAK_WRITE_API_KEY no configurada")
    url = f"{THINGSPEAK_BASE}/update.json"
    data = {
        "api_key": write_key,
        "field1": payload.temperature,  # field1 = temperatura
        "field2": payload.humidity      # field2 = humedad
    }
    try:
        resp = requests.post(url, data=data, timeout=10)
        resp.raise_for_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error enviando a ThingSpeak: {e}")
    # ThingSpeak responde con el entry_id (texto). Devolvemos la respuesta cruda.
    return {"status": "ok", "thingspeak_response": resp.text}