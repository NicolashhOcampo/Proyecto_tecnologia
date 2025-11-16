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
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="6"></circle>
              <circle cx="12" cy="12" r="2"></circle>
            </svg>
            Estabilizador Automático
          </h2>
          <p>Normaliza temperatura y humedad en valores críticos</p>
        </div>
        <button
          className="refresh-button"
          onClick={fetchMetrics}
          disabled={loading || stabilizing}
        >
          {loading ? (
            'Cargando...'
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              Actualizar Datos
            </>
          )}
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
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              Valores Actuales
            </h3>
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
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Valores en rango crítico
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
            <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              Error
            </h3>
            <p>{error}</p>
          </div>
        )}

        {stabilizationData && !stabilizing && (
          <>
            {!stabilizationData.stabilization_needed ? (
              <div className="no-stabilization-needed">
                <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  Todo Está Bien
                </h3>
                <p>{stabilizationData.message || 'Los valores están dentro de rangos aceptables'}</p>
              </div>
            ) : (
              <>
                <div className="completion-message">
                  <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Estabilización Completada
                  </h3>
                  <p style={{ color: '#166534' }}>
                    Se realizaron {stabilizationData.total_steps} actualizaciones para normalizar los valores.
                  </p>
                </div>

                {stabilizationData.steps && stabilizationData.steps.length > 0 && (
                  <div className="stabilization-progress">
                    <h3>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                      </svg>
                      Historial de Ajustes
                    </h3>
                    <div className="progress-info">
                      {stabilizationData.steps.map((step) => (
                        <div key={step.step} className="progress-item">
                          <span className="step">Paso {step.step}</span>
                          <span className="values" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>
                              </svg>
                              {step.temperature}°C
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                              </svg>
                              {step.humidity}%
                            </span>
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
