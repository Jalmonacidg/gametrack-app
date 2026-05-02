import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' }
})

// ─── GAMES ───────────────────────────────────────
export const getGames = () =>
  api.get('/games/').then(r => r.data)

// ─── TICKETS ─────────────────────────────────────
export const getActiveTickets = () =>
  api.get('/tickets/active').then(r => r.data)

export const emitTicket = (game_id, duration_minutes) =>
  api.post('/tickets/emit', { game_id, duration_minutes }).then(r => r.data)

export const startTicket = (ticket_id) =>
  api.patch(`/tickets/${ticket_id}/start`).then(r => r.data)

export const endTicket = (ticket_id) =>
  api.patch(`/tickets/${ticket_id}/end`).then(r => r.data)

export const expireTicket = (ticket_id) =>
  api.patch(`/tickets/${ticket_id}/expire`).then(r => r.data)

export const getTodayHistory = () =>
  api.get('/tickets/history/today').then(r => r.data)