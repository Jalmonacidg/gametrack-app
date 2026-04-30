// Calcula minutos y segundos restantes dado un estimated_end_at
export function getTimeRemaining(estimatedEndAt) {
  if (!estimatedEndAt) return null

  const now = new Date()
  // Forzar parseo UTC agregando Z si no la tiene
  const endStr = estimatedEndAt.endsWith('Z') ? estimatedEndAt : estimatedEndAt + 'Z'
  const end = new Date(endStr)
  const diffMs = end - now

  if (diffMs <= 0) return { minutes: 0, seconds: 0, expired: true }

  const totalSeconds = Math.floor(diffMs / 1000)
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
    expired: false
  }
}

export function formatTime(timeObj) {
  if (!timeObj) return '--:--'
  if (timeObj.expired) return 'VENCIDO'
  const m = String(timeObj.minutes).padStart(2, '0')
  const s = String(timeObj.seconds).padStart(2, '0')
  return `${m}:${s}`
}