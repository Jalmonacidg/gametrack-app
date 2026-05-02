import { useQuery } from '@tanstack/react-query'
import { getTodayHistory } from '../../services/api'

export default function HistoryPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['todayHistory'],
    queryFn: getTodayHistory,
    refetchInterval: 15000
  })

  if (isLoading) return <div className="panel"><p className="empty">Cargando historial...</p></div>

  const tickets = data?.tickets ?? []

  return (
    <div className="panel" style={{ marginTop: '1rem' }}>
      <div className="history-header">
        <h2 className="panel-title">Historial de hoy</h2>
        <div className="history-stats">
          <span className="history-stat">
            <strong>{data?.total_tickets ?? 0}</strong> tickets
          </span>
          <span className="history-stat">
            <strong>S/ {data?.total_revenue?.toFixed(2) ?? '0.00'}</strong> ingresos
          </span>
          {data?.avg_wait_min && (
            <span className="history-stat">
              <strong>{data.avg_wait_min} min</strong> espera promedio
            </span>
          )}
        </div>
      </div>

      {tickets.length === 0 ? (
        <p className="empty">No hay tickets finalizados hoy</p>
      ) : (
        <table className="tickets-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Juego</th>
              <th>Emitido</th>
              <th>Duración</th>
              <th>Precio</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(ticket => (
              <tr key={ticket.id}>
                <td className="mono">{ticket.code}</td>
                <td>{ticket.game_id}</td>
                <td className="secondary">
                  {new Date(ticket.emitted_at + 'Z').toLocaleTimeString('es-PE', {
                    hour: '2-digit', minute: '2-digit'
                  })}
                </td>
                <td className="secondary">{ticket.duration_minutes} min</td>
                <td>S/ {parseFloat(ticket.price).toFixed(2)}</td>
                <td>
                  <span className={`pill ${ticket.status.toLowerCase()}`}>
                    {ticket.status === 'FINALIZADO' ? 'Finalizado' : 'Vencido'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}