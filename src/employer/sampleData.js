/* Sample data for the employer dashboard, until real students complete the OMOship.
   Every field maps to something OMO actually records, and nothing else:

   From onboarding (profiles, student_profiles)
     firstName, lastName        profiles.first_name, last_name
     stage                      student_profiles.education_stage
     university, subject        student_profiles.university, subject_name (degree stages only)
     graduationYear             student_profiles.graduation_year
     goals, sectors             what they're looking for (1-3) and sectors of interest (0-3)
     linkedin, bio, hasCv       student_profiles.linkedin_url, bio, cv_path
   From the OMOship (enrolments, omoship_progress, submissions / submission_results)
     enrolledAt                 enrolments.enrolled_at
     introCorrect               intro/answers: questions right first time, of INTRO_QUESTIONS
     pathfindingDone            tasks/week-1-pathfinding/completed_at is set
     submittedAt, repoUrl, videoUrl
     projectScore, videoScore   out of 50 each; total is their sum
     projectFeedback, videoFeedback
     status, releasedAt         submitted | released (marked rows aren't visible to employers)
*/

// "Today" for the sample, so the last-30-days figures don't empty out as real time passes
export const SAMPLE_NOW = '2026-10-02T12:00:00Z'


export const SAMPLE_OMOSHIP = {
  slug: 'uk-delivery-network',
  title: 'The Last Mile: Inside the UK Delivery Network',
  brief:
    'Students replace a delivery company’s hand-made plan with a planner that assigns, routes and replans deliveries, then explain it in a two-minute video.',
}

export const INTRO_QUESTIONS = 7 // questions on the parcel's journey through the network

const day = (iso) => `${iso}T10:00:00Z`
const MARKING_DAYS = 4 // sample results are released four days after submission
const addDays = (iso, days) => new Date(new Date(iso).getTime() + days * 86_400_000).toISOString()

/* [first, last, stage, university, subject, graduationYear, goals, sectors, linkedin?, bio?, hasCv] */
const PEOPLE = [
  ['Aisha', 'Rahman', 'undergraduate', 'University of Manchester', 'Mechanical Engineering', 2028, ['internship', 'placement_year'], ['engineering', 'energy'], true, 'Second-year mechanical engineer who likes turning messy operations into something measurable. Captain of the university Formula Student logistics team.', true],
  ['Tom', 'Whitfield', 'undergraduate', 'University of Strathclyde', 'Electrical and Electronic Engineering', 2027, ['graduate_job'], ['energy', 'engineering'], true, 'Final-year electrical engineer looking for a graduate role in operations or networks.', true],
  ['Priya', 'Nair', 'undergraduate', 'University of Liverpool', 'Mechatronics and Robotic Systems', 2028, ['internship', 'work_experience'], ['engineering', 'tech_software'], true, 'Robotics student interested in how algorithms behave in the real world, not just on paper.', true],
  ['Callum', 'Fraser', 'undergraduate', 'University of Edinburgh', 'Mathematics', 2027, ['graduate_job', 'exploring_careers'], ['finance', 'tech_software'], false, '', true],
  ['Sophie', 'Evans', 'undergraduate', 'Cardiff University', 'Logistics and Supply Chain Management', 2027, ['graduate_job'], ['consulting', 'engineering'], true, 'Supply chain student who has spent two summers working in a parcel depot.', true],
  ['Daniel', 'Okafor', 'undergraduate', 'University of Leeds', 'Computer Science', 2028, ['internship', 'spring_week'], ['tech_software', 'finance'], true, 'I build side projects in TypeScript and want to see how software runs a physical business.', false],
  ['Megan', 'Hughes', 'undergraduate', 'Bangor University', 'Economics', 2027, ['graduate_job', 'portfolio_projects'], ['public_sector', 'consulting'], false, '', true],
  ['Ravi', 'Patel', 'graduated', 'Heriot-Watt University', 'Civil Engineering', 2026, ['graduate_job'], ['engineering'], true, 'Recent civil engineering graduate, keen on transport and infrastructure planning.', true],
  ['Hannah', 'Lewis', 'postgraduate_taught', 'University of Warwick', 'Operational Research', 2027, ['graduate_job'], ['consulting', 'tech_software'], true, 'MSc student in operational research. My dissertation is on vehicle routing with time windows.', true],
  ['Kwame', 'Mensah', 'undergraduate', 'University of Nottingham', 'Physics', 2029, ['spring_week', 'work_experience'], ['finance', 'energy'], false, '', false],
  ['Ellie', 'Thompson', 'undergraduate', 'Newcastle University', 'Geography', 2028, ['placement_year'], ['public_sector', 'energy'], true, 'Geographer who loves maps and GIS.', true],
  ['Yusuf', 'Ali', 'undergraduate', 'Aston University', 'Business and Management', 2028, ['placement_year', 'internship'], ['consulting', 'finance'], false, '', true],
  ['Grace', 'Murphy', 'apprenticeship', null, null, 2027, ['degree_apprenticeship'], ['engineering'], false, 'Engineering apprentice at a regional distribution centre.', false],
  ['Liam', 'O’Connor', 'sixth_form_college', null, null, 2027, ['degree_apprenticeship', 'work_experience'], ['tech_software'], false, '', false],
  // Submitted, awaiting marks
  ['Zara', 'Hussain', 'undergraduate', 'University of Sheffield', 'Aerospace Engineering', 2028, ['internship'], ['engineering'], true, '', true],
  ['Oliver', 'Grant', 'undergraduate', 'University of Glasgow', 'Computing Science', 2027, ['graduate_job'], ['tech_software'], false, '', true],
  // Enrolled, still working through the course
  ['Chloe', 'Bennett', 'undergraduate', 'University of Bristol', 'Engineering Mathematics', 2028, ['internship'], ['engineering', 'finance'], false, '', true],
  ['Arjun', 'Singh', 'undergraduate', 'Loughborough University', 'Industrial Design', 2028, ['placement_year'], ['engineering', 'creative_media'], true, '', true],
  ['Freya', 'Campbell', 'scottish_s5_s6', null, null, 2027, ['work_experience', 'exploring_careers'], [], false, '', false],
  ['Samuel', 'Adeyemi', 'undergraduate', 'University of Birmingham', 'Chemical Engineering', 2027, ['graduate_job'], ['energy'], true, '', true],
  ['Isla', 'Robertson', 'undergraduate', 'University of Strathclyde', 'Product Design Engineering', 2029, ['spring_week'], ['engineering'], false, '', false],
  ['Noah', 'Clarke', 'further_education', null, null, 2027, ['degree_apprenticeship'], ['engineering', 'tech_software'], false, '', false],
  ['Amelia', 'Wright', 'undergraduate', 'University of Southampton', 'Mathematics with Operational Research', 2027, ['graduate_job', 'internship'], ['finance', 'consulting'], true, '', true],
  ['Ibrahim', 'Khan', 'undergraduate', 'Queen Mary University of London', 'Computer Science', 2028, ['internship'], ['tech_software'], false, '', true],
  ['Lucy', 'Morgan', 'undergraduate', 'Swansea University', 'Mechanical Engineering', 2028, ['placement_year'], ['engineering', 'energy'], false, '', false],
  ['Ethan', 'Walker', 'phd', 'University of Cambridge', 'Engineering', 2029, ['exploring_careers'], ['energy', 'consulting'], true, '', true],
]

/* OMOship records for the same people, in order.
   [enrolled, introCorrect, pathfindingDone, submitted?, project?, video?, projectFeedback?, videoFeedback?] */
const RECORDS = [
  ['2026-08-20', 7, true, '2026-09-01', 47, 44, 'Assigns parcels by delivery window before distance, which is why no parcel was late on any test day. Replanning after the bridge closure is clean and well tested.', 'Clear and confident. Explains the trade-off between on-time deliveries and kilometres without jargon.'],
  ['2026-08-25', 6, true, '2026-09-06', 45, 43, 'A* with a sensible distance estimate, and vans rebalanced when a late order arrives. Good tests.', 'Well structured. Could say more about what he would do with another week.'],
  ['2026-08-06', 7, true, '2026-08-17', 44, 42, 'Strong routing and a thoughtful fallback when a road closes. Code is tidy and commented.', 'Uses a delivery-van analogy that lands well. The final saving is stated but not costed.'],
  ['2026-08-14', 6, true, '2026-08-26', 48, 36, 'The most efficient planner in the cohort: fewest kilometres on every test day with no late parcels.', 'Accurate but technical. Talks to the code rather than to the operations team.'],
  ['2026-08-23', 5, true, '2026-09-01', 40, 43, 'Solid planner. Handles late orders well; a couple of vans cross paths on the busiest day.', 'Excellent at framing the problem from the depot’s point of view.'],
  ['2026-07-23', 6, true, '2026-08-03', 43, 38, 'Clean TypeScript and good use of the starter’s test harness. Replanning is slightly slow on large days.', 'Clear walkthrough, a little rushed at the end.'],
  ['2026-07-31', 5, true, '2026-08-11', 38, 41, 'Works on every test day. Routing is greedy rather than optimal, which costs kilometres.', 'Strong explanation of why she chose a simpler approach and what it gives up.'],
  ['2026-08-11', 6, true, '2026-08-18', 39, 38, 'Reliable assignment and routing. Road closures handled, late orders only partly.', 'Calm and structured.'],
  ['2026-07-20', 7, true, '2026-07-29', 42, 35, 'Thoughtful use of time windows from her dissertation work. Very few kilometres wasted.', 'Covers a lot but runs over the two minutes.'],
  ['2026-08-17', 4, true, '2026-08-28', 35, 37, 'Planner works on normal days but struggles when two disruptions land together.', 'Honest about what did not work, which is good to see.'],
  ['2026-07-26', 5, true, '2026-08-04', 33, 39, 'Routes are sensible; assignment leaves some vans underused.', 'Engaging and clear, with a good map-based explanation.'],
  ['2026-08-09', 4, true, '2026-08-21', 30, 40, 'Basic but working planner. Late orders are dropped to the next day.', 'Very good at explaining the business impact.'],
  ['2026-08-03', 6, true, '2026-08-13', 36, 33, 'Practical approach informed by real depot work. Some edge cases untested.', 'Brings real operational experience into the explanation.'],
  ['2026-07-28', 5, true, '2026-08-04', 31, 30, 'Gets deliveries out on time on easy days. Needs a better approach to routing between stops.', 'Clear about the steps taken. Could explain the why more.'],
  ['2026-08-28', 6, true, '2026-09-09'],
  ['2026-08-31', 5, true, '2026-09-13'],
  ['2026-09-03', 6, true],
  ['2026-09-06', 5, true],
  ['2026-09-08', 4, false],
  ['2026-09-11', 6, true],
  ['2026-09-14', 3, false],
  ['2026-09-17', null, false],
  ['2026-09-20', 7, true],
  ['2026-09-22', 5, false],
  ['2026-09-25', null, false],
  ['2026-09-28', 6, false],
]

const slugify = (text) => text.toLowerCase().normalize('NFKD').replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')

export const SAMPLE_STUDENTS = PEOPLE.map((person, index) => {
  const [firstName, lastName, stage, university, subject, graduationYear, goals, sectors, linkedin, bio, hasCv] = person
  const [enrolled, introCorrect, pathfindingDone, submitted, projectScore, videoScore, projectFeedback, videoFeedback] =
    RECORDS[index]
  const handle = slugify(`${firstName}-${lastName}`)
  const marked = projectScore != null
  return {
    id: `sample-${index + 1}`,
    firstName,
    lastName,
    stage,
    university,
    subject,
    graduationYear,
    goals,
    sectors,
    linkedin: linkedin ? `linkedin.com/in/${handle}` : null,
    bio: bio || null,
    hasCv,
    enrolledAt: day(enrolled),
    introCorrect,
    pathfindingDone,
    submission: submitted
      ? {
          submittedAt: day(submitted),
          repoUrl: `github.com/${handle}/omo-last-mile`,
          videoUrl: 'drive.google.com/file/…',
          status: marked ? 'released' : 'submitted',
          releasedAt: marked ? addDays(day(submitted), MARKING_DAYS) : null,
          projectScore: marked ? projectScore : null,
          videoScore: marked ? videoScore : null,
          projectFeedback: marked ? projectFeedback : null,
          videoFeedback: marked ? videoFeedback : null,
        }
      : null,
  }
})
