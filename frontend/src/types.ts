export interface Metrics {
  humidity: number | null;
  temperature: number | null;
  created_at?: string;
}

export interface Settings {
  hum_muy_baja: number;
  hum_baja: number;
  hum_optima: number;
  hum_alta: number;
  temp_muy_baja: number;
  temp_baja: number;
  temp_optima: number;
  temp_alta: number;
  phone?: string;
}

export interface NotifyPayload {
  phone: string;
  message: string;
}

export interface WritePayload {
  temperature: number;
  humidity: number;
}

export interface CheckNotifyResponse {
  notified: boolean;
  twilio_sid?: string;
  messages?: string[];
  metrics?: Metrics;
}
