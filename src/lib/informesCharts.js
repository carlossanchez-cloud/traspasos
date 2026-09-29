// Datos puros para las 3 gráficas de Informes (reunión "PLATAFORMA SUSTITUTOS" 2026-09-29),
// separados del render en InformesCharts.jsx para poder testear sin DOM (mismo patrón que
// matching.js/kmGuard.js).
export function rankBy(rows, key) {
  const counts = {}
  for (const r of rows) {
    const label = r[key] || 'Sin dato'
    counts[label] = (counts[label] || 0) + 1
  }
  return Object.entries(counts).map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n)
}

// Últimos 6 meses en orden cronológico (no por conteo, por eso no es un rankBy más).
export function prestamosPorMes(rows, now = new Date()) {
  const meses = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    meses.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' }) })
  }
  const counts = Object.fromEntries(meses.map((m) => [m.key, 0]))
  for (const r of rows) {
    const key = (r.fecha_inicio || '').slice(0, 7)
    if (key in counts) counts[key]++
  }
  return meses.map((m) => ({ label: m.label, n: counts[m.key] }))
}
