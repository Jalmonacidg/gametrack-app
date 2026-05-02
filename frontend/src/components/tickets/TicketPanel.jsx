import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getActiveTickets, emitTicket, startTicket, endTicket, getGames } from '../../services/api'
import { getTimeRemaining, formatTime } from '../../utils/timer'
import { playAlert } from '../../utils/sound'

export default function TicketPanel({ selectedGame }) {
  const qc = useQueryClient()
  const [duration, setDuration] = useState(30)
  const [now, setNow] = useState(new Date())

  // Actualiza el reloj cada segundo para los timers
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const { data: tickets = [] } = useQuery({
    queryKey: ['activeTickets'],
    queryFn: getActiveTickets
  })

  const { data: games = [] } = useQuery({
  queryKey: ['games'],
  queryFn: getGames
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['activeTickets'] })

  const emit  = useMutation({ mutationFn: () => emitTicket(selectedGame.id, duration), onSuccess: invalidate })
  const start = useMutation({ mutationFn: (id) => startTicket(id), onSuccess: invalidate })
  const end   = useMutation({ mutationFn: (id) => endTicket(id),   onSuccess: invalidate })

  // Trackea qué tickets ya fueron alertados para no repetir el sonido
  const alertedRef = useRef(new Set())

  useEffect(() => {
    tickets
      .filter(ticket => ticket.status === 'EN_JUEGO')
      .forEach(ticket => {

        if (!ticket.estimated_end_at) return

        const timeObj = getTimeRemaining(ticket.estimated_end_at)

        if (timeObj?.expired && !alertedRef.current.has(ticket.id)) {
          alertedRef.current.add(ticket.id)
          playAlert()
        }
      })

  }, [tickets, now])
  

  return (
    <section className="panel">
      <div className="ticket-header">
        <h2 className="panel-title">Tickets activos</h2>

        {selectedGame && (
          <div className="emit-box">
            <span className="emit-game">{selectedGame.icon} {selectedGame.name}</span>
            <select value={duration} onChange={e => setDuration(Number(e.target.value))}>
              <option value={30}>30 min — S/ {selectedGame.price_30min}</option>
              {selectedGame.price_60min &&
                <option value={60}>60 min — S/ {selectedGame.price_60min}</option>}
            </select>
            <button
              className="btn-emit"
              onClick={() => emit.mutate()}
              disabled={emit.isPending}
            >
              {emit.isPending ? 'Emitiendo...' : '+ Emitir ticket'}
            </button>
          </div>
        )}

        {!selectedGame && (
          <span className="hint">← Selecciona un juego para emitir ticket</span>
        )}
      </div>

      <table className="tickets-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Juego</th>
            <th>Estado</th>
            <th>Emitido</th>
            <th>Tiempo</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {tickets.length === 0 && (
            <tr><td colSpan={6} className="empty">No hay tickets activos</td></tr>
          )}
          {tickets.map(ticket => {
            const timeObj  = getTimeRemaining(ticket.estimated_end_at)
            const timeStr  = ticket.status === 'EN_JUEGO' ? formatTime(timeObj) : '—'
            const expired  = timeObj?.expired

            return (
              <tr key={ticket.id} className={expired ? 'row-expired' : ''}>
                <td className="mono">{ticket.code}</td>
                <td>{games.find(g => g.id === ticket.game_id)?.name ?? '—'}</td>
                <td>
                  <span className={`pill ${ticket.status.toLowerCase()}`}>
                    {ticket.status === 'EN_JUEGO'  ? 'En juego' :
                     ticket.status === 'EMITIDO'   ? 'Esperando' : ticket.status}
                  </span>
                </td>
                <td className="secondary">
                  {new Date(ticket.emitted_at).toLocaleTimeString('es-PE', {
                    hour: '2-digit', minute: '2-digit'
                  })}
                </td>
                <td className={`timer ${expired ? 'danger' : ''}`}>
                  {timeStr}
                </td>
                <td>
                  {ticket.status === 'EMITIDO' && (
                    <button
                      className="btn-start"
                      onClick={() => start.mutate(ticket.id)}
                    >
                      Iniciar
                    </button>
                  )}
                  {ticket.status === 'EN_JUEGO' && (
                    <button
                      className="btn-end"
                      onClick={() => end.mutate(ticket.id)}
                    >
                      Finalizar
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}