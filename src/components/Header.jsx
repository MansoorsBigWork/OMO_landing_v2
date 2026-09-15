import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import logo from '../assets/omo-logo.png'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const sync = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', sync, { passive: true })
    sync()
    return () => window.removeEventListener('scroll', sync)
  }, [])

  return (
    <header className={scrolled ? 'is-scrolled' : undefined}>
      <Link to="/">
        <img className="logo" src={logo} alt="OMO" />
      </Link>
      <nav className="nav" aria-label="Primary">
        <Link className="nav-link" to="/#how">How it works</Link>
        <Link className="nav-link" to="/#for-business">For businesses</Link>
        <Link className="nav-link" to="/#different">What makes us different</Link>
        <Link className="nav-link" to="/#contact">Contact Us</Link>
        <Link className="nav-link nav-cta" to="/login">Log in</Link>
      </nav>
    </header>
  )
}
