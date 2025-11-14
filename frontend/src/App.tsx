import { NotificationPanel } from './components/NotificationPanel'
import { DataSender } from './components/DataSender'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🌡️ Monitor de Temperatura y Humedad</h1>
        <p>Sistema de monitoreo IoT con ThingSpeak y notificaciones WhatsApp</p>
      </header>

      <main className="app-main">
        <div className="grid-layout">
          <div className="grid-half">
            <NotificationPanel />
          </div>
          
          <div className="grid-half">
            <DataSender />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Proyecto Tecnología - Monitor IoT © 2025</p>
      </footer>
    </div>
  )
}

export default App
