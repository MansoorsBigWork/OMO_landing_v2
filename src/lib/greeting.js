/* Time-of-day greetings from the device's own clock and time zone. Each band runs until the hour in `until`. */
const PHRASES = [
  { until: 5, lines: ['Burning the midnight oil, {n}?', 'Still going, {n}?', 'Night shift, {n}?', 'Late one tonight, {n}?'] },
  { until: 8, lines: ['Early start, {n}', 'Up before the rest, {n}', 'Early bird, {n}', 'Good morning, {n}'] },
  { until: 12, lines: ['Good morning, {n}', 'Morning, {n}', 'Fresh start, {n}', 'Let’s get going, {n}'] },
  { until: 17, lines: ['Good afternoon, {n}', 'Welcome back, {n}', 'Afternoon, {n}', 'Back at it, {n}'] },
  { until: 22, lines: ['Good evening, {n}', 'Evening, {n}', 'Welcome back, {n}', 'Evening session, {n}?'] },
  { until: 24, lines: ['Late one tonight, {n}?', 'Still going, {n}?', 'Good evening, {n}', 'One more push, {n}?'] },
]

export function greeting(firstName) {
  const name = firstName?.trim()
  const hour = new Date().getHours()
  const lines = PHRASES.find((p) => hour < p.until).lines
  const line = lines[Math.floor(Math.random() * lines.length)]
  return name ? line.replace('{n}', name) : line.replace(/, \{n\}/, '')
}

export function firstVisitGreeting(firstName) {
  const name = firstName?.trim()
  return name ? `Welcome to OMO, ${name}` : 'Welcome to OMO'
}
