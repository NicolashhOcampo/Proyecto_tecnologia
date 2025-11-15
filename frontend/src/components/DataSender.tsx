import { useState } from 'react';
import { api } from '../services/api';
import './DataSender.css';

export function DataSender() {
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const temp = parseFloat(temperature);
    const hum = parseFloat(humidity);

    if (isNaN(temp) || isNaN(hum)) {
      setError('Por favor ingresa valores numéricos válidos');
      return;
    }

    if (hum < 0 || hum > 100) {
      setError('La humedad debe estar entre 0 y 100');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.sendToThingSpeak({
        temperature: temp,
        humidity: hum,
      });
      
      // Formatear la respuesta JSON para mejor legibilidad
      let formattedResponse = response.thingspeak_response;
      try {
        const parsed = JSON.parse(response.thingspeak_response);
        formattedResponse = JSON.stringify(parsed, null, 2);
      } catch {
        // Si no es JSON válido, usar la respuesta tal cual
        formattedResponse = response.thingspeak_response;
      }
      
      setResult(`Datos enviados correctamente\n\nRespuesta de ThingSpeak:\n${formattedResponse}`);
      setTemperature('');
      setHumidity('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="data-sender">
      <h2>Enviar Datos a ThingSpeak</h2>
      <p className="description">
        Envía manualmente valores de temperatura y humedad a ThingSpeak
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="temperature">Temperatura (°C)</label>
            <input
              id="temperature"
              type="number"
              step="0.1"
              placeholder="Ej: 22.5"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="humidity">Humedad (%)</label>
            <input
              id="humidity"
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="Ej: 65"
              value={humidity}
              onChange={(e) => setHumidity(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-submit">
          {loading ? 'Enviando...' : 'Enviar a ThingSpeak'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}
      {result && <div className="success-message">{result}</div>}
    </div>
  );
}
