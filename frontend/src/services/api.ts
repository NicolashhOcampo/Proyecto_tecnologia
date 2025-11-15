import type { Metrics, NotifyPayload, WritePayload, CheckNotifyResponse } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8000';

export const api = {
  baseURL: API_BASE_URL,
  
  async getMetrics(): Promise<Metrics> {
    const response = await fetch(`${API_BASE_URL}/metrics`);
    if (!response.ok) {
      throw new Error('Error al obtener las métricas');
    }
    return response.json();
  },

  async checkAndNotify(): Promise<CheckNotifyResponse> {
    const response = await fetch(`${API_BASE_URL}/check-and-notify`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Error al verificar y notificar');
    }
    return response.json();
  },

  async notify(payload: NotifyPayload): Promise<{ sent: boolean; twilio_sid: string }> {
    const response = await fetch(`${API_BASE_URL}/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('Error al enviar notificación');
    }
    return response.json();
  },

  async sendToThingSpeak(payload: WritePayload): Promise<{ status: string; thingspeak_response: string }> {
    const response = await fetch(`${API_BASE_URL}/send-to-thingspeak`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('Error al enviar datos a ThingSpeak');
    }
    return response.json();
  },
};
