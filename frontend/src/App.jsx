import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import GamePanel from './components/games/GamePanel'
import TicketPanel from './components/tickets/TicketPanel'
import StatsBar from './components/layout/StatsBar'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 5000,  // refresca datos cada 5 segundos
      staleTime: 0
    }
  }
})

export default function App() {
  const [selectedGame, setSelectedGame] = useState(null)

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <header className="topbar">
          <span className="topbar-title">🎮 GameTrack</span>
          <span className="topbar-date">
            {new Date().toLocaleDateString('es-PE', {
              weekday: 'long', year: 'numeric',
              month: 'long', day: 'numeric'
            })}
          </span>
        </header>

        <StatsBar />

        <main className="main-grid">
          <GamePanel
            selectedGame={selectedGame}
            onSelectGame={setSelectedGame}
          />
          <TicketPanel selectedGame={selectedGame} />
        </main>
      </div>
    </QueryClientProvider>
  )
}