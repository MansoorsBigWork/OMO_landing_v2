import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { useLocation } from "react-router";
import {
  aiBox,
  buildCopy,
  getCode,
  memo,
  plannerContract,
  prerequisites,
  rulesBox,
  sections,
  simFiles,
  starter,
  submission,
} from "./data";
import { ukDeliveryNetwork as course } from "../course";
import { Callout, ChecklistItem, CodeBlock, StatusChip } from "./components";
import FileTree from "./FileTree";
import SubmissionForm from "./SubmissionForm";
import viewerShot from "./assets/viewer-s01.png";
import { capture } from "../../shared/lib/analytics";
import { readBuildState, readSubmission, recordBuildState } from "../../shared/lib/progressStore";
import "./build.css";

/* The build page (Build Brief B): the document the student lives in for
   the OMOship. Dark on the dk tokens; five sections; everything quoted
   from the starter at v1.0.0. */


function Section({
  meta,
  read,
  onToggleRead,
  children,
}: PropsWithChildren<{ meta: (typeof sections)[number]; read: boolean; onToggleRead: (id: string) => void }>) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section ref={ref} id={meta.id} className="bp-section" aria-labelledby={`${meta.id}-h`} data-section>
      <h2 id={`${meta.id}-h`}>
        <span className="bp-num" aria-hidden="true">
          {meta.number}
        </span>
        {meta.title}
      </h2>
      {children}
      <button
        type="button"
        className={`bp-markread${read ? " is-read" : ""}`}
        aria-pressed={read}
        onClick={() => onToggleRead(meta.id)}
      >
        {read && (
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
        {read ? buildCopy.markedRead : buildCopy.markRead}
      </button>
    </section>
  );
}

export default function Build() {
  const [state, setState] = useState(() => readBuildState(course.slug));
  const [current, setCurrent] = useState(sections[0].id);
  const [submitted, setSubmitted] = useState(() => readSubmission(course.slug));
  const saveTimer = useRef(0);
  const stateRef = useRef(state);
  const { hash } = useLocation();

  /* Router navigation to a #section (the course sidebar) does not
     scroll natively, so follow the hash whenever it changes. */
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  const persist = useCallback((next: typeof state) => {
    stateRef.current = next;
    setState(next);
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => recordBuildState(course.slug, stateRef.current), 500);
  }, []);

  useEffect(() => {
    capture("build_page_viewed");
    const saved = readBuildState(course.slug);
    /* A section hash from the course sidebar wins over the saved place */
    if (window.location.hash) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    } else if (saved.scroll > 0) window.scrollTo(0, saved.scroll);
    const onScroll = () => {
      stateRef.current = { ...stateRef.current, scroll: window.scrollY };
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => recordBuildState(course.slug, stateRef.current), 500);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(saveTimer.current);
    };
  }, []);

  /* Scrollspy for the nav */
  useEffect(() => {
    const els = Array.from(document.querySelectorAll("[data-section]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setCurrent(e.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const togglePrereq = useCallback(
    (id: string) => {
      const has = state.prereqs.includes(id);
      persist({ ...state, prereqs: has ? state.prereqs.filter((p) => p !== id) : [...state.prereqs, id] });
    },
    [persist, state],
  );

  const toggleRead = useCallback(
    (id: string) => {
      const has = state.readSections.includes(id);
      if (!has) capture("build_section_read", { section: id });
      persist({
        ...state,
        readSections: has ? state.readSections.filter((s) => s !== id) : [...state.readSections, id],
      });
    },
    [persist, state],
  );

  const status = useMemo(() => {
    if (submitted?.status === "released") return buildCopy.status.graded;
    if (submitted) return buildCopy.status.submitted;
    if (state.prereqs.length > 0 || state.readSections.length > 0 || state.scroll > 0)
      return buildCopy.status.inProgress;
    return buildCopy.status.notStarted;
  }, [submitted, state]);

  return (
    <div className="build-page">
      <header className="bp-header">
        <span className="bp-title">{buildCopy.header}</span>
        <StatusChip label={status} />
      </header>

      <div className="bp-columns">
        <nav className="bp-nav" aria-label={buildCopy.navLabel}>
          <ul>
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className={current === s.id ? "is-current" : undefined} aria-current={current === s.id ? "true" : undefined}>
                  {state.readSections.includes(s.id) && (
                    <svg viewBox="0 0 24 24" className="bp-nav-tick" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  )}
                  {s.navLabel}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="bp-content">
          <Section meta={sections[0]} read={state.readSections.includes("prerequisites")} onToggleRead={toggleRead}>
            <p>{prerequisites.intro}</p>
            <ul className="bp-checklist">
              {prerequisites.items.map((item) => (
                <ChecklistItem key={item.id} id={item.id} checked={state.prereqs.includes(item.id)} onToggle={togglePrereq}>
                  <strong>
                    <a href={item.link}>{item.name}</a>
                  </strong>
                  <span className="bp-muted"> {item.why}</span>
                  {item.verify && <CodeBlock code={item.verify} />}
                </ChecklistItem>
              ))}
            </ul>
            <p className="bp-muted">{prerequisites.video}</p>
          </Section>

          <Section meta={sections[1]} read={state.readSections.includes("the-brief")} onToggleRead={toggleRead}>
            <blockquote className="bp-memo">
              <p className="bp-memo-from">{memo.from}</p>
              {memo.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </blockquote>
            <p>{memo.after}</p>
            <h3>{memo.scoringTitle}</h3>
            <div className="bp-table-wrap">
              <table className="bp-table">
                <thead>
                  <tr>
                    <th scope="col">Measure</th>
                    <th scope="col">Weight</th>
                    <th scope="col">Why</th>
                  </tr>
                </thead>
                <tbody>
                  {memo.scoring.map((row) => (
                    <tr key={row.measure}>
                      <td>{row.measure}</td>
                      <td>{row.weight}</td>
                      <td className="bp-muted">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="bp-muted">{memo.scoringNote}</p>
          </Section>

          <Section meta={sections[2]} read={state.readSections.includes("project-files")} onToggleRead={toggleRead}>
            <p>{getCode.intro}</p>
            <div className="bp-repo-card">
              <p className="bp-repo-name">
                {starter.name} <span className="bp-tagpill">{starter.tag}</span>
              </p>
              <p className="bp-muted">{starter.description}</p>
              <p>
                <a className="bp-link" href={starter.repoUrl} target="_blank" rel="noreferrer">
                  {getCode.viewRepoLink}
                </a>
              </p>
            </div>
            <h3>{getCode.forkTitle}</h3>
            <p>{getCode.forkBody}</p>
            <p className="bp-repo-actions">
              <a
                className="bp-btn-primary"
                href={starter.forkUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => capture("build_fork_clicked")}
              >
                {getCode.forkButton}
              </a>
            </p>
            <h3>{getCode.cloneTitle}</h3>
            <p>{getCode.cloneBody}</p>
            <CodeBlock code={starter.cloneCommand} event="build_clone_copied" />
            <CodeBlock code={starter.cdCommand} />
            <p className="bp-muted">{getCode.cloneTip}</p>
            <h3>{getCode.runTitle}</h3>
            <p>{getCode.runBody}</p>
            {getCode.runSteps.map((cmd) => (
              <CodeBlock key={cmd} code={cmd} />
            ))}
            <figure className="bp-figure">
              <img src={viewerShot} alt={getCode.viewerCaption} width={1280} height={860} loading="lazy" />
              <figcaption className="bp-muted">{getCode.viewerCaption}</figcaption>
            </figure>
            <h3>{getCode.scoreTitle}</h3>
            <CodeBlock code={getCode.scoreCommand} />
            <CodeBlock code={getCode.naiveOutput} label="score.json" copyable={false} />
            <p>{getCode.scoreNote}</p>
            <h3>{getCode.scenariosTitle}</h3>
            <div className="bp-table-wrap">
              <table className="bp-table">
                <thead>
                  <tr>
                    <th scope="col">Scenario</th>
                    <th scope="col">Vans</th>
                    <th scope="col">Deliveries</th>
                    <th scope="col">Character</th>
                  </tr>
                </thead>
                <tbody>
                  {getCode.scenarios.map((s) => (
                    <tr key={s.id}>
                      <td>
                        {s.id} <span className="bp-muted">{s.name}</span>
                      </td>
                      <td>{s.vans}</td>
                      <td>{s.deliveries}</td>
                      <td className="bp-muted">{s.character}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              <strong>{getCode.eventsTitle}.</strong>{" "}
              {getCode.events.map((e, i) => (
                <span key={e.name}>
                  <em className="bp-term">{e.name}</em>: {e.plain}
                  {i < getCode.events.length - 1 ? ". " : "."}
                </span>
              ))}
            </p>
          </Section>

          <Section meta={sections[3]} read={state.readSections.includes("codebase")} onToggleRead={toggleRead}>
            <FileTree label={sections[3].title} tags={{ edit: "EDIT", readonly: "READ ONLY" }} />
            <h3>{simFiles.title}</h3>
            <p className="bp-muted">{simFiles.intro}</p>
            <dl className="bp-simfiles">
              {simFiles.files.map((f) => (
                <div key={f.name}>
                  <dt>{f.name}</dt>
                  <dd>{f.text}</dd>
                </div>
              ))}
            </dl>
            <h3>{plannerContract.title}</h3>
            <CodeBlock code={plannerContract.code} label="src/sim/types.ts" copyable={false} />
            <div className="bp-functions">
              {plannerContract.functions.map((fn) => (
                <article key={fn.name} className="bp-function">
                  <h4>
                    <code>{fn.name}</code>
                  </h4>
                  <dl>
                    <dt>When</dt>
                    <dd>{fn.when}</dd>
                    <dt>Receives</dt>
                    <dd>{fn.receives}</dd>
                    <dt>Returns</dt>
                    <dd>{fn.returns}</dd>
                    <dt>The stub</dt>
                    <dd>{fn.stub}</dd>
                  </dl>
                  <ul className="bp-prompts">
                    {fn.prompts.map((p) => (
                      <li key={p.slice(0, 24)}>{p}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <Callout variant="rules" title={rulesBox.title}>
              <ul>
                {rulesBox.rules.map((r) => (
                  <li key={r.slice(0, 24)}>{r}</li>
                ))}
              </ul>
            </Callout>
            <Callout variant="ai" title={aiBox.title}>
              <p>{aiBox.text}</p>
            </Callout>
          </Section>

          <Section meta={sections[4]} read={state.readSections.includes("submission")} onToggleRead={toggleRead}>
            <p>{submission.intro}</p>
            <h3>{submission.repoTitle}</h3>
            <ol className="bp-steps">
              {submission.repoSteps.map((s) => (
                <li key={s.slice(0, 24)}>{s}</li>
              ))}
            </ol>
            <p className="bp-muted">{submission.repoNote}</p>
            <h3>{submission.videoTitle}</h3>
            <ul className="bp-plain-list">
              {submission.videoRequirements.map((r) => (
                <li key={r.slice(0, 24)}>{r}</li>
              ))}
            </ul>
            <p>
              <strong>{submission.videoPromptsTitle}.</strong>
            </p>
            <ol className="bp-steps">
              {submission.videoPrompts.map((p) => (
                <li key={p.slice(0, 24)}>{p}</li>
              ))}
            </ol>
            <p className="bp-muted">{submission.videoHosting}</p>
            <Callout variant="assessment" title={submission.assessment.title}>
              <p>{submission.assessment.project}</p>
              <p>{submission.assessment.video}</p>
              <p className="bp-muted">{submission.assessment.criteria}</p>
              <p>
                <strong>{submission.assessment.line}</strong>
              </p>
            </Callout>
            <SubmissionForm onSubmitted={setSubmitted} />
          </Section>
        </div>
      </div>
    </div>
  );
}

