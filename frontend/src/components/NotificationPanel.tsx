import { useState } from 'react';
import type { CheckNotifyResponse } from '../types';
import { api } from '../services/api';
import './NotificationPanel.css';

export function NotificationPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckNotifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  // const [customPhone, setCustomPhone] = useState('');
  // const [customMessage, setCustomMessage] = useState('');

  const handleCheckAndNotify = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.checkAndNotify();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  /* const handleCustomNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPhone || !customMessage) {
      setError('Por favor completa el teléfono y mensaje');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      await api.notify({ phone: customPhone, message: customMessage });
      setResult({ notified: true });
      setCustomMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }; */

  return (
    <div className="notification-panel">
      <h2>📱 Notificaciones WhatsApp</h2>

      <div className="notification-section">
        <h3>Verificación Automática</h3>
        <p>Verifica las métricas actuales y envía notificación si hay valores críticos</p>
        <button
          onClick={handleCheckAndNotify}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? '⏳ Verificando...' : '🔍 Verificar y Notificar'}
        </button>
      </div>

      {/* <div className="notification-section">
        <h3>Notificación Personalizada</h3>
        <form onSubmit={handleCustomNotify}>
          <div className="form-group">
            <label htmlFor="phone">Teléfono (incluye código de país)</label>
            <input
              id="phone"
              type="tel"
              placeholder="+34123456789"
              value={customPhone}
              onChange={(e) => setCustomPhone(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="message">Mensaje</label>
            <textarea
              id="message"
              placeholder="Escribe tu mensaje aquí..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              disabled={loading}
              rows={4}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? '⏳ Enviando...' : '📤 Enviar Notificación'}
          </button>
        </form>
      </div> */}

      {error && <div className="error-message">❌ {error}</div>}

      {result && (
        <div className={`result-message ${result.notified ? 'success' : 'info'}`}>
          {result.notified ? (
            <>
              <strong>✅ Notificación enviada correctamente</strong>
              {result.metrics && (
                <p>
                  Humedad: {result.metrics.humidity}% |
                  Temperatura: {result.metrics.temperature}°C
                </p>
              )}
            </>
          ) : (
            <>
              <strong>ℹ️ No se envió notificación</strong>
              {result.metrics && (
                <p>
                  Humedad: {result.metrics.humidity}% |
                  Temperatura: {result.metrics.temperature}°C
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
