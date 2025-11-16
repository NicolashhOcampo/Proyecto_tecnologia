import { useState } from 'react'
import { NotificationPanel } from './components/NotificationPanel'
import { DataSender } from './components/DataSender'
import { MetricsCard } from './components/MetricsCard'
import { Welcome } from './components/Welcome'
import { Stabilizer } from './components/Stabilizer'
import logo from './assets/logo.png'
import './App.css'

function App() {
  const [showWelcome, setShowWelcome] = useState(true)

  const handleStart = () => {
    setShowWelcome(false)
  }

  if (showWelcome) {
    return <Welcome onStart={handleStart} />
  }

  return (
    <div className="app app-fade-in">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <img src={logo} alt="Logo" className="logo-image" />
            </div>
            <div className="header-text">
              <h1>Monitor de Temperatura y Humedad</h1>
              <p className="subtitle">Sistema de monitoreo IoT con ThingSpeak y notificaciones WhatsApp</p>
            </div>
          </div>
          <div className="status-badge">
            <span className="status-dot"></span>
            <span>Sistema Activo</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="grid-layout">
          <div className="grid-full">
            <MetricsCard />
          </div>
          
          <div className="grid-full">
            <Stabilizer />
          </div>
          
          <div className="grid-half">
            <NotificationPanel />
          </div>
          
          <div className="grid-half">
            <DataSender />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p>Proyecto Tecnología para la Automatización 2025</p>
        </div>
      </footer>
    </div>
  )
}

export default App
