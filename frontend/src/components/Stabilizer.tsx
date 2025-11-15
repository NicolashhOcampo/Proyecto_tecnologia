import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './Stabilizer.css';

interface StabilizationStep {
  step: number;
  temperature: number;
  humidity: number;
  entry_id?: string;
  error?: string;
  timestamp?: number;
}

interface StabilizationResponse {
  stabilization_needed: boolean;
  message?: string;
  initial_values?: {
    temperature: number;
    humidity: number;
  };
  target_values?: {
    temperature: number;
    humidity: number;
  };
  current_values?: {
    temperature: number;
    humidity: number;
  };
  steps?: StabilizationStep[];
  total_steps?: number;
  messages?: string[];
}

interface Metrics {
  temperature: number | null;
  humidity: number | null;
}

export const Stabilizer: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics>({ temperature: null, humidity: null });
  const [loading, setLoading] = useState(false);
  const [stabilizing, setStabilizing] = useState(false);
  const [stabilizationData, setStabilizationData] = useState<StabilizationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar métricas actuales al montar el componente
  useEffect(() => {
    fetchMetrics();
  }, []);

  // Auto-refresh cada 5 segundos cuando no está estabilizando
  useEffect(() => {
    if (stabilizing) return;

    const interval = setInterval(() => {
      fetchMetrics();
    }, 5000); // Actualiza cada 5 segundos

    return () => clearInterval(interval);
  }, [stabilizing]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await api.getMetrics();
      setMetrics({
        temperature: data.temperature,
        humidity: data.humidity
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Error al cargar métricas actuales');
    } finally {
      setLoading(false);
    }
  };

  const startStabilization = async () => {
    try {
      setStabilizing(true);
      setError(null);
      setStabilizationData(null);

      const response = await fetch(`${api.baseURL}/stabilize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error durante la estabilización');
      }

      const data: StabilizationResponse = await response.json();
      setStabilizationData(data);

      // Actualizar métricas después de la estabilización
      if (data.steps && data.steps.length > 0) {
        const lastStep = data.steps[data.steps.length - 1];
        setMetrics({
          temperature: lastStep.temperature,
          humidity: lastStep.humidity
        });
      }
    } catch (err) {
      console.error('Error during stabilization:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido durante la estabilización');
    } finally {
      setStabilizing(false);
    }
  };

  const isCritical = (temp: number | null, hum: number | null): boolean => {
    if (temp === null || hum === null) return false;
    
    // Umbrales críticos (mismos del backend)
    const HUM_MUY_BAJA = 20;
    const HUM_ALTA = 80;
    const TEMP_MUY_BAJA = 10;
    const TEMP_ALTA = 30;
    
    return (
      temp < TEMP_MUY_BAJA || 
      temp > TEMP_ALTA || 
      hum < HUM_MUY_BAJA || 
      hum > HUM_ALTA
    );
  };

  const critical = isCritical(metrics.temperature, metrics.humidity);

  return (
    <div className="stabilizer-container">
      <div className="stabilizer-header">
        <div className="stabilizer-header-content">
          <h2>🎯 Estabilizador Automático</h2>
          <p>Normaliza temperatura y humedad en valores críticos</p>
        </div>
        <button
          className="refresh-button"
          onClick={fetchMetrics}
          disabled={loading || stabilizing}
        >
          {loading ? 'Cargando...' : '🔄 Actualizar Datos'}
        </button>
      </div>

      <div className="stabilizer-content">
        {loading ? (
          <div className="current-values">
            <h3>Cargando métricas...</h3>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <div className="spinner"></div>
            </div>
          </div>
        ) : (
          <div className="current-values">
            <h3>📊 Valores Actuales</h3>
            <div className="values-grid">
              <div className={`value-item ${critical && metrics.temperature !== null && (metrics.temperature < 10 || metrics.temperature > 30) ? 'value-critical' : ''}`}>
                <div className="label">Temperatura</div>
                <div className="value">
                  {metrics.temperature !== null ? metrics.temperature : '--'}
                  <span className="unit">°C</span>
                </div>
              </div>
              <div className={`value-item ${critical && metrics.humidity !== null && (metrics.humidity < 20 || metrics.humidity > 80) ? 'value-critical' : ''}`}>
                <div className="label">Humedad</div>
                <div className="value">
                  {metrics.humidity !== null ? metrics.humidity : '--'}
                  <span className="unit">%</span>
                </div>
              </div>
            </div>
            {critical && (
              <div style={{ 
                marginTop: 'var(--spacing-md)', 
                textAlign: 'center', 
                fontSize: '1rem', 
                fontWeight: 600,
                color: 'var(--color-danger)',
                padding: 'var(--spacing-sm)',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                ⚠️ Valores en rango crítico
              </div>
            )}
          </div>
        )}

        <button
          className="stabilizer-button"
          onClick={startStabilization}
          disabled={stabilizing || loading || !critical}
        >
          {stabilizing ? 'Estabilizando...' : critical ? 'Iniciar Estabilización' : 'No se requiere estabilización'}
        </button>

        {stabilizing && (
          <div className="stabilization-progress">
            <h3>
              <div className="spinner"></div>
              Estabilización en progreso...
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
              Este proceso puede tomar varios minutos. Los valores se actualizan cada 16 segundos en ThingSpeak.
            </p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <h3>❌ Error</h3>
            <p>{error}</p>
          </div>
        )}

        {stabilizationData && !stabilizing && (
          <>
            {!stabilizationData.stabilization_needed ? (
              <div className="no-stabilization-needed">
                <h3>✅ Todo Está Bien</h3>
                <p>{stabilizationData.message || 'Los valores están dentro de rangos aceptables'}</p>
              </div>
            ) : (
              <>
                <div className="completion-message">
                  <h3>✅ Estabilización Completada</h3>
                  <p style={{ color: '#166534' }}>
                    Se realizaron {stabilizationData.total_steps} actualizaciones para normalizar los valores.
                  </p>
                </div>

                {stabilizationData.steps && stabilizationData.steps.length > 0 && (
                  <div className="stabilization-progress">
                    <h3>📈 Historial de Ajustes</h3>
                    <div className="progress-info">
                      {stabilizationData.steps.map((step) => (
                        <div key={step.step} className="progress-item">
                          <span className="step">Paso {step.step}</span>
                          <span className="values">
                            🌡️ {step.temperature}°C | 💧 {step.humidity}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
