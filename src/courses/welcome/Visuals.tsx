import type { ReactElement } from "react";
import type { Omoship } from "../types";
import { companies, welcomeCopy, type WelcomeVisual } from "./copy";
import CountUp from "../shared/motion/CountUp";
import Spotlight from "../shared/motion/Spotlight";

/* The five slide visuals, drawn in code with OMO tokens. Never stock
   photography, no third-party logos; company names render as plain
   wordmarks and tools as generic glyphs with labels. */

function TimelineVisual({ omoship }: { omoship: Omoship }) {
  return (
    <div className="visual-timeline">
      <span className="sector-chip">{omoship.sector}</span>
      <div className="timeline-glyph" role="img" aria-label="A two week timeline, day one highlighted">
        {Array.from({ length: 14 }, (_, i) => (
          <span key={i} className={i === 0 ? "day is-lit" : "day"} />
        ))}
      </div>
    </div>
  );
}

function RepoVisual() {
  const repo = welcomeCopy.repo;
  const commitCount = parseInt(repo.commits, 10);
  const commitSuffix = repo.commits.replace(/^\d+\s*/, "");
  return (
    <Spotlight className="visual-repo" >
      <div role="img" aria-label={`A repository named ${repo.name} with ${repo.commits} and its key files`}>
      <div className="repo-head">
        <svg viewBox="0 0 24 24" className="repo-glyph" aria-hidden="true">
          <path d="M5 3.5h11a2.5 2.5 0 0 1 2.5 2.5v12.5H7A2 2 0 0 0 5 20.5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M5 20.5V5.5a2 2 0 0 1 2-2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        <span className="repo-name">{repo.name}</span>
        <span className="repo-check">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M7.5 12.5l3 3 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {repo.checks}
        </span>
      </div>
      <p className="repo-commits">
        <CountUp to={commitCount} /> {commitSuffix}
      </p>
      <ul className="repo-files">
        {repo.files.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      </div>
    </Spotlight>
  );
}

function CompaniesVisual() {
  if (companies.length < 3) return null;
  return (
    <div className="visual-companies">
      <p className="companies-kicker">{welcomeCopy.companiesKicker}</p>
      <ul className="companies-row">
        {companies.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  );
}

const TOOL_GLYPHS: Record<string, ReactElement> = {
  git: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="12" r="2.5" />
      <path d="M6 8.5v7M8 7.2l7.6 3.6" />
    </g>
  ),
  github: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 5.5A2 2 0 0 1 6.5 3.5H19.5v14H6.5a2 2 0 0 0-2 2z" />
      <path d="M4.5 19.5v-14M9 8h7M9 11.5h5" />
    </g>
  ),
  node: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M12 2.8l8 4.6v9.2l-8 4.6-8-4.6V7.4z" />
      <path d="M12 2.8v9.2m0 0l8-4.6m-8 4.6l-8-4.6" opacity="0.45" />
    </g>
  ),
  typescript: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M8 10h5M10.5 10v6.5M15 16v-5.5h2.5" />
    </g>
  ),
};

function ToolsVisual({ omoship }: { omoship: Omoship }) {
  return (
    <ul className="visual-tools">
      {omoship.tools.slice(0, 8).map((tool) => (
        <li key={tool.name}>
          <Spotlight className="tool-tile">
            <svg viewBox="0 0 24 24" className="tool-glyph" aria-hidden="true">
              {TOOL_GLYPHS[tool.icon] ?? TOOL_GLYPHS.git}
            </svg>
            <span>{tool.name}</span>
          </Spotlight>
        </li>
      ))}
    </ul>
  );
}

function AssessmentVisual() {
  const a = welcomeCopy.assessment;
  return (
    <div className="visual-assessment">
      <div className="assessment-cards">
        {a.cards.map((c) => (
          <Spotlight key={c.title} className="assessment-card">
            <h3>{c.title}</h3>
            <p>{c.body}</p>
          </Spotlight>
        ))}
      </div>
      <p className="assessment-note">{a.note}</p>
    </div>
  );
}

export default function SlideVisual({ visual, omoship }: { visual: WelcomeVisual; omoship: Omoship }) {
  switch (visual) {
    case "timeline":
      return <TimelineVisual omoship={omoship} />;
    case "repo":
      return <RepoVisual />;
    case "companies":
      return <CompaniesVisual />;
    case "tools":
      return <ToolsVisual omoship={omoship} />;
    case "assessment":
      return <AssessmentVisual />;
  }
}
