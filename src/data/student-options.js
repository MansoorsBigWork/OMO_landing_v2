/* The answers a student picks during onboarding: [value stored in Supabase, label].
   Shared by onboarding and the employer dashboard so both use the same wording. */

export const STAGES = [
  ['undergraduate', 'Undergraduate'],
  ['sixth_form_college', 'Sixth form or college (A-levels, T-levels, BTEC)'],
  ['scottish_s5_s6', 'Scottish S5 or S6 (Highers, Advanced Highers)'],
  ['further_education', 'Further education college'],
  ['apprenticeship', 'Apprenticeship'],
  ['postgraduate_taught', 'Postgraduate (Master’s)'],
  ['phd', 'PhD'],
  ['graduated', 'Recently graduated'],
  ['other', 'Other'],
]
export const DEGREE_STAGES = ['undergraduate', 'postgraduate_taught', 'phd', 'graduated']

export const GOALS = [
  ['work_experience', 'Work experience'],
  ['internship', 'Internship'],
  ['placement_year', 'Placement year'],
  ['spring_week', 'Spring week'],
  ['graduate_job', 'Graduate job'],
  ['degree_apprenticeship', 'Degree apprenticeship'],
  ['portfolio_projects', 'Real projects for my CV'],
  ['exploring_careers', 'Exploring which career fits me'],
]

export const SECTORS = [
  ['engineering', 'Engineering'],
  ['tech_software', 'Tech and software'],
  ['finance', 'Finance'],
  ['consulting', 'Consulting'],
  ['energy', 'Energy'],
  ['healthcare', 'Healthcare'],
  ['law', 'Law'],
  ['creative_media', 'Creative and media'],
  ['public_sector', 'Public sector'],
  ['not_sure', 'Not sure yet'],
]

// value → label lookups, for showing stored answers
export const STAGE_LABELS = Object.fromEntries(STAGES)
export const GOAL_LABELS = Object.fromEntries(GOALS)
export const SECTOR_LABELS = Object.fromEntries(SECTORS)
