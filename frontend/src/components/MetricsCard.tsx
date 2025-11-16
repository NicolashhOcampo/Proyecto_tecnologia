import { useState, useEffect } from 'react';
import { IoWaterOutline } from 'react-icons/io5';
import { TbTemperature } from 'react-icons/tb';
import type { Metrics } from '../types';
import { api } from '../services/api';
import './MetricsCard.css';

export function MetricsCard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCharts, setShowCharts] = useState(true);

  const channelId = import.meta.env.VITE_THINGSPEAK_CHANNEL_ID || '3165540';

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
        <h2>Métricas Actuales</h2>
        <div className="header-controls">
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="toggle-charts-button"
          >
            {showCharts ? 'Ocultar Gráficos' : 'Mostrar Gráficos'}
          </button>
          <button onClick={fetchMetrics} disabled={loading} className="refresh-button">
            {loading ? 'Actualizando...' :
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
                Actualizar Datos
              </>}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {metrics && (
        <div className="metrics-grid">
          <div className={`metric-item ${getHumidityStatus(metrics.humidity)}`}>
            <div className="metric-icon humidity-icon"><IoWaterOutline /></div>
            <div className="metric-content">
              <h3>Humedad</h3>
              <div className="metric-value">
                {metrics.humidity !== null ? `${metrics.humidity}%` : 'N/A'}
              </div>
            </div>
          </div>

          <div className={`metric-item ${getTemperatureStatus(metrics.temperature)}`}>
            <div className="metric-icon temperature-icon"><TbTemperature /></div>
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

      {showCharts && (
        <div className="charts-container">
          <div className="chart-section">
            <h3 className="chart-title">Histórico de Temperatura</h3>
            <div className="chart-wrapper">
              <iframe
                src={`https://thingspeak.com/channels/${channelId}/charts/1?bgcolor=%23ffffff&color=%23d62020&dynamic=true&results=60&title=Temperatura&type=line&xaxis=Fecha&yaxis=Grados+C`}
                className="thingspeak-chart"
                title="Gráfico de Temperatura"
              />
            </div>
          </div>

          <div className="chart-section">
            <h3 className="chart-title">Histórico de Humedad</h3>
            <div className="chart-wrapper">
              <iframe
                src={`https://thingspeak.com/channels/${channelId}/charts/2?bgcolor=%23ffffff&color=%233b82f6&dynamic=true&results=60&title=Humedad&type=line&xaxis=Fecha&yaxis=Porcentaje+%25`}
                className="thingspeak-chart"
                title="Gráfico de Humedad"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
