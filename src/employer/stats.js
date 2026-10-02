import { GOAL_LABELS, SECTOR_LABELS, STAGE_LABELS } from '../data/student-options.js'

/* Everything the employer dashboard shows is worked out here from student records
   (see sampleData.js for the fields), so swapping sample data for Supabase rows
   only means building the same objects. */

export const TOP_SCORE = 80
export const TOP_PICKS = 3 // the highest-ranked candidates, flagged as OMO's top picks
export const RECENT_DAYS = 30
// Goals an employer can hire for, in the order the pipeline shows them
export const HIRING_GOALS = ['graduate_job', 'internship', 'placement_year', 'spring_week', 'degree_apprenticeship']

export const fullName = (s) => `${s.firstName} ${s.lastName}`
export const initials = (s) => `${s.firstName[0]}${s.lastName[0]}`
export const totalScore = (s) =>
  s.submission?.status === 'released' ? s.submission.projectScore + s.submission.videoScore : null
export const isGraded = (s) => totalScore(s) !== null
export const stageLabel = (s) => STAGE_LABELS[s.stage] ?? 'Other'
export const goalLabel = (goal) => GOAL_LABELS[goal] ?? goal
export const sectorLabel = (sector) => SECTOR_LABELS[sector] ?? sector

// Shorter stage names for table cells
const SHORT_STAGES = {
  undergraduate: 'Undergraduate',
  sixth_form_college: 'Sixth form',
  scottish_s5_s6: 'S5/S6',
  further_education: 'FE college',
  apprenticeship: 'Apprentice',
  postgraduate_taught: 'Master’s',
  phd: 'PhD',
  graduated: 'Graduate',
  other: 'Other',
}
export const shortStage = (s) => SHORT_STAGES[s.stage] ?? 'Other'

// Where they study: university for degree students, otherwise the stage itself
export const studyPlace = (s) => s.university ?? stageLabel(s)

/* Graded students, best first: total, then the project score, then who submitted earlier */
export function rankCandidates(students) {
  return students
    .filter(isGraded)
    .sort(
      (a, b) =>
        totalScore(b) - totalScore(a) ||
        b.submission.projectScore - a.submission.projectScore ||
        a.submission.submittedAt.localeCompare(b.submission.submittedAt),
    )
    .map((student, index) => ({ ...student, rank: index + 1 }))
}

// The graduation year that counts as "finishing soon": this academic year or next
export function soonYear(now = new Date()) {
  return now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear()
}

const daysBetween = (from, to) => Math.max(1, Math.round((new Date(to) - new Date(from)) / 86_400_000))
export const daysToSubmit = (s) => (s.submission ? daysBetween(s.enrolledAt, s.submission.submittedAt) : null)

const median = (values) => {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function overviewStats(students, now = new Date()) {
  const ranked = rankCandidates(students)
  const totals = ranked.map(totalScore)
  const submitted = students.filter((s) => s.submission)
  const year = soonYear(new Date(now))
  return {
    enrolled: students.length,
    submitted: submitted.length,
    graded: ranked.length,
    awaiting: submitted.length - ranked.length,
    average: totals.length ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : null,
    universities: new Set(students.map((s) => s.university).filter(Boolean)).size,
    subjects: new Set(students.map((s) => s.subject).filter(Boolean)).size,
    topScorers: ranked.filter((s) => totalScore(s) >= TOP_SCORE).length,
    soonYear: year,
    finishingSoon: ranked.filter((s) => s.graduationYear <= year).length,
    medianDays: median(submitted.map(daysToSubmit)),
    completionRate: students.length ? Math.round((submitted.length / students.length) * 100) : 0,
    goals: Object.fromEntries(HIRING_GOALS.map((g) => [g, ranked.filter((s) => s.goals.includes(g)).length])),
  }
}

/* The same headline figures, for activity in the last RECENT_DAYS days: results released,
   submissions handed in and enrolments made since then */
export function recentStats(students, now = new Date()) {
  const since = new Date(now).getTime() - RECENT_DAYS * 86_400_000
  const within = (iso) => iso && new Date(iso).getTime() >= since
  const year = soonYear(new Date(now))
  const released = rankCandidates(students).filter((s) => within(s.submission.releasedAt))
  const submitted = students.filter((s) => within(s.submission?.submittedAt))
  return {
    topScorers: released.filter((s) => totalScore(s) >= TOP_SCORE).length,
    finishingSoon: released.filter((s) => s.graduationYear <= year).length,
    medianDays: median(submitted.map(daysToSubmit)),
    enrolled: students.filter((s) => within(s.enrolledAt)).length,
    soonYear: year,
  }
}

/* Running totals by day, from the first enrolment to `now`: [{ date, enrolled, submitted }] */
export function timeline(students, now = new Date()) {
  const dayKey = (iso) => iso.slice(0, 10)
  const enrolDays = students.map((s) => dayKey(s.enrolledAt))
  const submitDays = students.filter((s) => s.submission).map((s) => dayKey(s.submission.submittedAt))
  if (!enrolDays.length) return []
  const start = new Date(`${enrolDays.reduce((a, b) => (a < b ? a : b))}T00:00:00Z`)
  const end = new Date(`${dayKey(new Date(now).toISOString())}T00:00:00Z`)
  const points = []
  for (let d = start; d <= end; d = new Date(d.getTime() + 86_400_000)) {
    const key = d.toISOString().slice(0, 10)
    points.push({
      date: key,
      enrolled: enrolDays.filter((k) => k <= key).length,
      submitted: submitDays.filter((k) => k <= key).length,
    })
  }
  return points
}

// 10-point bands from under 50 to 90+, as [label, count, isTop]
export function scoreBands(students) {
  const totals = rankCandidates(students).map(totalScore)
  const bands = [['<50', 0, 50], ['50s', 50, 60], ['60s', 60, 70], ['70s', 70, 80], ['80s', 80, 90], ['90+', 90, 101]]
  return bands.map(([label, low, high]) => ({
    label,
    count: totals.filter((t) => t >= low && t < high).length,
    top: low >= TOP_SCORE,
  }))
}

/* Counts of one answer across students, most common first: [{ label, count }] */
export function breakdown(students, pick, label = (v) => v) {
  const counts = new Map()
  for (const student of students) {
    const values = [].concat(pick(student) ?? [])
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: label(value), count }))
    .sort((a, b) => b.count - a.count || String(a.label).localeCompare(String(b.label)))
}

/* Filters for the ranked table; each takes a student */
export function candidateFilters(year) {
  return [
    { key: 'all', label: 'All', test: () => true },
    { key: 'top', label: `Score ${TOP_SCORE}+`, test: (s) => totalScore(s) >= TOP_SCORE },
    { key: 'soon', label: `Finishing by ${year}`, test: (s) => s.graduationYear <= year },
    ...HIRING_GOALS.map((goal) => ({ key: goal, label: goalLabel(goal), test: (s) => s.goals.includes(goal) })),
    { key: 'cv', label: 'Has a CV', test: (s) => s.hasCv },
  ]
}

// Spreadsheet of the ranked table, for "Download CSV"
export function candidatesCsv(ranked) {
  const header = ['Rank', 'Name', 'Studying at', 'Subject', 'Stage', 'Finishes', 'Project /50', 'Video /50', 'Total /100', 'Looking for']
  const rows = ranked.map((s) => [
    s.rank, fullName(s), studyPlace(s), s.subject ?? '', stageLabel(s), s.graduationYear,
    s.submission.projectScore, s.submission.videoScore, totalScore(s), s.goals.map(goalLabel).join('; '),
  ])
  const cell = (value) => `"${String(value).replace(/"/g, '""')}"`
  return [header, ...rows].map((row) => row.map(cell).join(',')).join('\r\n')
}
