import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import Header from '../components/Header.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import simonPhoto from '../assets/simon-squibb.png'

const STEPS = [
  { title: 'Pick an OMOship', body: 'Browse live OMOships. Pick one. You’re in.' },
  { title: 'Do the project', body: 'A real brief from a real company — done from your laptop, your hours.' },
  { title: 'Build your proof', body: 'Walk away with CV-ready evidence you did real work.' },
  { title: 'Get hired', body: 'Stand out to the company that set the brief — and land the role.' },
]

const FUNNEL = [
  { num: '01', title: 'Post', desc: 'Turn a real piece of your team’s work into a graded OMOship.' },
  { num: '02', title: 'See them ranked', desc: 'Students work the brief, scored on real output. The ranking reflects who can actually do the job.' },
  { num: '03', title: 'Hire the top of the funnel', desc: "You've seen the work and the scores. Make offers to people who earned it - not just CVs." },
]

const COMPARISON = [
  { omo: <><strong>Real company problems</strong>, not simulations.</>, others: 'Mostly simulated or pre-built exercises.' },
  { omo: <>Students are <strong>graded and ranked</strong> on actual output.</>, others: 'Students usually just complete tasks or earn completion certificates.' },
  { omo: <>Companies get access to a <strong>vetted talent pool</strong> they can hire from directly.</>, others: 'Companies mainly get brand exposure or early-career engagement.' },
  { omo: <>Built to <strong>connect learning, assessment, and hiring</strong> in one loop.</>, others: 'Usually focused on just one part of the journey.' },
]

const SWEEP_MS = 480

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const canAnimateSweep = () => !prefersReducedMotion() && 'IntersectionObserver' in window

/* Lights items 0 → count-1 in sequence once `ref` scrolls into view and rests on the last.
   Returns the lit index, or -1 before the sweep has started. */
function useScrollSweep(ref, count, { enterAt, threshold, rootMargin }) {
  const [active, setActive] = useState(() => (canAnimateSweep() ? -1 : count - 1))

  useEffect(() => {
    if (!canAnimateSweep()) return
    const el = ref.current
    const timers = []
    let played = false

    const play = () => {
      if (played) return
      played = true
      window.removeEventListener('scroll', checkInView)
      io.disconnect()
      for (let i = 0; i < count; i++) {
        timers.push(setTimeout(() => setActive(i), i * SWEEP_MS))
      }
    }
    // Primary trigger: the row's top crosses `enterAt` of the viewport height
    const checkInView = () => {
      const r = el.getBoundingClientRect()
      if (r.top < window.innerHeight * enterAt && r.bottom > 0) play()
    }
    // Secondary trigger: covers fast jumps and anchor navigation
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) play()
    }, { threshold, rootMargin })

    io.observe(el)
    window.addEventListener('scroll', checkInView, { passive: true })
    checkInView()

    return () => {
      window.removeEventListener('scroll', checkInView)
      io.disconnect()
      timers.forEach(clearTimeout)
    }
  }, [ref, count, enterAt, threshold, rootMargin])

  return active
}

export default function Home() {
  const heroRef = useRef(null)
  const howRef = useRef(null)
  const stepsRef = useRef(null)
  const bizRef = useRef(null)
  const funnelRef = useRef(null)
  const diffRef = useRef(null)
  const contactRef = useRef(null)

  const litStep = useScrollSweep(stepsRef, STEPS.length, { enterAt: 0.85, threshold: 0.18, rootMargin: '0px 0px -12% 0px' })
  const litPoint = useScrollSweep(funnelRef, FUNNEL.length, { enterAt: 0.82, threshold: 0.28, rootMargin: '0px 0px -10% 0px' })

  useEffect(() => {
    document.title = 'OMO — Get an OMOship instead'
  }, [])

  /* The how card pulls up over the hero; later cards slide up into their resting overlap */
  useEffect(() => {
    const MAX_OVERLAP = 18 // px the how card can lift over the hero
    const RATE = 0.08 // fraction of scroll converted to lift
    const slides = [
      { el: bizRef.current, travel: 96, end: 0.42 },
      { el: diffRef.current, travel: 180, end: 0.3 },
      { el: contactRef.current, travel: 180, end: 0.3 },
    ]
    const animateSlides = !prefersReducedMotion()
    if (!animateSlides) slides.forEach(({ el }) => { el.style.transform = 'translateY(0)' })

    const sync = () => {
      // Only lift while the hero is on-screen
      const heroOnScreen = heroRef.current.getBoundingClientRect().bottom > -200
      const lift = heroOnScreen ? Math.min(MAX_OVERLAP, Math.max(0, window.scrollY * RATE)) : MAX_OVERLAP
      howRef.current.style.transform = `translateY(${-lift}px)`

      if (!animateSlides) return
      const vh = window.innerHeight
      for (const { el, travel, end } of slides) {
        // p=0 when the card's top enters at the bottom edge, p=1 once it reaches `end` up the viewport
        const p = Math.max(0, Math.min(1, (vh - el.getBoundingClientRect().top) / (vh - vh * end)))
        el.style.transform = `translateY(${(1 - p) * travel}px)`
      }
    }

    window.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    sync()
    return () => {
      window.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [])

  return (
    <div className="page">
      <Header />

      <main className="hero" ref={heroRef}>
        <section className="left">
          <h1>No<br />Summer<br />Internship?</h1>
          <p className="subhead">Get an <span className="omoship-word">OMOship</span> instead.</p>

          <div className="cta-row">
            <Link className="cta" to="/portal">
              <span className="label-txt">Get an OMOship</span>
            </Link>
          </div>
          <p className="note">A remote internship with a real company on a real problem.</p>
        </section>

        <section className="right">
          <div className="scribble">
            <div className="txt">From home. real companies. <span className="hl">real xp</span></div>
          </div>

          <div className="photo-wrap">
            <img className="photo" src={simonPhoto} alt="Simon Squibb" />
          </div>

          <div className="caption">
            <span className="label">OMOships are backed by</span>
            <span className="name">Simon Squibb</span>
          </div>
        </section>
      </main>

      <section className="how" id="how" ref={howRef}>
        <div className="how-intro">
          <span className="product-tag">HOW IT WORKS</span>
          <h2 className="how-title"><s>Internships</s><br />OMOSHIPS</h2>
          <p className="how-sub">A real company. A real project. Done from your laptop.</p>
        </div>

        <ol className={`steps${litStep >= 0 ? ' is-revealed' : ''}`} ref={stepsRef}>
          {STEPS.map((step, i) => (
            <li key={step.title} className={`step${i === litStep ? ' lit' : ''}`}>
              <div className="step-num">{i + 1}</div>
              <div className="step-text">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-body">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="biz" id="for-business" ref={bizRef}>
        <div className="biz-grid">
          <div className="biz-intro">
            <span className="biz-tag">FOR BUSINESSES</span>
            <h2 className="biz-title"><span>The OMO </span><em>Funnel.</em></h2>
            <p className="biz-sub">Entry level talent who’ve worked your problems and earned their place by performance.</p>
          </div>

          <div className="biz-points" ref={funnelRef}>
            {FUNNEL.map((point, i) => (
              <div
                key={point.num}
                className={`biz-point${i === litPoint ? ' lit' : ''}${i < litPoint ? ' done' : ''}`}
              >
                <span className="pt-num">{point.num}</span>
                <div className="pt-body">
                  <span className="pt-title">{point.title}</span>
                  <span className="pt-desc">{point.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="diff" id="different" ref={diffRef}>
        <div className="diff-grid">
          <div className="diff-intro">
            <span className="diff-tag">DIFFERENTIATOR</span>
            <h2 className="diff-title">What makes<br />us different?</h2>
          </div>
          <div className="diff-card">
            <table className="comp-table">
              <thead>
                <tr>
                  <th>OMO</th>
                  <th>Competitors</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.others}>
                    <td>
                      <div className="cell-content">
                        <span className="badge-icon tick">✔</span>
                        <p>{row.omo}</p>
                      </div>
                    </td>
                    <td>
                      <div className="cell-content">
                        <span className="badge-icon cross">✘</span>
                        <p>{row.others}</p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="contact" id="contact" ref={contactRef}>
        <div className="contact-inner">
          <span className="contact-tag">GET STARTED</span>
          <h2 className="contact-title">Get experience<br /><em>today.</em></h2>
          <p className="contact-sub">Your career gap starts closing the moment you sign up. Real projects with Real companies. Real experience.</p>
          <div className="cta-contact-row">
            <Link className="cta-contact" to="/portal">
              Get an OMOship <span className="arrow">→</span>
            </Link>
            <div className="contact-info">
              <span className="contact-info-label">Have Questions?</span>
              <span className="contact-info-main">
                Contact Us <a href="mailto:buildingomo@gmail.com" className="contact-email">buildingomo@gmail.com</a>
              </span>
            </div>
          </div>
          <SiteFooter />
        </div>
      </section>
    </div>
  )
}
