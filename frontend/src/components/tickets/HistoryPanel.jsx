import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTodayHistory } from '../../services/api'

export default function HistoryPanel() {
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterGame,   setFilterGame]   = useState('ALL')
  const [filterDate,   setFilterDate]   = useState('')


  const { data, isLoading } = useQuery({
    queryKey: ['todayHistory', filterDate],
    queryFn: () => getTodayHistory(filterDate || null),
    refetchInterval: 15000
  })


  const tickets = data?.tickets ?? []

  // Juegos únicos para el filtro
  const uniqueGameIds = [...new Set(tickets.map(t => t.game_id))]

  // Aplicar filtros
  const filtered = useMemo(() => {
    return tickets.filter(t => {
      const matchStatus = filterStatus === 'ALL' || t.status === filterStatus
      const matchGame   = filterGame   === 'ALL' || String(t.game_id) === filterGame
      const matchDate   = !filterDate  ||
        new Date(t.emitted_at + 'Z').toLocaleDateString('en-CA') === filterDate
      return matchStatus && matchGame && matchDate
    })
  }, [tickets, filterStatus, filterGame, filterDate])

  // Totales de los filtrados
  const totalFiltered  = filtered.length
  const revenueFiltered = filtered.reduce((s, t) => s + parseFloat(t.price), 0)

  // Exportar a CSV
  function exportCSV() {
    const headers = ['Codigo', 'Juego ID', 'Estado', 'Emitido', 'Duracion (min)', 'Precio']
    const rows = filtered.map(t => [
      t.code,
      t.game_id,
      t.status,
      new Date(t.emitted_at + 'Z').toLocaleString('es-PE'),
      t.duration_minutes,
      parseFloat(t.price).toFixed(2)
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `gametrack-historial-${filterDate || 'hoy'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) return (
    <div className="panel">
      <p className="empty">Cargando historial...</p>
    </div>
  )


  return (
    <div className="panel">
      <div className="history-header">
        <h2 className="panel-title">Historial de hoy</h2>
        <div className="history-stats">
          <span className="history-stat">
            <strong>{totalFiltered}</strong> tickets
          </span>
          <span className="history-stat">
            <strong>S/ {revenueFiltered.toFixed(2)}</strong> ingresos
          </span>
          {data?.avg_wait_min && (
            <span className="history-stat">
              <strong>{data.avg_wait_min} min</strong> espera prom.
            </span>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="history-filters">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="ALL">Todos los estados</option>
          <option value="FINALIZADO">Finalizado</option>
          <option value="VENCIDO">Vencido</option>
        </select>

        <select value={filterGame} onChange={e => setFilterGame(e.target.value)}>
          <option value="ALL">Todos los juegos</option>
          {uniqueGameIds.map(id => (
            <option key={id} value={String(id)}>Juego {id}</option>
          ))}
        </select>

        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          max={new Date().toLocaleDateString('en-CA')}
        />

        <button className="btn-export" onClick={exportCSV}>
          ⬇ Exportar CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="empty">No hay tickets con ese filtro</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="tickets-table">
            <thead>
              <tr>
                <th>Código</th>
                <th className="col-hide">Juego</th>
                <th>Estado</th>
                <th className="col-hide">Emitido</th>
                <th>Duración</th>
                <th>Precio</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ticket => (
                <tr key={ticket.id}>
                  <td className="mono">{ticket.code}</td>
                  <td className="col-hide secondary">{ticket.game_id}</td>
                  <td>
                    <span className={`pill ${ticket.status.toLowerCase()}`}>
                      {ticket.status === 'FINALIZADO' ? 'Finalizado' : 'Vencido'}
                    </span>
                  </td>
                  <td className="col-hide secondary">
                    {new Date(ticket.emitted_at + 'Z').toLocaleTimeString('es-PE', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="secondary">{ticket.duration_minutes} min</td>
                  <td>S/ {parseFloat(ticket.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}