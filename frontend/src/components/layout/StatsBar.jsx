import { useQuery } from '@tanstack/react-query'
import { getActiveTickets } from '../../services/api'

export default function StatsBar() {
  const { data: tickets = [] } = useQuery({
    queryKey: ['activeTickets'],
    queryFn: getActiveTickets
  })

  const enJuego  = tickets.filter(t => t.status === 'EN_JUEGO').length
  const emitidos = tickets.filter(t => t.status === 'EMITIDO').length
  const ingresos = tickets.reduce((sum, t) => sum + parseFloat(t.price), 0)

  return (
    <div className="stats-bar">
      <div className="stat-card">
        <span className="stat-label">En juego ahora</span>
        <span className="stat-value green">{enJuego}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Esperando ingreso</span>
        <span className="stat-value amber">{emitidos}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Tickets activos</span>
        <span className="stat-value">{tickets.length}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Ingresos del día</span>
        <span className="stat-value">S/ {ingresos.toFixed(2)}</span>
      </div>
    </div>
  )
}