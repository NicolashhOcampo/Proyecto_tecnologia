import os
import time
import asyncio
from typing import Optional, Dict, Tuple, List
from fastapi import FastAPI, HTTPException, Request, Response, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import requests
from requests.auth import HTTPBasicAuth
from twilio.rest import Client
from twilio.twiml.messaging_response import MessagingResponse, Message



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
    print(f"Fetching ThingSpeak data from {url} with params {params}")
    resp = requests.get(url, params=params, timeout=timeout)
    data = resp.json()
    print(f"Received data: {data}")
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
    low_humidity = (humidity < settings.hum_muy_baja) 
    low_temperature = (temperature < settings.temp_muy_baja)
    high_humidity = (humidity > settings.hum_alta)
    high_temperature = (temperature > settings.temp_alta)
    if low_humidity:
        msgs.append("CRÍTICO - niveles MUY BAJOS de humedad")
    if high_humidity:
        msgs.append("CRÍTICO - niveles MUY ALTOS de humedad")
    if low_temperature:
        msgs.append("CRÍTICO - niveles MUY BAJOS de temperatura")
    if high_temperature:
        msgs.append("CRÍTICO - niveles MUY ALTOS de temperatura")
    return (low_humidity or low_temperature or high_humidity or high_temperature), msgs

def write_to_thingspeak(temperature: float, humidity: float) -> str:
    """
    Escribe temperatura y humedad a ThingSpeak.
    Retorna el entry_id como string.
    """
    write_key = os.getenv("THINGSPEAK_WRITE_API_KEY", THINGSPEAK_API_KEY)
    if not write_key:
        raise RuntimeError("THINGSPEAK_WRITE_API_KEY no configurada")
    url = f"{THINGSPEAK_BASE}/update.json"
    data = {
        "api_key": write_key,
        "field1": temperature,
        "field2": humidity
    }
    resp = requests.get(url, params=data, timeout=10)
    resp.raise_for_status()
    if resp.text == "0":
        raise RuntimeError("ThingSpeak no guardó los datos (entry_id=0)")
    return resp.text

async def stabilize_values(current_temp: int, current_hum: int) -> List[Dict]:
    """
    Estabiliza temperatura y/o humedad gradualmente hacia valores óptimos.
    Envía cada paso a ThingSpeak con un delay de 15 segundos (límite de escritura de ThingSpeak).
    Retorna lista de pasos realizados.
    """
    steps = []
    target_temp = settings.temp_optima
    target_hum = settings.hum_optima
    
    # Determinar si necesitamos estabilizar cada parámetro
    needs_temp_stabilization = (current_temp < settings.temp_muy_baja or 
                                current_temp > settings.temp_alta)
    needs_hum_stabilization = (current_hum < settings.hum_muy_baja or 
                               current_hum > settings.hum_alta)
    
    if not needs_temp_stabilization and not needs_hum_stabilization:
        return [{"message": "No se requiere estabilización"}]
    
    temp = float(current_temp)
    hum = float(current_hum)
    
    # Calculamos el número de pasos (ajustamos de a 5 unidades por paso)
    step_size = 5.0
    max_iterations = 20  # Límite de seguridad
    iteration = 0
    
    while iteration < max_iterations:
        temp_stabilized = True
        hum_stabilized = True
        
        # Ajustar temperatura si es necesario
        if needs_temp_stabilization:
            if temp < target_temp:
                temp = min(temp + step_size, target_temp)
                temp_stabilized = (temp >= target_temp)
            elif temp > target_temp:
                temp = max(temp - step_size, target_temp)
                temp_stabilized = (temp <= target_temp)
        
        # Ajustar humedad si es necesario
        if needs_hum_stabilization:
            if hum < target_hum:
                hum = min(hum + step_size, target_hum)
                hum_stabilized = (hum >= target_hum)
            elif hum > target_hum:
                hum = max(hum - step_size, target_hum)
                hum_stabilized = (hum <= target_hum)
        
        # Enviar valores actualizados a ThingSpeak
        try:
            entry_id = write_to_thingspeak(temp, hum)
            step_info = {
                "step": iteration + 1,
                "temperature": round(temp, 1),
                "humidity": round(hum, 1),
                "entry_id": entry_id,
                "timestamp": time.time()
            }
            steps.append(step_info)
            print(f"Paso {iteration + 1}: T={temp}°C, H={hum}%, Entry ID={entry_id}")
        except Exception as e:
            steps.append({
                "step": iteration + 1,
                "error": str(e),
                "temperature": round(temp, 1),
                "humidity": round(hum, 1)
            })
            print(f"Error en paso {iteration + 1}: {e}")
        
        # Verificar si alcanzamos los objetivos
        if (not needs_temp_stabilization or temp_stabilized) and \
           (not needs_hum_stabilization or hum_stabilized):
            break
        
        # Esperar 16 segundos entre actualizaciones (ThingSpeak free tiene límite de ~15 seg)
        await asyncio.sleep(16)
        iteration += 1
    
    return steps

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
    phone = os.getenv("DEFAULT_NOTIFY_PHONE")
    if alarm and phone:
        msgs_text = '\n'.join(msgs)
        text = f"{msgs_text}\nHumedad: {data['humidity']}%\nTemperatura: {data['temperature']}°C\n{data.get('created_at')}"
        try:
            res = send_whatsapp(phone, text)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error enviando WhatsApp: {e}")
        return {"notified": True, "messages": msgs, "metrics": data, "twilio_sid": res}
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
    try:
        entry_id = write_to_thingspeak(payload.temperature, payload.humidity)
        return {"status": "ok", "thingspeak_response": entry_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error enviando a ThingSpeak: {e}")

@app.post("/stabilize", response_model=dict)
async def stabilize():
    """
    Lee los valores actuales de ThingSpeak, determina si están en niveles críticos,
    y si lo están, los estabiliza gradualmente enviando actualizaciones a ThingSpeak.
    Solo ajusta los parámetros que están fuera de rango.
    """
    channel_id = os.getenv("THINGSPEAK_CHANNEL_ID")
    if not channel_id:
        raise HTTPException(status_code=400, detail="THINGSPEAK_CHANNEL_ID no configurado")
    
    # Obtener valores actuales
    data = get_latest_metrics(channel_id, os.getenv("THINGSPEAK_READ_API_KEY", None))
    if not data:
        raise HTTPException(status_code=404, detail="No hay datos en ThingSpeak")
    
    current_temp = data["temperature"]
    current_hum = data["humidity"]
    
    if current_temp is None or current_hum is None:
        raise HTTPException(status_code=400, detail="Datos incompletos en ThingSpeak")
    
    # Verificar si necesita estabilización
    is_critical, msgs = check_critical(current_hum, current_temp)
    
    if not is_critical:
        return {
            "stabilization_needed": False,
            "message": "Los valores están dentro de rangos aceptables",
            "current_values": {"temperature": current_temp, "humidity": current_hum}
        }
    
    # Ejecutar estabilización
    try:
        steps = await stabilize_values(current_temp, current_hum)
        return {
            "stabilization_needed": True,
            "initial_values": {"temperature": current_temp, "humidity": current_hum},
            "target_values": {"temperature": settings.temp_optima, "humidity": settings.hum_optima},
            "steps": steps,
            "total_steps": len(steps),
            "messages": msgs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error durante estabilización: {e}")

@app.post("/whatsapp")
async def whatsapp_webhook(request: Request):
    form = await request.form()

    from_number = form.get("From")
    body = form.get("Body", "").strip().lower()

    print("Mensaje entrante:", body, "de", from_number)

    # Respuesta por defecto
    response_msg = "Comando no reconocido. Enviá STATUS para ver métricas."
    twiml = MessagingResponse()
    if body == "status":
        channel_id = os.getenv("THINGSPEAK_CHANNEL_ID")
        if not channel_id:
            response_msg = "THINGSPEAK_CHANNEL_ID no está configurado."
        else:
            data = get_latest_metrics(
                channel_id,
                os.getenv("THINGSPEAK_READ_API_KEY", None)
            )
            if not data:
                response_msg = "No hay datos en ThingSpeak."
            else:
                response_msg = (
                    f"Métricas actuales:\n"
                    f"Humedad: {data['humidity']}%\n"
                    f"Temperatura: {data['temperature']}C\n"
                    f"{data.get('created_at')}"
                )

    # Responder al usuario usando tu función
    try:
        twiml.message(response_msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error enviando WhatsApp: {e}")


    return Response(content=str(twiml), media_type="application/xml")