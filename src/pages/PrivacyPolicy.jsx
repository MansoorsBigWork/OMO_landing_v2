import { useEffect } from 'react'
import Header from '../components/Header.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import '../styles/privacy.css'

const LAST_UPDATED = '15 September 2026'
const PRIVACY_EMAIL = 'buildingomo@gmail.com'
const COMPANY_NUMBER = '17287603'
const ADDRESS = '14 Newark Avenue, Manchester, England, M14 4HE'

const US_SAFEGUARDS = 'US, with UK-approved safeguards'

const SECTIONS = [
  { id: 'who-we-are', title: 'Who we are' },
  { id: 'who-can-use-omo', title: 'Who can use OMO' },
  { id: 'data-we-collect', title: 'What data we collect' },
  { id: 'legal-basis', title: 'Why we use your data and our legal basis' },
  { id: 'who-can-see-your-data', title: 'Who can see your data' },
  { id: 'service-providers', title: 'Service providers we share data with' },
  { id: 'retention', title: 'How long we keep your data' },
  { id: 'security', title: 'How we protect your data' },
  { id: 'your-rights', title: 'Your rights' },
  { id: 'changes', title: 'Changes to this policy' },
  { id: 'contact', title: 'Contact' },
]

const LEGAL_BASES = [
  { use: 'Creating and running your account', why: 'to provide the service you signed up for', basis: 'performance of a contract' },
  { use: 'Handling your sign-up form', why: 'to review your application and get in touch with you about OMOships', basis: 'performance of a contract' },
  { use: 'Showing student profiles to verified employers', why: 'the core purpose of the platform, connecting students with opportunities', basis: 'performance of a contract' },
  { use: 'Sending you service emails (account confirmation, password reset, application updates)', why: 'to operate the platform', basis: 'performance of a contract' },
  { use: 'Sending you newsletters or marketing emails', why: 'to tell you about new opportunities and features', basis: 'consent, which you can withdraw at any time' },
  { use: 'Analytics (page views, clicks)', why: 'to understand what works and improve the platform', basis: 'legitimate interests' },
  { use: 'Session replay', why: 'to find and fix usability problems', basis: 'legitimate interests' },
  { use: 'Security monitoring and fraud prevention', why: 'to keep the platform and your data safe', basis: 'legitimate interests' },
  { use: 'Complying with legal obligations', why: 'for example responding to lawful requests from authorities', basis: 'legal obligation' },
]

const PROVIDERS = [
  { name: 'Supabase', purpose: 'database, authentication and file storage', location: 'Ireland (EU)' },
  { name: 'Netlify', purpose: 'hosting the website and platform', location: US_SAFEGUARDS },
  { name: 'PostHog', purpose: 'analytics and session replay', location: US_SAFEGUARDS },
  { name: 'Google', purpose: 'Sign in with Google (only if you use it)', location: US_SAFEGUARDS },
  { name: 'LinkedIn', purpose: 'Sign in with LinkedIn (only if you use it)', location: US_SAFEGUARDS },
  { name: 'Supabase', purpose: 'sending account and notification emails', location: 'Ireland (EU)' },
  { name: 'Tally', purpose: 'the sign-up form on our website', location: 'EU' },
]

function PrivacyEmail() {
  return <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>
}

function Section({ id, children }) {
  const index = SECTIONS.findIndex((s) => s.id === id)
  return (
    <section className="pp-section" id={id}>
      <h2><span className="pp-num">{index + 1}</span>{SECTIONS[index].title}</h2>
      {children}
    </section>
  )
}

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Privacy Policy — OMO'
  }, [])

  return (
    <div className="pp">
      <Header />

      <main>
        <section className="pp-hero">
          <div className="pp-hero-inner">
            <span className="pp-tag">{'// LEGAL'}</span>
            <h1>Privacy Policy</h1>
            <p className="pp-meta">One Million Opportunities Ltd · Last updated {LAST_UPDATED}</p>
            <p className="pp-lead">
              This policy explains what personal data One Million Opportunities Ltd (“OMO”, “we”, “us”) collects
              when you use onemillionopportunities.com and the OMO platform, why we collect it, who we share it
              with, and the rights you have over it.
            </p>
            <p className="pp-lead">
              We have written this in plain English because many of our users are students. If anything is
              unclear, email us at <PrivacyEmail /> and we will explain.
            </p>
          </div>
        </section>

        <div className="pp-layout">
          <nav className="pp-toc" aria-label="On this page">
            <p className="pp-toc-label">On this page</p>
            <ol>
              {SECTIONS.map((s) => (
                <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>
              ))}
            </ol>
          </nav>

          <div className="pp-body">
            <Section id="who-we-are">
              <p>
                One Million Opportunities Ltd is a company registered in England and Wales, company number{' '}
                {COMPANY_NUMBER}, registered office at {ADDRESS}. We are the data controller for the personal data
                described in this policy.
              </p>
              <p>Contact for anything related to your data: <PrivacyEmail /></p>
            </Section>

            <Section id="who-can-use-omo">
              <p>
                You must be at least 16 years old to create an account. If we learn that an account belongs to
                someone under 16, we will delete it.
              </p>
            </Section>

            <Section id="data-we-collect">
              <h3>3.1 Data you give us</h3>

              <h4>When you sign up through the form on our website</h4>
              <ul>
                <li>Your name</li>
                <li>The other details and answers you give on the form</li>
              </ul>

              <h4>When you create an account</h4>
              <ul>
                <li>Name and email address</li>
                <li>A password, which we store only in hashed form and can never read</li>
                <li>Your role (student or employer)</li>
              </ul>

              <h4>If you sign in with Google or LinkedIn</h4>
              <ul>
                <li>Your name and email address as provided by that service</li>
                <li>
                  We do not receive your password, contacts, connections, posts or any other data from your Google
                  or LinkedIn account
                </li>
              </ul>

              <h4>Student profile</h4>
              <ul>
                <li>University, course and expected graduation year</li>
                <li>Bio and LinkedIn profile URL, if you choose to add them</li>
                <li>Your CV, if you choose to upload it</li>
                <li>Your answers to the onboarding quiz about your career interests and preferences</li>
              </ul>

              <h4>Employer profile</h4>
              <ul>
                <li>Company name, website and your job title</li>
              </ul>

              <h4>Communications</h4>
              <ul>
                <li>Anything you send us by email or through the platform, including support requests</li>
              </ul>

              <h3>3.2 Data we collect automatically</h3>

              <h4>Analytics</h4>
              <p>
                We use PostHog, an analytics service, to understand how people use the platform. PostHog doesn’t use
                cookies or store anything on your device. It records:
              </p>
              <ul>
                <li>Pages you visit and buttons you click</li>
                <li>Your browser type, device type, operating system and screen size</li>
                <li>Your approximate location (country and city) derived from your IP address</li>
                <li>The site that referred you to us</li>
                <li>A random identifier for your visit, which isn’t stored on your device and resets each time you open the site</li>
              </ul>

              <h4>Session replay</h4>
              <p>
                PostHog also records a replay of how you move through the platform: mouse movements, scrolling and
                clicks. Text you type into forms, your CV contents and your password are masked before recording and
                are never captured.
              </p>
              <p>
                If your browser sends a “Do Not Track” signal, PostHog won’t record your visit at all. You can also
                object to analytics and session replay at any time (see <a href="#your-rights">section 9</a>).
              </p>

              <h4>Technical logs</h4>
              <p>
                Our hosting and database providers keep standard server logs including IP address, request time and
                pages requested. These are used for security and to fix errors.
              </p>

              <h3>3.3 Data we do not collect</h3>
              <p>
                We do not collect special category data (health, ethnicity, religion, sexual orientation, political
                opinions or similar) and we ask that you do not include it in your CV or bio. We do not scrape or
                import data from your LinkedIn profile beyond the sign-in details listed above.
              </p>
            </Section>

            <Section id="legal-basis">
              <p>UK data protection law requires us to have a legal basis for each use of your data.</p>
              {LEGAL_BASES.map(({ use, why, basis }) => (
                <p key={use}>
                  <strong>{use}.</strong> Why: {why}. Legal basis: {basis}.
                </p>
              ))}
              <p>
                Where we rely on legitimate interests, we have checked that our interest does not override your
                rights. You can object to any processing based on legitimate interests (see{' '}
                <a href="#your-rights">section 9</a>).
              </p>
            </Section>

            <Section id="who-can-see-your-data">
              <h4>Employers</h4>
              <p>
                If you are a student, all of the profile data listed in <a href="#data-we-collect">section 3.1</a>{' '}
                (name, email address, university, course, graduation year, bio, LinkedIn URL, quiz answers and CV)
                is visible to employers whose accounts we have verified. We verify employers manually before
                granting them access.
              </p>

              <h4>Other students</h4>
              <p>Other students cannot see your profile.</p>

              <h4>OMO team</h4>
              <p>
                Members of the OMO team can access data where needed to run the platform, provide support and verify
                employers. Access is limited to what each role requires.
              </p>
            </Section>

            <Section id="service-providers">
              <p>
                We use the following companies to run the platform. Each processes data only on our instructions and
                under a contract that requires them to protect it.
              </p>
              <ul>
                {PROVIDERS.map(({ name, purpose, location }) => (
                  <li key={`${name}-${purpose}`}>
                    <strong>{name}:</strong> {purpose}. Data location: {location}.
                  </li>
                ))}
              </ul>
              <p>
                Where a provider is outside the UK, we rely on the UK International Data Transfer Agreement, the UK
                Addendum to the EU Standard Contractual Clauses, or an adequacy decision.
              </p>
              <p className="pp-callout">We do not sell your personal data. We do not share it with advertisers.</p>
            </Section>

            <Section id="retention">
              <ul>
                <li>
                  <strong>Account and profile data:</strong> for as long as your account is active, then deleted
                  within 30 days of you closing your account
                </li>
                <li><strong>CVs:</strong> deleted when you remove them or close your account</li>
                <li>
                  <strong>Analytics data:</strong> PostHog retains event data for 12 months and session replays for
                  30 days
                </li>
                <li><strong>Emails and support correspondence:</strong> 2 years</li>
                <li><strong>Server logs:</strong> 90 days</li>
              </ul>
              <p>
                If your account is inactive for 24 months we will email you, and if you do not respond within 30 days
                we will delete it.
              </p>
            </Section>

            <Section id="security">
              <ul>
                <li>All data is encrypted in transit (HTTPS) and at rest</li>
                <li>Passwords are hashed and cannot be read by anyone, including us</li>
                <li>Database access is controlled so that each user can only read the data they are entitled to</li>
                <li>CVs are stored in private storage and are never accessible by public link</li>
                <li>
                  Access to production systems is limited to named team members and protected with two-factor
                  authentication
                </li>
              </ul>
              <p>
                No system is completely secure. If we become aware of a breach affecting your data we will inform you
                and the Information Commissioner’s Office as required by law.
              </p>
            </Section>

            <Section id="your-rights">
              <p>You have the right to:</p>
              <ul>
                <li>Access the personal data we hold about you</li>
                <li>Correct anything that is inaccurate (you can edit most of this yourself in your profile)</li>
                <li>
                  Delete your data (“right to erasure”). You can delete your account from your settings page, or
                  email us
                </li>
                <li>Restrict how we use your data in certain circumstances</li>
                <li>Object to processing based on legitimate interests</li>
                <li>Receive a copy of your data in a portable format</li>
                <li>Withdraw consent at any time for anything we do based on consent, such as marketing emails</li>
              </ul>
              <p>
                To exercise any of these, email <PrivacyEmail />. We will respond within one month. We may ask you
                to confirm your identity first.
              </p>
              <p>
                If you are unhappy with how we handle your data you can complain to the Information Commissioner’s
                Office at <a href="https://ico.org.uk" target="_blank" rel="noreferrer">ico.org.uk</a> or on{' '}
                <a href="tel:+443031231113">0303 123 1113</a>. We would appreciate the chance to resolve your
                concern first.
              </p>
            </Section>

            <Section id="changes">
              <p>
                We will update this policy when our practices change. If the change is significant we will email you
                or show a notice on the platform before it takes effect. The date at the top shows when it was last
                updated.
              </p>
            </Section>

            <Section id="contact">
              <address>
                One Million Opportunities Ltd<br />
                {ADDRESS}<br />
                <PrivacyEmail />
              </address>
            </Section>
          </div>
        </div>
      </main>

      <footer className="pp-footer">
        <SiteFooter />
      </footer>
    </div>
  )
}
