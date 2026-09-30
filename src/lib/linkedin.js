/* Turns whatever the student typed into https://www.linkedin.com/in/<handle>, dropping query strings and
   trailing slashes. Returns { value } (null when blank) or { error } with a message to show. */
export function normaliseLinkedIn(input) {
  const raw = (input ?? '').trim()
  if (!raw) return { value: null }

  let url
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
  } catch {
    return { error: 'Enter your LinkedIn profile link, like linkedin.com/in/yourname' }
  }

  const host = url.hostname.toLowerCase()
  const isLinkedIn = host === 'linkedin.com' || host.endsWith('.linkedin.com')
  const match = url.pathname.match(/^\/in\/([A-Za-z0-9_%-]{3,100})\/?$/)
  if (!isLinkedIn || !match) {
    return { error: 'Enter your LinkedIn profile link, like linkedin.com/in/yourname' }
  }
  return { value: `https://www.linkedin.com/in/${match[1]}` }
}
