import { useState, useEffect } from 'react';
import type { Metrics } from '../types';
import { api } from '../services/api';
import './MetricsCard.css';

export function MetricsCard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 15000); // Cada 15 segundos
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getHumidityStatus = (humidity: number | null) => {
    if (humidity === null) return 'unknown';
    if (humidity < 20) return 'critical-low';
    if (humidity < 40) return 'low';
    if (humidity <= 60) return 'optimal';
    if (humidity <= 80) return 'high';
    return 'critical-high';
  };

  const getTemperatureStatus = (temperature: number | null) => {
    if (temperature === null) return 'unknown';
    if (temperature < 10) return 'critical-low';
    if (temperature < 15) return 'low';
    if (temperature <= 25) return 'optimal';
    if (temperature <= 30) return 'high';
    return 'critical-high';
  };

  return (
    <div className="metrics-card">
      <div className="metrics-header">
        <h2>📊 Métricas Actuales</h2>
        <div className="controls">
          <label className="auto-refresh">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-actualizar
          </label>
          <button onClick={fetchMetrics} disabled={loading}>
            {loading ? '⏳' : '🔄'} Actualizar
          </button>
        </div>
      </div>

      {error && <div className="error-message">❌ {error}</div>}

      {metrics && (
        <div className="metrics-grid">
          <div className={`metric-item ${getHumidityStatus(metrics.humidity)}`}>
            <div className="metric-icon">💧</div>
            <div className="metric-content">
              <h3>Humedad</h3>
              <div className="metric-value">
                {metrics.humidity !== null ? `${metrics.humidity}%` : 'N/A'}
              </div>
            </div>
          </div>

          <div className={`metric-item ${getTemperatureStatus(metrics.temperature)}`}>
            <div className="metric-icon">🌡️</div>
            <div className="metric-content">
              <h3>Temperatura</h3>
              <div className="metric-value">
                {metrics.temperature !== null ? `${metrics.temperature}°C` : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {metrics?.created_at && (
        <div className="last-update">
          Última actualización: {new Date(metrics.created_at).toLocaleString('es-ES')}
        </div>
      )}
    </div>
  );
}
