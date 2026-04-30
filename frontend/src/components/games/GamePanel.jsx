import { useQuery } from '@tanstack/react-query'
import { getGames, getActiveTickets } from '../../services/api'

export default function GamePanel({ selectedGame, onSelectGame }) {
  const { data: games = [] } = useQuery({
    queryKey: ['games'],
    queryFn: getGames
  })

  const { data: tickets = [] } = useQuery({
    queryKey: ['activeTickets'],
    queryFn: getActiveTickets
  })

  function getOccupancy(gameId) {
    return tickets.filter(
      t => t.game_id === gameId && t.status === 'EN_JUEGO'
    ).length
  }

  function getStatus(game) {
    const occ = getOccupancy(game.id)
    if (occ >= game.capacity) return 'lleno'
    if (occ > 0) return 'ocupado'
    return 'libre'
  }

  return (
    <section className="panel">
      <h2 className="panel-title">Juegos</h2>
      <div className="games-grid">
        {games.map(game => {
          const occ    = getOccupancy(game.id)
          const status = getStatus(game)
          const active = selectedGame?.id === game.id

          return (
            <div
              key={game.id}
              className={`game-card ${status} ${active ? 'selected' : ''}`}
              onClick={() => status !== 'lleno' && onSelectGame(game)}
            >
              <span className="game-icon">{game.icon}</span>
              <span className="game-name">{game.name}</span>
              <span className="game-occ">{occ}/{game.capacity}</span>
              <span className={`badge ${status}`}>
                {status === 'lleno' ? 'Lleno' :
                 status === 'ocupado' ? 'Ocupado' : 'Libre'}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}