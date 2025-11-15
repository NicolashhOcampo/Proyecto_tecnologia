import { useState } from 'react';
import { TbChartLine } from 'react-icons/tb';
import { IoNotificationsOutline } from 'react-icons/io5';
import { RiWhatsappLine } from 'react-icons/ri';
import { HiOutlineCloud } from 'react-icons/hi';
import './Welcome.css';

interface WelcomeProps {
  onStart: () => void;
}

export function Welcome({ onStart }: WelcomeProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Generar partículas una sola vez al inicializar
  const [particles] = useState(() => 
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
    }))
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    setMousePosition({
      x: (clientX / innerWidth - 0.5) * 20,
      y: (clientY / innerHeight - 0.5) * 20,
    });
  };

  return (
    <div className="welcome-container" onMouseMove={handleMouseMove}>
      {/* Fondo animado con partículas */}
      <div className="welcome-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Contenido principal */}
      <div className="welcome-content" style={{
        transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
      }}>
        <div className="logo-welcome">
          <div className="logo-circle">
            <div className="logo-inner">
              <span className="logo-emoji">🌡️</span>
            </div>
          </div>
          <div className="logo-rings">
            <div className="ring ring-1"></div>
            <div className="ring ring-2"></div>
            <div className="ring ring-3"></div>
          </div>
        </div>

        <h1 className="welcome-title">
          <span className="title-word">Monitor</span>
          <span className="title-word">IoT</span>
          <span className="title-word gradient-text">Inteligente</span>
        </h1>

        <p className="welcome-subtitle">
          Sistema avanzado de monitoreo de temperatura y humedad
          <br />
          con notificaciones en tiempo real vía WhatsApp
        </p>

        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon"><TbChartLine /></div>
            <span>Métricas en Tiempo Real</span>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><IoNotificationsOutline /></div>
            <span>Alertas Inteligentes</span>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><RiWhatsappLine /></div>
            <span>Notificaciones WhatsApp</span>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><HiOutlineCloud /></div>
            <span>Integración ThingSpeak</span>
          </div>
        </div>

        <button className="start-button" onClick={onStart}>
          <span className="button-text">Comenzar Monitoreo</span>
          <div className="button-glow"></div>
          <div className="button-particles">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="button-particle"></div>
            ))}
          </div>
        </button>

        <div className="tech-stack">
          <div className="tech-badge">React</div>
          <div className="tech-badge">TypeScript</div>
          <div className="tech-badge">ThingSpeak</div>
          <div className="tech-badge">FastAPI</div>
        </div>
      </div>

      {/* Decoración de esquinas */}
      <div className="corner-decoration corner-top-left"></div>
      <div className="corner-decoration corner-top-right"></div>
      <div className="corner-decoration corner-bottom-left"></div>
      <div className="corner-decoration corner-bottom-right"></div>
    </div>
  );
}
