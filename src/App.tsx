import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ClipboardList,
  Download,
  Lightbulb,
  Plus,
  Target,
  Trash2,
  Users,
} from 'lucide-react'
import './App.css'

type Stage =
  | 'Web'
  | 'Apps'
  | 'Standard agent'
  | 'Copilot Studio'
  | 'GitHub Copilot'

type IdeaStatus = 'Idea only' | 'Shortlisted' | 'Priority' | 'Not selected'
type IdeaUserScope = 'Individual' | 'Team' | 'Department' | 'Company-wide' | 'Customer-facing'
type IdeaUsageFrequency = 'Ad hoc' | 'Daily' | 'Weekly' | 'Monthly' | 'Event-driven'

type ObjectiveNode = {
  id: number
  parentId: number | null
  title: string
  bullets: string
  owner: string
}

type DepartmentCollaboration = {
  id: number
  departmentId: number
  reason: string
}

type Department = {
  id: number
  name: string
  lead: string
  headcount: number
  champion: string
  focus: string
  businessObjective?: string
  collaborations: DepartmentCollaboration[]
}

type DepartmentObjective = {
  id: number
  departmentId: number
  title: string
  outcome: string
  owner: string
}

type DepartmentTask = {
  id: number
  objectiveId: number
  title: string
  owner: string
  measure: string
}

type Attendee = {
  id: number
  name: string
  team: string
  role: string
  confidence: 'Beginner' | 'Some experience' | 'Advanced'
  groupId: number
  challenge?: string
}

type Group = {
  id: number
  name: string
  department: string
  champion: string
  facilitator: string
  table: string
}

type WorkshopGroupMembership = {
  id: number
  groupId: number
  attendeeId: number
  challenge: string
  improvement?: string
}

type Idea = {
  id: number
  groupId: number
  attendeeId?: number
  membershipId?: number
  sourceTask?: string
  sourceImprovement?: string
  supportingContext?: string
  goalId: number
  departmentObjectiveId: number
  departmentTaskId: number
  title: string
  pain: string
  difficulty?: string
  opportunity: string
  idealOutcome?: string
  stage: Stage
  benefit: string
  concerns: string
  idealInteraction?: string
  integrationNeed?: 'Yes' | 'No' | 'Not sure' | ''
  integrationSystems?: string
  userScopes?: IdeaUserScope[]
  mainUsers?: string
  informationNeeded?: string
  aiOutput?: string
  usageFrequency?: IdeaUsageFrequency | ''
  usageContext?: string
  humanReview?: string
  successCriteria?: string
  constraints?: string
  impact: number
  ease: number
  risk: number
  readiness: number
  status: IdeaStatus
  isTopIdea?: boolean
}

type Task = {
  id: number
  groupId: number
  goalId: number
  departmentObjectiveId: number
  departmentTaskId: number
  ideaId: number
  copilotStage: Stage
  action: string
  owner: string
  dueDate: string
  governance: string
  measure: string
  sensitiveDataAccess?: 'Yes' | 'No'
  sensitiveDataDetails?: string
  dataProtection?: string
  buildGovernance?: string
  adoptionMonitoring?: string
  leadTime?: string
}

type ManagedServiceQuarter = {
  id: number
  name: string
  theme: string
  dayFormat: string
  focus: string
  outcomes: string[]
  deliverables: string[]
}

type AdoptionScorePillar = {
  name: string
  whatItTracks: string
  serviceUse: string
  examples: string[]
}

type AdoptionScoreTracking = {
  pillar: string
  baseline: number
  previous: number
  current: number
  target: number
  notes: string
}

type ClientWorkspace = {
  workshopName: string
  workshopDate: string
  groups: Group[]
  groupMemberships?: WorkshopGroupMembership[]
  objectives: ObjectiveNode[]
  departments: Department[]
  departmentObjectives: DepartmentObjective[]
  departmentTasks: DepartmentTask[]
  attendees: Attendee[]
  ideas: Idea[]
  tasks: Task[]
  totalPeople: number
  adoptionPulse: AdoptionPulse[]
  facilitatorPulse?: FacilitatorPulseQuestion[]
  confidencePulse?: AttendeeConfidencePulse[]
  overallConfidence?: AttendeeOverallConfidence[]
  adoptionScoreTracking: AdoptionScoreTracking[]
}

type PersistedWorkshopState = {
  version: 1
  clientName: string
  workspace: ClientWorkspace
  deletedIdeaIds: number[]
}

type AdoptionPulse = {
  stage: Stage
  usingNow: number
  wantsToUse: number
  seesNoBenefit: number
  noIdea: number
}

type ConfidenceArea =
  | 'Copilot on the web'
  | 'Copilot within Microsoft 365 apps'
  | 'Copilot agents'
  | 'Copilot Studio'
  | 'GitHub Copilot'

type PulseRespondent = {
  attendeeId: number
  notes: string
}

type FacilitatorPulseQuestion = {
  id: number
  question: string
  count: number
  respondents: PulseRespondent[]
}

type ConfidencePulseRating = {
  area: ConfidenceArea
  before: number
  after: number
}

type AttendeeConfidencePulse = {
  attendeeId: number
  ratings: ConfidencePulseRating[]
}

type AttendeeOverallConfidence = {
  attendeeId: number
  before: number
  after: number
  sourceNote?: string
}

type AgendaItem = {
  time: string
  title: string
  purpose: string
  output: string
}

const stages: Stage[] = ['Web', 'Apps', 'Standard agent', 'Copilot Studio', 'GitHub Copilot']
const priorityIdeaLimit = 5
const unleashedLogoUrl = `${import.meta.env.BASE_URL}unleashed-logo.png`

const agenda: AgendaItem[] = [
  {
    time: '10:00 - 10:15',
    title: 'Welcome and objectives',
    purpose: 'Set the scene and explain the adoption journey.',
    output: 'Shared view of the day and expected outputs.',
  },
  {
    time: '10:15 - 10:30',
    title: 'Business goals',
    purpose: 'Agree the current company goal and capture the department context needed for the workshop.',
    output: 'Current company goal, department leads, champions, people, team members and focus.',
  },
  {
    time: '10:30 - 10:45',
    title: 'Adoption pulse baseline',
    purpose: 'Capture current confidence and usage across the five Copilot stages.',
    output: 'Room-wide adoption baseline.',
  },
  {
    time: '10:45 - 11:45',
    title: 'Art of the possible',
    purpose: 'Fast tour of the five Copilot stages.',
    output: 'Confidence, context and questions.',
  },
  {
    time: '11:45 - 12:30',
    title: 'Breakout 1: identify opportunities',
    purpose: 'Identify realistic use cases from current work.',
    output: '5-8 ideas per group.',
  },
  {
    time: '12:30 - 13:30',
    title: 'Lunch',
    purpose: 'Pause, reflect and continue informal discussion.',
    output: 'Fresh perspective for the afternoon session.',
  },
  {
    time: '13:30 - 14:00',
    title: 'Playback and theme alignment',
    purpose: 'Share top ideas, common blockers and benefits.',
    output: 'Theme map and candidate shortlist.',
  },
  {
    time: '14:00 - 15:00',
    title: 'Breakout 2: prioritise and business goal alignment',
    purpose: 'Score the strongest ideas and align them to the company goal and measurable outcomes.',
    output: 'Prioritised adoption candidates mapped to business goals.',
  },
  {
    time: '15:00 - 15:45',
    title: 'Adoption planning',
    purpose: 'Assign owners, measures, governance checks and next steps.',
    output: '30-day action plan.',
  },
  {
    time: '15:45 - 16:00',
    title: 'Wrap-up and next steps',
    purpose: 'Confirm priorities, owners and follow-up route.',
    output: 'Agreed next steps and summary export.',
  },
]

const facilitatorPulseQuestions = [
  'Who has started using Copilot for general questions and web knowledge?',
  'Who is using Copilot for support within apps such as Word and Excel?',
  'Has anyone heard of Copilot agents?',
  'Has anyone started making their own agents?',
  'Has anyone heard of Copilot Studio?',
  'Has anyone started using Copilot Studio?',
  'Has anyone heard of GitHub Copilot?',
  'Is anyone using GitHub Copilot?',
]

const confidenceAreas: ConfidenceArea[] = [
  'Copilot on the web',
  'Copilot within Microsoft 365 apps',
  'Copilot agents',
  'Copilot Studio',
  'GitHub Copilot',
]

const overallConfidenceScale = [
  { value: 0, label: 'Not entered' },
  { value: 1, label: '1 — Not confident' },
  { value: 1.5, label: '1.5' },
  { value: 2, label: '2' },
  { value: 2.5, label: '2.5' },
  { value: 3, label: '3 — Somewhat' },
  { value: 3.5, label: '3.5' },
  { value: 4, label: '4' },
  { value: 4.5, label: '4.5' },
  { value: 5, label: '5 — Very confident' },
]

function formatConfidenceScore(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function blankFacilitatorPulse(): FacilitatorPulseQuestion[] {
  return facilitatorPulseQuestions.map((question, index) => ({
    id: index + 1,
    question,
    count: 0,
    respondents: [],
  }))
}

function blankConfidenceRatings(): ConfidencePulseRating[] {
  return confidenceAreas.map((area) => ({ area, before: 0, after: 0 }))
}

function normaliseFacilitatorPulse(workspace: ClientWorkspace): FacilitatorPulseQuestion[] {
  const saved = workspace.facilitatorPulse ?? []
  return blankFacilitatorPulse().map((question) => {
    const savedQuestion = saved.find((item) => item.id === question.id)
    return savedQuestion
      ? {
          ...question,
          count: Math.max(0, savedQuestion.count || 0),
          respondents: (savedQuestion.respondents ?? []).filter((respondent) =>
            workspace.attendees.some((attendee) => attendee.id === respondent.attendeeId),
          ),
        }
      : question
  })
}

function normaliseConfidencePulse(workspace: ClientWorkspace): AttendeeConfidencePulse[] {
  const saved = workspace.confidencePulse ?? []
  return workspace.attendees.map((attendee) => {
    const savedEntry = saved.find((entry) => entry.attendeeId === attendee.id)
    return {
      attendeeId: attendee.id,
      ratings: blankConfidenceRatings().map((rating) => {
        const savedRating = savedEntry?.ratings?.find((item) => item.area === rating.area)
        return {
          area: rating.area,
          before: Math.max(0, Math.min(5, savedRating?.before ?? 0)),
          after: Math.max(0, Math.min(5, savedRating?.after ?? 0)),
        }
      }),
    }
  })
}

function normaliseOverallConfidence(workspace: ClientWorkspace): AttendeeOverallConfidence[] {
  const saved = workspace.overallConfidence ?? []
  return workspace.attendees.map((attendee) => {
    const entry = saved.find((item) => item.attendeeId === attendee.id)
    return {
      attendeeId: attendee.id,
      before: entry?.before ?? 0,
      after: entry?.after ?? 0,
      sourceNote: entry?.sourceNote,
    }
  })
}

function departmentsWithBusinessObjectives(workspace: ClientWorkspace): Department[] {
  return workspace.departments.map((department) => {
    if (department.businessObjective !== undefined) return department
    const legacyObjectives = (workspace.departmentObjectives ?? []).filter((objective) => objective.departmentId === department.id)
    return {
      ...department,
      businessObjective: legacyObjectives.length === 1 ? legacyObjectives[0].title : '',
    }
  })
}

const managedServiceQuarters: ManagedServiceQuarter[] = [
  {
    id: 1,
    name: 'Quarter 1',
    theme: 'Adoption check-in and agent build day',
    dayFormat: '1-day onsite revisit: morning adoption clinic, afternoon agent build lab',
    focus: 'Spend the first half of the day speaking with staff about how they have adopted Copilot since the workshop, sharing quick tips and tricks, then use the second half of the day to build or develop agents against the priority projects.',
    outcomes: ['Capture what staff are actually using since the workshop', 'Share quick Copilot tips and better prompting habits', 'Review anything new in the market that Unleashed believes could benefit the client', 'Select priority projects for agent build or development', 'Create first agent/workflow pilots with owners and measures'],
    deliverables: ['Staff adoption feedback summary', 'Quick tips and tricks handout', 'New market opportunity notes', 'Agent build shortlist', 'First agent/workflow build notes and success measures'],
  },
  {
    id: 2,
    name: 'Quarter 2',
    theme: 'Review adoption and expand the agent roadmap',
    dayFormat: '1-day onsite revisit: morning adoption review, afternoon agent/Copilot Studio/GitHub progression',
    focus: 'Spend the first half of the day reviewing how staff are finding Copilot and the agents since the last session, what is in place, what is being adopted and what is delivering value. Use the second half of the day to build further on the agents or move the right projects into Copilot Studio or GitHub Copilot.',
    outcomes: ['Review what has been adopted since Quarter 1', 'Identify which agents or workflows are providing the best return and why', 'Review anything new in the market that Unleashed believes could benefit the client', 'Decide what can be rolled out company wide', 'Progress suitable projects into further agent development, Copilot Studio or GitHub Copilot'],
    deliverables: ['Quarter 2 adoption and return review', 'New market opportunity notes', 'Company-wide rollout shortlist', 'Agent fine-tuning actions', 'Copilot Studio/GitHub candidate list'],
  },
  {
    id: 3,
    name: 'Quarter 3',
    theme: 'Review, train and develop the next wave',
    dayFormat: '1-day onsite revisit: morning review and tips, afternoon development lab',
    focus: 'Spend the first half of the day reviewing what was completed in Quarter 2, checking adoption, sharing tips and tricks, and improving prompt confidence. Use the second half of the day to develop existing agents/workflows further or start something new from the backlog.',
    outcomes: ['Review Quarter 2 delivery and adoption', 'Share tips, tricks and prompt training based on real user feedback', 'Review anything new in the market that Unleashed believes could benefit the client', 'Fine-tune existing agents and workflows', 'Select and develop the next opportunity from the backlog'],
    deliverables: ['Quarter 3 adoption review', 'Prompt and tips pack', 'New market opportunity notes', 'Fine-tuned agent/workflow notes', 'Next-wave development record'],
  },
  {
    id: 4,
    name: 'Quarter 4',
    theme: 'Annual review and next 12 months',
    dayFormat: '1-day onsite annual review: morning overall review, afternoon next-12-month planning',
    focus: 'Spend the first half of the day reviewing the full year, adoption score movement, what has been delivered and where value has been created. Use the second half of the day to agree the next 12-month Copilot, agent and automation roadmap.',
    outcomes: ['Review the full year against baseline', 'Evidence adoption, productivity and business impact', 'Review anything new in the market that Unleashed believes could benefit the client', 'Decide what to keep, scale, improve or retire', 'Agree the next 12-month roadmap'],
    deliverables: ['Annual executive value report', 'Project and agent value review', 'New market opportunity recommendations', 'Next 12-month managed-service roadmap', 'Board-ready outcomes summary'],
  },
]

const adoptionScorePillars: AdoptionScorePillar[] = [
  {
    name: 'Communication',
    whatItTracks: 'How people communicate through Outlook, Teams chat, community posts and modern message-based collaboration.',
    serviceUse: 'Clearer, faster communication habits with less dependency on long internal email chains.',
    examples: ['Teams chat usage', 'Internal email patterns', 'Community and announcement engagement'],
  },
  {
    name: 'Meetings',
    whatItTracks: 'How Teams meetings, audio/video, scheduling and meeting behaviours are being used across the organisation.',
    serviceUse: 'Better meeting preparation, summaries, action capture and follow-up using Copilot in Teams and Microsoft 365.',
    examples: ['Teams meeting participation', 'Meeting recap usage', 'Action follow-up quality'],
  },
  {
    name: 'Content collaboration',
    whatItTracks: 'How people create, store and co-author content in SharePoint, OneDrive and Microsoft 365 apps.',
    serviceUse: 'More consistent use of SharePoint, OneDrive and co-authoring so content is easier to find, improve and reuse with Copilot.',
    examples: ['SharePoint usage', 'OneDrive usage', 'Co-authoring activity'],
  },
  {
    name: 'Teamwork',
    whatItTracks: 'How shared workspaces such as Teams, Microsoft 365 Groups and SharePoint team sites are being used.',
    serviceUse: 'Stronger shared workspaces, clearer ownership and better team routines before advanced automation is introduced.',
    examples: ['Teams activity', 'Channel collaboration', 'Shared workspace adoption'],
  },
  {
    name: 'Mobility',
    whatItTracks: 'How securely people work across desktop, browser and mobile apps.',
    serviceUse: 'Secure, practical access across desktop, browser and mobile so people can work productively wherever they need to.',
    examples: ['Mobile Outlook', 'Mobile Teams', 'Cross-device productivity'],
  },
  {
    name: 'AI adoption',
    whatItTracks: 'How Microsoft 365 Copilot and AI-powered productivity features are being used in day-to-day work.',
    serviceUse: 'Visible growth in Copilot usage linked to agreed business outcomes, priority opportunities and measurable productivity gains.',
    examples: ['Copilot active usage', 'Prompt and workflow adoption', 'AI-enabled process improvements'],
  },
  {
    name: 'Governance overlay',
    whatItTracks: 'Not a separate Microsoft score pillar; used by Unleashed to assess whether Teams, SharePoint, data access and Copilot controls are ready.',
    serviceUse: 'Confidence that data access, Teams, SharePoint and Copilot controls are ready before scaling into agents or deeper automation.',
    examples: ['Teams and SharePoint structure', 'Data access readiness', 'Copilot control points'],
  },
]

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function blankAdoptionScoreTracking(): AdoptionScoreTracking[] {
  return adoptionScorePillars.map((pillar) => ({
    pillar: pillar.name,
    baseline: 0,
    previous: 0,
    current: 0,
    target: pillar.name === 'Governance overlay' ? 80 : 100,
    notes: '',
  }))
}

function blankClientWorkspace(): ClientWorkspace {
  return {
    workshopName: 'Microsoft Copilot Adoption Workshop',
    workshopDate: todayIso(),
    groups: [],
    groupMemberships: [],
    objectives: [{ id: 1, parentId: null, title: '', bullets: '', owner: '' }],
    departments: [],
    departmentObjectives: [],
    departmentTasks: [],
    attendees: [],
    ideas: [],
    tasks: [],
    totalPeople: 0,
    adoptionPulse: stages.map((stage) => ({ stage, usingNow: 0, wantsToUse: 0, seesNoBenefit: 0, noIdea: 0 })),
    facilitatorPulse: blankFacilitatorPulse(),
    confidencePulse: [],
    overallConfidence: [],
    adoptionScoreTracking: blankAdoptionScoreTracking(),
  }
}

const ideaUserScopes: IdeaUserScope[] = ['Individual', 'Team', 'Department', 'Company-wide', 'Customer-facing']
const ideaUsageFrequencies: IdeaUsageFrequency[] = ['Ad hoc', 'Daily', 'Weekly', 'Monthly', 'Event-driven']

function normaliseIdea(idea: Idea): Idea {
  return {
    ...idea,
    supportingContext: idea.supportingContext ?? '',
    difficulty: idea.difficulty ?? '',
    idealOutcome: idea.idealOutcome ?? '',
    idealInteraction: idea.idealInteraction ?? '',
    integrationNeed: idea.integrationNeed ?? '',
    integrationSystems: idea.integrationSystems ?? '',
    userScopes: idea.userScopes ?? [],
    mainUsers: idea.mainUsers ?? '',
    informationNeeded: idea.informationNeeded ?? '',
    aiOutput: idea.aiOutput ?? '',
    usageFrequency: idea.usageFrequency ?? '',
    usageContext: idea.usageContext ?? '',
    humanReview: idea.humanReview ?? '',
    successCriteria: idea.successCriteria ?? '',
    constraints: idea.constraints ?? '',
  }
}

function ideaSourceContext(
  idea: Idea,
  memberships: WorkshopGroupMembership[],
  attendees: Attendee[],
) {
  const membership = memberships.find((item) => item.id === idea.membershipId)
  const attendee = attendees.find((item) => item.id === (idea.attendeeId ?? membership?.attendeeId))
  return {
    membership,
    attendee,
    contributorName: attendee?.name ?? 'Unassigned contributor',
    sourceTask: idea.sourceTask !== undefined ? idea.sourceTask : membership?.challenge ?? idea.pain,
    sourceImprovement:
      idea.sourceImprovement !== undefined ? idea.sourceImprovement : membership?.improvement ?? '',
  }
}

function ideaDesignCompletion(idea: Idea) {
  const integrationComplete =
    Boolean(idea.integrationNeed) &&
    (idea.integrationNeed === 'No' || Boolean(idea.integrationSystems?.trim()))
  const userComplete = Boolean(idea.userScopes?.length || idea.mainUsers?.trim())
  const riskComplete = Boolean(idea.concerns?.trim() || idea.humanReview?.trim() || idea.constraints?.trim())
  const values = [
    idea.pain,
    idea.difficulty,
    idea.opportunity,
    idea.idealOutcome,
    idea.informationNeeded,
    integrationComplete ? 'complete' : '',
    userComplete ? 'complete' : '',
    idea.benefit,
    riskComplete ? 'complete' : '',
    idea.stage,
  ]
  return { completed: values.filter((value) => Boolean(value && String(value).trim())).length, total: values.length }
}

function priorityScore(idea: Idea) {
  return idea.impact + idea.ease + idea.readiness - idea.risk
}

function ideaStatusRank(status: IdeaStatus) {
  const order: Record<IdeaStatus, number> = {
    Priority: 0,
    Shortlisted: 1,
    'Idea only': 2,
    'Not selected': 3,
  }
  return order[status]
}

function legacyMemberships(workspace: ClientWorkspace): WorkshopGroupMembership[] {
  if (workspace.groupMemberships?.length) {
    return workspace.groupMemberships.map((membership) => ({
      ...membership,
      improvement:
        membership.improvement ??
        workspace.ideas.find((idea) => idea.membershipId === membership.id)?.benefit ??
        '',
    }))
  }
  return (workspace.attendees ?? []).map((attendee, index) => ({
    id: index + 1,
    groupId: attendee.groupId,
    attendeeId: attendee.id,
    challenge:
      attendee.challenge ??
      workspace.ideas.find((idea) => idea.attendeeId === attendee.id && idea.groupId === attendee.groupId)?.pain ??
      '',
    improvement:
      workspace.ideas.find((idea) => idea.attendeeId === attendee.id && idea.groupId === attendee.groupId)?.benefit ??
      '',
  }))
}

function linkedProjectTask(
  idea: Idea,
  memberships: WorkshopGroupMembership[],
  attendees: Attendee[],
  groups: Group[],
  id: number,
): Task {
  const source = ideaSourceContext(idea, memberships, attendees)
  const group = groups.find((item) => item.id === idea.groupId)
  return {
    id,
    groupId: idea.groupId,
    goalId: idea.goalId,
    departmentObjectiveId: idea.departmentObjectiveId,
    departmentTaskId: idea.departmentTaskId,
    ideaId: idea.id,
    copilotStage: idea.stage,
    action: `Create a ${idea.stage} project for ${idea.title}`,
    owner: source.attendee?.name ?? group?.champion ?? 'Unassigned',
    dueDate: '',
    governance: idea.concerns,
    measure: idea.benefit,
    sensitiveDataAccess: 'No',
    sensitiveDataDetails: '',
    dataProtection: '',
    buildGovernance: '',
    adoptionMonitoring: '',
    leadTime: '',
  }
}

function workspaceTasksWithTopFive(workspace: ClientWorkspace, ideas = workspace.ideas): Task[] {
  const memberships = legacyMemberships(workspace)
  const tasks = [...workspace.tasks]
  let nextId = Math.max(0, ...tasks.map((task) => task.id)) + 1
  ideas
    .filter((idea) => idea.isTopIdea)
    .slice(0, priorityIdeaLimit)
    .forEach((idea) => {
      if (!tasks.some((task) => task.ideaId === idea.id)) {
        tasks.push(linkedProjectTask(idea, memberships, workspace.attendees, workspace.groups, nextId++))
      }
    })
  return tasks
}

const workshopStorageKey = 'copilot-workshop-hub:current-workshop:v1'

function normaliseWorkspace(workspace: Partial<ClientWorkspace> | undefined): ClientWorkspace {
  const blank = blankClientWorkspace()
  const source = workspace ?? {}
  const attendees = Array.isArray(source.attendees)
    ? source.attendees.map((attendee) => ({ ...attendee, challenge: attendee.challenge ?? '' }))
    : []
  const groups = Array.isArray(source.groups) ? source.groups : []
  const groupMemberships = legacyMemberships({
    ...blank,
    ...source,
    attendees,
    groups,
    ideas: Array.isArray(source.ideas) ? source.ideas : [],
  })
  const ideas = (Array.isArray(source.ideas) ? source.ideas : []).map((idea) => {
    const membership =
      groupMemberships.find((item) => item.id === idea.membershipId) ??
      groupMemberships.find((item) => item.attendeeId === idea.attendeeId && item.groupId === idea.groupId)
    return normaliseIdea({
      ...idea,
      membershipId: idea.membershipId ?? membership?.id,
      isTopIdea: idea.isTopIdea ?? false,
    })
  })
  const workspaceWithIdeas: ClientWorkspace = {
    ...blank,
    ...source,
    workshopName: typeof source.workshopName === 'string' ? source.workshopName : blank.workshopName,
    workshopDate: typeof source.workshopDate === 'string' ? source.workshopDate : blank.workshopDate,
    groups,
    groupMemberships,
    objectives: Array.isArray(source.objectives) ? source.objectives : [],
    departments: Array.isArray(source.departments) ? source.departments : [],
    departmentObjectives: Array.isArray(source.departmentObjectives) ? source.departmentObjectives : [],
    departmentTasks: Array.isArray(source.departmentTasks) ? source.departmentTasks : [],
    attendees,
    ideas,
    tasks: Array.isArray(source.tasks) ? source.tasks : [],
    totalPeople: typeof source.totalPeople === 'number' ? source.totalPeople : attendees.length,
    adoptionPulse: Array.isArray(source.adoptionPulse) ? source.adoptionPulse : blank.adoptionPulse,
    facilitatorPulse: Array.isArray(source.facilitatorPulse) ? source.facilitatorPulse : blank.facilitatorPulse,
    confidencePulse: Array.isArray(source.confidencePulse) ? source.confidencePulse : [],
    overallConfidence: Array.isArray(source.overallConfidence) ? source.overallConfidence : [],
    adoptionScoreTracking: Array.isArray(source.adoptionScoreTracking)
      ? source.adoptionScoreTracking
      : blank.adoptionScoreTracking,
  }
  return {
    ...workspaceWithIdeas,
    tasks: workspaceTasksWithTopFive(workspaceWithIdeas, ideas),
  }
}

function loadPersistedWorkshop(): PersistedWorkshopState {
  const fallback: PersistedWorkshopState = {
    version: 1,
    clientName: '',
    workspace: blankClientWorkspace(),
    deletedIdeaIds: [],
  }
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(workshopStorageKey)
    if (!raw) return fallback
    const saved = JSON.parse(raw) as Partial<PersistedWorkshopState>
    if (saved.version !== 1 || typeof saved.clientName !== 'string' || !saved.workspace) return fallback
    return {
      version: 1,
      clientName: saved.clientName,
      workspace: normaliseWorkspace(saved.workspace),
      deletedIdeaIds: Array.isArray(saved.deletedIdeaIds)
        ? saved.deletedIdeaIds.filter((id): id is number => typeof id === 'number')
        : [],
    }
  } catch (error) {
    console.warn('Unable to restore the locally saved workshop; opening a blank workshop.', error)
    return fallback
  }
}

const initialWorkshopState = loadPersistedWorkshop()

function App() {
  const [activeView, setActiveView] = useState('Home')
  const [currentAgendaIndex, setCurrentAgendaIndex] = useState(1)
  const [customerName, setCustomerName] = useState(initialWorkshopState.clientName)
  const [workshopName, setWorkshopName] = useState(initialWorkshopState.workspace.workshopName)
  const [workshopDate, setWorkshopDate] = useState(initialWorkshopState.workspace.workshopDate)
  const [groups, setGroups] = useState<Group[]>(initialWorkshopState.workspace.groups)
  const [groupMemberships, setGroupMemberships] = useState<WorkshopGroupMembership[]>(
    legacyMemberships(initialWorkshopState.workspace),
  )
  const [objectives, setObjectives] = useState<ObjectiveNode[]>(initialWorkshopState.workspace.objectives)
  const [departments, setDepartments] = useState<Department[]>(
    departmentsWithBusinessObjectives(initialWorkshopState.workspace),
  )
  const [departmentObjectives, setDepartmentObjectives] = useState<DepartmentObjective[]>(
    initialWorkshopState.workspace.departmentObjectives,
  )
  const [departmentTasks, setDepartmentTasks] = useState<DepartmentTask[]>(
    initialWorkshopState.workspace.departmentTasks,
  )
  const [attendees, setAttendees] = useState<Attendee[]>(initialWorkshopState.workspace.attendees)
  const [ideas, setIdeas] = useState<Idea[]>(initialWorkshopState.workspace.ideas)
  const [deletedIdeaIds, setDeletedIdeaIds] = useState<number[]>(initialWorkshopState.deletedIdeaIds)
  const [tasks, setTasks] = useState<Task[]>(initialWorkshopState.workspace.tasks)
  const [totalPeople, setTotalPeople] = useState(initialWorkshopState.workspace.totalPeople)
  const [adoptionPulse, setAdoptionPulse] = useState<AdoptionPulse[]>(initialWorkshopState.workspace.adoptionPulse)
  const [facilitatorPulse, setFacilitatorPulse] = useState<FacilitatorPulseQuestion[]>(
    normaliseFacilitatorPulse(initialWorkshopState.workspace),
  )
  const [confidencePulse, setConfidencePulse] = useState<AttendeeConfidencePulse[]>(
    normaliseConfidencePulse(initialWorkshopState.workspace),
  )
  const [overallConfidence, setOverallConfidence] = useState<AttendeeOverallConfidence[]>(
    normaliseOverallConfidence(initialWorkshopState.workspace),
  )
  const [adoptionScoreTracking, setAdoptionScoreTracking] = useState<AdoptionScoreTracking[]>(
    initialWorkshopState.workspace.adoptionScoreTracking,
  )
  const [selectedPriorityGroup, setSelectedPriorityGroup] = useState<number | 'all'>('all')
  const [selectedActionGroup, setSelectedActionGroup] = useState<number | 'all'>('all')
  const suppressNextPersistence = useRef(false)
  const ultimateObjective = objectives.find((objective) => objective.parentId === null) ?? objectives[0]
  const clientDisplayName = customerName.trim() || 'Client'

  useEffect(() => {
    if (suppressNextPersistence.current) {
      suppressNextPersistence.current = false
      return
    }
    const state: PersistedWorkshopState = {
      version: 1,
      clientName: customerName,
      workspace: {
        workshopName,
        workshopDate,
        groups,
        groupMemberships,
        objectives,
        departments,
        departmentObjectives,
        departmentTasks,
        attendees,
        ideas,
        tasks,
        totalPeople,
        adoptionPulse,
        facilitatorPulse,
        confidencePulse,
        overallConfidence,
        adoptionScoreTracking,
      },
      deletedIdeaIds,
    }
    try {
      window.localStorage.setItem(workshopStorageKey, JSON.stringify(state))
    } catch (error) {
      console.error('Unable to save the current workshop locally.', error)
    }
  }, [
    adoptionPulse,
    adoptionScoreTracking,
    attendees,
    confidencePulse,
    customerName,
    deletedIdeaIds,
    departmentObjectives,
    departmentTasks,
    departments,
    facilitatorPulse,
    groupMemberships,
    groups,
    ideas,
    objectives,
    overallConfidence,
    tasks,
    totalPeople,
    workshopDate,
    workshopName,
  ])

  const topIdeas = useMemo(
    () => [...ideas].sort((a, b) => priorityScore(b) - priorityScore(a)).slice(0, 5),
    [ideas],
  )

  const filteredPriorityIdeas = useMemo(() => {
    const scopedIdeas = selectedPriorityGroup === 'all'
      ? ideas.filter((idea) => idea.status === 'Shortlisted' || idea.status === 'Priority' || idea.isTopIdea)
      : ideas.filter(
          (idea) =>
            idea.groupId === selectedPriorityGroup &&
            (idea.status === 'Shortlisted' || idea.status === 'Priority' || idea.isTopIdea),
        )
    return [...scopedIdeas].sort((a, b) => ideaStatusRank(a.status) - ideaStatusRank(b.status) || priorityScore(b) - priorityScore(a))
  }, [ideas, selectedPriorityGroup])

  const remainingUseCasesForProjects = useMemo(
    () =>
      ideas
        .filter((idea) => idea.status === 'Shortlisted' || idea.status === 'Idea only')
        .sort((a, b) => ideaStatusRank(a.status) - ideaStatusRank(b.status) || priorityScore(b) - priorityScore(a)),
    [ideas],
  )

  const priorityProjectIdeas = useMemo(
    () =>
      ideas
        .filter((idea) => idea.isTopIdea)
        .filter((idea) => selectedActionGroup === 'all' || idea.groupId === selectedActionGroup)
        .sort((a, b) => priorityScore(b) - priorityScore(a)),
    [ideas, selectedActionGroup],
  )

  const topFiveIdeas = useMemo(
    () => ideas.filter((idea) => idea.isTopIdea).slice(0, priorityIdeaLimit),
    [ideas],
  )
  const activeProjectTasks = useMemo(
    () =>
      topFiveIdeas
        .map((idea) => tasks.find((task) => task.ideaId === idea.id))
        .filter((task): task is Task => Boolean(task)),
    [tasks, topFiveIdeas],
  )

  const adoptionScoreTotals = useMemo(() => {
    const baseline = adoptionScoreTracking.reduce((sum, item) => sum + item.baseline, 0)
    const previous = adoptionScoreTracking.reduce((sum, item) => sum + item.previous, 0)
    const current = adoptionScoreTracking.reduce((sum, item) => sum + item.current, 0)
    const target = adoptionScoreTracking.reduce((sum, item) => sum + item.target, 0)
    const count = Math.max(1, adoptionScoreTracking.length)
    return {
      baseline,
      previous,
      current,
      target,
      baselineAverage: Math.round(baseline / count),
      currentAverage: Math.round(current / count),
      quarterMovement: current - previous,
      totalImprovement: current - baseline,
      gapToTarget: target - current,
    }
  }, [adoptionScoreTracking])

  const stats = useMemo(() => {
    const pilotIdeas = ideas.filter((idea) => idea.status === 'Priority').length
    return {
      attendees: attendees.length,
      groups: groups.length,
      departments: departments.length,
      ideas: ideas.length,
      pilotIdeas,
      projectActions: activeProjectTasks.length,
    }
  }, [activeProjectTasks.length, attendees.length, departments.length, groups.length, ideas])

  const ideaStatusCounts = useMemo(
    () => ({
      priority: ideas.filter((idea) => idea.status === 'Priority').length,
      shortlisted: ideas.filter((idea) => idea.status === 'Shortlisted').length,
      ideaOnly: ideas.filter((idea) => idea.status === 'Idea only').length,
      notSelected: ideas.filter((idea) => idea.status === 'Not selected').length,
    }),
    [ideas],
  )

  const confidenceSummary = useMemo(() => {
    const beforeEntries = overallConfidence.filter((entry) => entry.before > 0)
    const afterEntries = overallConfidence.filter((entry) => entry.after > 0)
    const matchedEntries = overallConfidence.filter((entry) => entry.before > 0 && entry.after > 0)
    const beforeTotal = beforeEntries.reduce((sum, entry) => sum + entry.before, 0)
    const afterTotal = afterEntries.reduce((sum, entry) => sum + entry.after, 0)
    const matchedBeforeTotal = matchedEntries.reduce((sum, entry) => sum + entry.before, 0)
    const matchedAfterTotal = matchedEntries.reduce((sum, entry) => sum + entry.after, 0)
    const averageMovement = matchedEntries.length
      ? (matchedAfterTotal - matchedBeforeTotal) / matchedEntries.length
      : 0
    const maximumTotal = attendees.length * 5
    return {
      beforeTotal,
      afterTotal,
      maximumTotal,
      beforeEnteredRatings: beforeEntries.length,
      afterEnteredRatings: afterEntries.length,
      beforeCompletedAttendees: beforeEntries.length,
      afterCompletedAttendees: afterEntries.length,
      beforeAverage: beforeEntries.length ? beforeTotal / beforeEntries.length : 0,
      afterAverage: afterEntries.length ? afterTotal / afterEntries.length : 0,
      matchedMovement: matchedAfterTotal - matchedBeforeTotal,
      completedAttendees: matchedEntries.length,
      averageMovement,
      enteredRatings: matchedEntries.length,
    }
  }, [attendees.length, overallConfidence])

  const focusedIdeaPipeline = useMemo(() => {
    const topFive = ideas.filter((idea) => idea.isTopIdea).length
    const shortlisted = ideas.filter(
      (idea) => !idea.isTopIdea && (idea.status === 'Shortlisted' || idea.status === 'Priority'),
    ).length
    return {
      total: ideas.length,
      ideaOnly: ideas.length - shortlisted - topFive,
      shortlisted,
      topFive,
    }
  }, [ideas])

  function loadClientWorkspace(workspace: ClientWorkspace) {
    setWorkshopName(workspace.workshopName)
    setWorkshopDate(workspace.workshopDate)
    setGroups(workspace.groups)
    const memberships = legacyMemberships(workspace)
    setGroupMemberships(memberships)
    setObjectives(workspace.objectives)
    setDepartments(departmentsWithBusinessObjectives(workspace))
    setDepartmentObjectives(workspace.departmentObjectives)
    setDepartmentTasks(workspace.departmentTasks ?? [])
    setAttendees((workspace.attendees ?? []).map((attendee) => ({ ...attendee, challenge: attendee.challenge ?? '' })))
    const loadedIdeas = (workspace.ideas ?? []).map((idea) => {
      const membership =
        memberships.find((item) => item.id === idea.membershipId) ??
        memberships.find((item) => item.attendeeId === idea.attendeeId && item.groupId === idea.groupId)
      return normaliseIdea({
        ...idea,
        membershipId: idea.membershipId ?? membership?.id,
        isTopIdea: idea.isTopIdea ?? false,
      })
    })
    setIdeas(loadedIdeas)
    setTasks(workspaceTasksWithTopFive({ ...workspace, groupMemberships: memberships }, loadedIdeas))
    setTotalPeople(workspace.totalPeople)
    setAdoptionPulse(workspace.adoptionPulse ?? [])
    setFacilitatorPulse(normaliseFacilitatorPulse(workspace))
    setConfidencePulse(normaliseConfidencePulse(workspace))
    setOverallConfidence(normaliseOverallConfidence(workspace))
    setAdoptionScoreTracking(workspace.adoptionScoreTracking)
    setSelectedPriorityGroup('all')
    setSelectedActionGroup('all')
  }

  function startNewWorkshop() {
    const confirmed = window.confirm(
      'Start a new workshop? This clears the current workshop and all locally saved client data from this browser. This cannot be undone.',
    )
    if (!confirmed) return
    const blank = blankClientWorkspace()
    suppressNextPersistence.current = true
    window.localStorage.removeItem(workshopStorageKey)
    setCustomerName('')
    setDeletedIdeaIds([])
    loadClientWorkspace(blank)
    setCurrentAgendaIndex(1)
    setActiveView('Home')
  }

  function addGroup() {
    const nextId = Math.max(0, ...groups.map((group) => group.id)) + 1
    setGroups([
      ...groups,
      {
        id: nextId,
        name: `Group ${nextId}`,
        department: '',
        champion: '',
        facilitator: '',
        table: '',
      },
    ])
  }

  function createGroupsFromDepartments() {
    const departmentGroups = departments.map((department, index) => ({
      id: department.id,
      name: department.name,
      department: department.name,
      champion: department.champion,
      facilitator: 'Session lead',
      table: `Table ${index + 1}`,
    }))

    setAttendees(
      attendees.map((attendee) => {
        const matchingGroup = departmentGroups.find((group) => group.department === attendee.team)
        return matchingGroup ? { ...attendee, groupId: matchingGroup.id } : attendee
      }),
    )
    setGroupMemberships(
      groupMemberships.map((membership) => {
        const currentGroup = groups.find((group) => group.id === membership.groupId)
        const matchingGroup = departmentGroups.find((group) => group.department === currentGroup?.department)
        return matchingGroup ? { ...membership, groupId: matchingGroup.id } : membership
      }),
    )

    setIdeas(
      ideas.map((idea) => {
        const currentGroup = groups.find((group) => group.id === idea.groupId)
        const matchingGroup = departmentGroups.find((group) => group.department === currentGroup?.department)
        return matchingGroup ? { ...idea, groupId: matchingGroup.id } : idea
      }),
    )

    setTasks(
      tasks.map((task) => {
        const currentGroup = groups.find((group) => group.id === task.groupId)
        const matchingGroup = departmentGroups.find((group) => group.department === currentGroup?.department)
        return matchingGroup ? { ...task, groupId: matchingGroup.id } : task
      }),
    )

    setGroups(departmentGroups)
    setTotalPeople(departments.reduce((total, department) => total + department.headcount, 0))
    setSelectedPriorityGroup('all')
    setSelectedActionGroup('all')
  }

  function stageLabel(stage: Stage) {
    return stage === 'Web'
      ? 'Copilot Web'
      : stage === 'Apps'
        ? 'Copilot in Microsoft 365 apps'
        : stage === 'Standard agent'
          ? 'Copilot standard agent'
          : stage === 'Copilot Studio'
            ? 'Copilot Studio agent'
            : 'GitHub Copilot'
  }

  function managedQuarterProjectAction(task: Task, quarterId: number) {
    const group = groups.find((item) => item.id === task.groupId)
    const idea = ideas.find((item) => item.id === task.ideaId)
    const projectName = idea?.title ?? task.action
    if (quarterId === 1) {
      return {
        title: 'Morning adoption check-in, afternoon agent build',
        detail: `Morning: speak with ${group?.department ?? 'the relevant group'} staff about how Copilot is being adopted since the workshop, share quick tips linked to "${projectName}" and review anything new in the market that Unleashed believes could help. Afternoon: build or develop the agent/workflow with ${task.owner} or the nominated champion.`,
        evidence: `Staff feedback, tips/tricks shared, new market opportunity decision, first agent/workflow build notes and baseline measure: ${task.measure}`,
      }
    }
    if (quarterId === 2) {
      return {
        title: 'Morning adoption review, afternoon agent/Copilot Studio/GitHub progression',
        detail: `Morning: review how staff are finding "${projectName}", what is in place, what is being adopted, whether it is delivering return and whether any new market capability should be added to a future roadmap. Afternoon: build further on the agent/workflow or decide whether this should move into Copilot Studio or GitHub Copilot.`,
        evidence: `Adoption review, return evidence, new market opportunity decision, rollout decision and progression route.`,
      }
    }
    if (quarterId === 3) {
      return {
        title: 'Morning review and tips, afternoon development lab',
        detail: `Morning: review what happened with "${projectName}" in Quarter 2, check adoption, share tips, improve prompt confidence and consider any new market developments Unleashed believes could add value. Afternoon: develop the existing agent/workflow further or start a new related opportunity from the backlog.`,
        evidence: `Quarter 2 review, tips/training notes, new market opportunity decision, fine-tuning log and next-wave development record.`,
      }
    }
    return {
      title: 'Morning annual review, afternoon next-12-month planning',
      detail: `Morning: review the annual value of "${projectName}" and decide whether to keep, scale, improve or retire it, including whether new market developments should be added to the next roadmap. Afternoon: feed the outcome into the next 12-month Copilot, agent and automation roadmap.`,
      evidence: `Annual value summary, new market opportunity decision, next-year recommendation and Adoption Score movement.`,
    }
  }

  function addAttendee() {
    const nextId = Math.max(0, ...attendees.map((attendee) => attendee.id)) + 1
    const groupId = groups[0]?.id ?? 1
    const membershipId = Math.max(0, ...groupMemberships.map((membership) => membership.id)) + 1
    setAttendees([
      ...attendees,
      {
        id: nextId,
        name: `Attendee ${nextId}`,
        team: '',
        role: '',
        confidence: 'Beginner',
        groupId,
        challenge: '',
      },
    ])
    setGroupMemberships([...groupMemberships, { id: membershipId, groupId, attendeeId: nextId, challenge: '', improvement: '' }])
    setConfidencePulse([...confidencePulse, { attendeeId: nextId, ratings: blankConfidenceRatings() }])
    setOverallConfidence([...overallConfidence, { attendeeId: nextId, before: 0, after: 0 }])
  }

  function addMembership(groupId: number, attendeeId: number) {
    if (groupMemberships.some((membership) => membership.groupId === groupId && membership.attendeeId === attendeeId)) return
    const nextId = Math.max(0, ...groupMemberships.map((membership) => membership.id)) + 1
    setGroupMemberships([...groupMemberships, { id: nextId, groupId, attendeeId, challenge: '', improvement: '' }])
  }

  function ideaForMembership(membership: WorkshopGroupMembership, attendee: Attendee, challenge: string): Idea {
    const nextId = Math.max(0, ...ideas.map((idea) => idea.id), ...deletedIdeaIds) + 1
    return normaliseIdea({
      id: nextId,
      groupId: membership.groupId,
      attendeeId: attendee.id,
      membershipId: membership.id,
      goalId: objectives[0]?.id ?? 1,
      departmentObjectiveId: 0,
      departmentTaskId: 0,
      title: challenge,
      pain: challenge,
      opportunity: '',
      stage: 'Apps',
      benefit: '',
      concerns: '',
      impact: 3,
      ease: 3,
      risk: 2,
      readiness: 3,
      status: 'Idea only',
    })
  }

  function updateMembershipChallenge(id: number, challenge: string) {
    const membership = groupMemberships.find((item) => item.id === id)
    const attendee = attendees.find((item) => item.id === membership?.attendeeId)
    if (!membership || !attendee) return
    const linkedIdeas = ideas.filter((idea) => idea.membershipId === id)
    setGroupMemberships(groupMemberships.map((item) => (item.id === id ? { ...item, challenge } : item)))

    if (!linkedIdeas.length && challenge.trim()) {
      setIdeas([ideaForMembership(membership, attendee, challenge), ...ideas])
    }
  }

  function updateMembershipImprovement(id: number, improvement: string) {
    setGroupMemberships(
      groupMemberships.map((membership) => (membership.id === id ? { ...membership, improvement } : membership)),
    )
  }

  function removeMembership(id: number) {
    const linkedIdeaIds = ideas.filter((idea) => idea.membershipId === id).map((idea) => idea.id)
    setGroupMemberships(groupMemberships.filter((membership) => membership.id !== id))
    setIdeas(ideas.filter((idea) => idea.membershipId !== id))
    setTasks(tasks.filter((task) => !linkedIdeaIds.includes(task.ideaId)))
  }

  function setIdeaShortlisted(id: number, shortlisted: boolean) {
    setIdeas(
      ideas.map((idea) =>
        idea.id === id
          ? {
              ...idea,
              status: shortlisted || idea.isTopIdea ? (idea.isTopIdea ? 'Priority' : 'Shortlisted') : 'Idea only',
            }
          : idea,
      ),
    )
  }

  function setIdeaTopFive(id: number, selected: boolean) {
    const idea = ideas.find((item) => item.id === id)
    if (!idea || (selected && topFiveIdeas.length >= priorityIdeaLimit && !idea.isTopIdea)) return
    if (selected && !tasks.some((task) => task.ideaId === id)) {
      const nextId = Math.max(0, ...tasks.map((task) => task.id)) + 1
      setTasks([...tasks, linkedProjectTask(idea, groupMemberships, attendees, groups, nextId)])
    }
    setIdeas(
      ideas.map((item) =>
        item.id === id
          ? {
              ...item,
              isTopIdea: selected,
              status: selected ? 'Priority' : 'Shortlisted',
            }
          : item,
      ),
    )
  }

  function updateIdea(id: number, patch: Partial<Idea>) {
    setIdeas(ideas.map((idea) => (idea.id === id ? { ...idea, ...patch } : idea)))
  }

  function updateTask(id: number, patch: Partial<Task>) {
    setTasks((currentTasks) => currentTasks.map((task) => (task.id === id ? { ...task, ...patch } : task)))
  }

  function updateAttendee(id: number, patch: Partial<Attendee>) {
    setAttendees(attendees.map((attendee) => (attendee.id === id ? { ...attendee, ...patch } : attendee)))
  }

  function updateGroup(id: number, patch: Partial<Group>) {
    setGroups(groups.map((group) => (group.id === id ? { ...group, ...patch } : group)))
  }

  function updateOverallConfidence(attendeeId: number, moment: 'before' | 'after', value: number) {
    const score = Math.max(0, Math.min(5, Math.round(value * 2) / 2))
    setOverallConfidence((entries) =>
      entries.map((entry) => (entry.attendeeId === attendeeId ? { ...entry, [moment]: score } : entry)),
    )
  }

  function updateAdoptionScore(pillar: string, patch: Partial<AdoptionScoreTracking>) {
    setAdoptionScoreTracking(
      adoptionScoreTracking.map((item) =>
        item.pillar === pillar
          ? {
              ...item,
              ...patch,
              baseline: Math.max(0, Math.min(600, patch.baseline ?? item.baseline)),
              previous: Math.max(0, Math.min(600, patch.previous ?? item.previous)),
              current: Math.max(0, Math.min(600, patch.current ?? item.current)),
              target: Math.max(0, Math.min(600, patch.target ?? item.target)),
            }
          : item,
      ),
    )
  }

  function updateObjective(id: number, patch: Partial<ObjectiveNode>) {
    setObjectives(objectives.map((objective) => (objective.id === id ? { ...objective, ...patch } : objective)))
  }

  function updateCompanyGoal(patch: Partial<ObjectiveNode>) {
    if (!ultimateObjective) return
    updateObjective(ultimateObjective.id, patch)
  }

  function addDepartment() {
    const nextId = Math.max(0, ...departments.map((department) => department.id)) + 1
    setDepartments([
      ...departments,
      {
        id: nextId,
        name: `Department ${nextId}`,
        lead: '',
        headcount: 0,
        champion: '',
        focus: '',
        businessObjective: '',
        collaborations: [],
      },
    ])
  }

  function updateDepartment(id: number, patch: Partial<Department>) {
    setDepartments(departments.map((department) => (department.id === id ? { ...department, ...patch } : department)))
  }

  function removeDepartment(id: number) {
    setDepartments(
      departments
        .filter((department) => department.id !== id)
        .map((department) => ({
          ...department,
          collaborations: department.collaborations.filter((collaboration) => collaboration.departmentId !== id),
        })),
    )
  }

  function removeGroup(id: number) {
    if (groups.length <= 1) return
    const fallbackGroup = groups.find((group) => group.id !== id)
    if (!fallbackGroup) return
    const duplicateMembershipIds = groupMemberships
      .filter(
        (membership) =>
          membership.groupId === id &&
          groupMemberships.some(
            (other) => other.groupId === fallbackGroup.id && other.attendeeId === membership.attendeeId,
          ),
      )
      .map((membership) => membership.id)
    const removedIdeaIds = ideas
      .filter((idea) => idea.membershipId !== undefined && duplicateMembershipIds.includes(idea.membershipId))
      .map((idea) => idea.id)
    setGroups(groups.filter((group) => group.id !== id))
    setGroupMemberships(
      groupMemberships
        .filter((membership) => !duplicateMembershipIds.includes(membership.id))
        .map((membership) => (membership.groupId === id ? { ...membership, groupId: fallbackGroup.id } : membership)),
    )
    setAttendees(attendees.map((attendee) => (attendee.groupId === id ? { ...attendee, groupId: fallbackGroup.id } : attendee)))
    setIdeas(
      ideas
        .filter((idea) => !removedIdeaIds.includes(idea.id))
        .map((idea) => (idea.groupId === id ? { ...idea, groupId: fallbackGroup.id } : idea)),
    )
    setTasks(
      tasks
        .filter((task) => !removedIdeaIds.includes(task.ideaId))
        .map((task) => (task.groupId === id ? { ...task, groupId: fallbackGroup.id } : task)),
    )
    if (selectedPriorityGroup === id) setSelectedPriorityGroup('all')
    if (selectedActionGroup === id) setSelectedActionGroup('all')
  }

  function removeIdea(idea: Idea) {
    const source = ideaSourceContext(idea, groupMemberships, attendees)
    const confirmed = window.confirm(
      `Delete “${idea.title}” for ${source.contributorName}? This removes it from prioritisation, Projects and exports without changing the Workshop Group member or their original task.`,
    )
    if (!confirmed) return
    setIdeas((currentIdeas) => currentIdeas.filter((item) => item.id !== idea.id))
    setTasks((currentTasks) => currentTasks.filter((task) => task.ideaId !== idea.id))
    setDeletedIdeaIds((currentIds) => (currentIds.includes(idea.id) ? currentIds : [...currentIds, idea.id]))
  }

  function moveIdea(id: number, direction: -1 | 1) {
    const index = ideas.findIndex((idea) => idea.id === id)
    const targetIndex = index + direction
    if (index < 0 || targetIndex < 0 || targetIndex >= ideas.length) return
    const nextIdeas = [...ideas]
    const [item] = nextIdeas.splice(index, 1)
    nextIdeas.splice(targetIndex, 0, item)
    setIdeas(nextIdeas)
  }

  function buildSummary() {
    const lines = [
      `# ${workshopName}`,
      '',
      `Customer: ${clientDisplayName}`,
      `Date: ${workshopDate}`,
      '',
      '## Workshop summary',
      `- Total people in room: ${totalPeople}`,
      `- Named attendees: ${attendees.length}`,
      `- Workshop Groups: ${groups.length}`,
      `- Ideas logged: ${ideas.length}`,
      `- Shortlisted ideas: ${filteredPriorityIdeas.length}`,
      `- Workshop-wide top ideas: ${topFiveIdeas.length}/${priorityIdeaLimit}`,
      `- Project recommendations: ${stats.projectActions}`,
      '',
      '## Overall Copilot confidence before / after',
      `- Scale: 1 Not confident to 5 Very confident, with 0.5 increments | Maximum total: ${confidenceSummary.maximumTotal}`,
      ...attendees.map((attendee) => {
        const entry = overallConfidence.find((item) => item.attendeeId === attendee.id)
        const movement = entry?.before && entry.after ? entry.after - entry.before : null
        return `- ${attendee.name} | Before: ${entry?.before ? formatConfidenceScore(entry.before) : '-'} | After: ${entry?.after ? formatConfidenceScore(entry.after) : '-'} | Change: ${movement === null ? '-' : `${movement >= 0 ? '+' : ''}${formatConfidenceScore(movement)}`}`
      }),
      '',
      '## Business and department context',
      `- Company goal: ${ultimateObjective?.title ?? 'Not entered'} | Owner: ${ultimateObjective?.owner ?? 'Unassigned'}`,
      ...departments.map(
        (department) =>
          `- ${department.name} | Lead: ${department.lead || 'Unassigned'} | Champion: ${department.champion || 'Unassigned'} | People: ${department.headcount} | Focus: ${department.focus || 'Not entered'} | Department Business Objective: ${department.businessObjective || 'Not entered'}`,
      ),
      '',
      '## Workshop Groups and member tasks',
      ...groups.flatMap((group) => {
        const memberships = groupMemberships.filter((membership) => membership.groupId === group.id)
        if (!memberships.length) return [`- ${group.name} | No members assigned`]
        return memberships.map((membership) => {
          const attendee = attendees.find((item) => item.id === membership.attendeeId)
          return `- ${group.name} | ${attendee?.name ?? 'Unknown member'} | AI-help task: ${membership.challenge || 'Not entered'} | Ultimately improves: ${membership.improvement || 'Not entered'}`
        })
      }),
      '',
      '## Ideas by Workshop Group and member task',
      ...ideas.flatMap((idea) => {
        const source = ideaSourceContext(idea, groupMemberships, attendees)
        const group = groups.find((item) => item.id === idea.groupId)
        return [
          `### ${idea.title} — ${group?.name ?? 'No Workshop Group'} — ${source.contributorName}`,
          `- Source task: ${source.sourceTask || 'Not entered'} | Ultimately improves: ${source.sourceImprovement || 'Not entered'} | Copilot stage: ${stageLabel(idea.stage)}`,
          `- Current task or process / pain: ${idea.pain || 'Not entered'}`,
          `- Difficult, slow or inconsistent today: ${idea.difficulty || 'Not entered'}`,
          `- AI/Copilot idea: ${idea.opportunity || 'Not entered'}`,
          `- Ideal outcome or improvement: ${idea.idealOutcome || 'Not entered'}`,
          `- Information/data needed and source: ${idea.informationNeeded || 'Not entered'}`,
          `- Apps/systems or integration: ${idea.integrationNeed || 'Not entered'} | Dependencies: ${idea.integrationSystems || 'Not entered'}`,
          `- Users / beneficiaries / scope: ${idea.userScopes?.join(', ') || 'Not entered'} | ${idea.mainUsers || 'Not entered'}`,
          `- Expected benefit or time/value gain: ${idea.benefit || 'Not entered'}`,
          `- Risks, controls, human review or dependencies: ${idea.concerns || 'Not entered'}`,
          ...(idea.supportingContext ? [`- Supporting contributors / merged evidence: ${idea.supportingContext}`] : []),
          `- Recommended Copilot stage: ${stageLabel(idea.stage)}`,
          `- Optional advanced — Ideal AI interaction: ${idea.idealInteraction || 'Not entered'}`,
          `- AI output or action: ${idea.aiOutput || 'Not entered'}`,
          `- Usage: ${idea.usageFrequency || 'Not entered'} | Context: ${idea.usageContext || 'Not entered'}`,
          `- Human review: ${idea.humanReview || 'Not entered'}`,
          `- Success criteria: ${idea.successCriteria || 'Not entered'} | Detailed constraints: ${idea.constraints || 'Not entered'}`,
        ]
      }),
      '',
      '## Workshop-wide top 5',
      ...topFiveIdeas.map(
        (idea, index) => {
          const source = ideaSourceContext(idea, groupMemberships, attendees)
          return `${index + 1}. ${idea.title} — Workshop Group: ${groups.find((group) => group.id === idea.groupId)?.name ?? 'No Workshop Group'} — Member: ${source.contributorName} — Task: ${source.sourceTask || 'Not entered'} — ${idea.stage} — score ${priorityScore(idea)}`
        },
      ),
      '',
      '## Top 5 projects',
      ...activeProjectTasks.map((task) => {
        const idea = ideas.find((item) => item.id === task.ideaId)
        const group = groups.find((item) => item.id === task.groupId)
        const source = idea ? ideaSourceContext(idea, groupMemberships, attendees) : undefined
        return `- ${idea?.title ?? task.action} | Workshop Group: ${group?.name ?? 'No Workshop Group'} | Member: ${source?.contributorName ?? 'Legacy idea'} | Original task: ${source?.sourceTask || idea?.pain || 'Not entered'} | Ultimately improves: ${source?.sourceImprovement || 'Not entered'} | Current difficulty: ${idea?.difficulty || 'Not entered'} | AI/Copilot idea: ${idea?.opportunity || 'Not entered'} | Ideal outcome: ${idea?.idealOutcome || 'Not entered'} | Information/data needed and source: ${idea?.informationNeeded || 'Not entered'} | Integration: ${idea?.integrationNeed || 'Not entered'} | Systems/data sources: ${idea?.integrationSystems || 'Not entered'} | User scope: ${idea?.userScopes?.join(', ') || 'Not entered'} | Main users: ${idea?.mainUsers || 'Not entered'} | Benefit: ${idea?.benefit ?? 'Not entered'} | Risks/controls/review/dependencies: ${idea?.concerns || 'Not entered'}${idea?.supportingContext ? ` | Supporting contributors/merged evidence: ${idea.supportingContext}` : ''} | Copilot stage: ${stageLabel(idea?.stage ?? task.copilotStage)} | Optional advanced — Ideal AI interaction: ${idea?.idealInteraction || 'Not entered'} | AI output: ${idea?.aiOutput || 'Not entered'} | Usage: ${idea?.usageFrequency || 'Not entered'}${idea?.usageContext ? ` (${idea.usageContext})` : ''} | Human review: ${idea?.humanReview || 'Not entered'} | Success criteria: ${idea?.successCriteria || 'Not entered'} | Constraints: ${idea?.constraints || 'Not entered'} | Action: ${task.action} | Owner: ${task.owner || 'Unassigned'} | Target timing: ${task.dueDate || 'Not entered'} | Measure: ${task.measure || 'Not entered'} | Sensitive data access: ${task.sensitiveDataAccess ?? 'No'}${task.sensitiveDataAccess === 'Yes' ? ` | Sensitive data detail: ${task.sensitiveDataDetails || 'Required detail not entered'}` : ''} | Data protection: ${task.dataProtection || 'Not entered'} | Build governance: ${task.buildGovernance || task.governance || 'Not entered'} | Adoption monitoring: ${task.adoptionMonitoring || 'Not entered'} | Demo/pilot lead time: ${task.leadTime || 'Not entered'}`
      }),
    ]
    return lines.join('\n')
  }

  function downloadSummary() {
    const blob = new Blob([`\uFEFF${buildSummary()}`], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${reportSlug()}-copilot-workshop-summary.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  function escapeReport(value: string | number | undefined | null) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')
  }

  function reportShell(title: string, subtitle: string, body: string) {
    const logoUrl = `${window.location.origin}/unleashed-logo.png`
    const sectionedBody = wrapReportSections(body)
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeReport(title)}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { margin: 0; font-family: Aptos, Segoe UI, Arial, sans-serif; color: #0b1f35; background: #eaf7ff; font-size:16px; line-height:1.55; }
    .page { width: 1120px; margin: 0 auto; background: white; box-shadow: 0 24px 70px rgba(7,26,63,.16); }
    .cover { height: 760px; min-height: 760px; padding: 44px; color: white; background: radial-gradient(circle at 80% 8%, rgba(255,42,160,.82), transparent 22%), radial-gradient(circle at 14% 90%, rgba(0,212,255,.55), transparent 23%), linear-gradient(135deg,#071a3f 0%,#0b5cad 40%,#7c3aed 72%,#ff2aa0 100%); border-radius: 0; break-after: page; page-break-after: always; position: relative; overflow: hidden; page-break-inside: avoid; break-inside: avoid; }
    .cover::before { content:''; position:absolute; width:520px; height:520px; right:-190px; bottom:-160px; border-radius:999px; border:70px solid rgba(255,255,255,.13); }
    .cover::after { content:''; position:absolute; width:260px; height:260px; left:58%; top:56%; border-radius:60px; transform:rotate(18deg); background:rgba(255,255,255,.10); }
    .cover-inner { position:relative; z-index:1; display:grid; grid-template-columns: 1.15fr .85fr; gap:34px; min-height:660px; align-items:stretch; }
    .cover-logo-card { display:inline-flex; align-items:center; width:max-content; margin-bottom:34px; }
    .logo { width: 300px; display:block; filter: drop-shadow(0 18px 34px rgba(0,0,0,.28)); }
    .cover-pill { display:inline-block; padding:10px 14px; border-radius:999px; color:#071a3f; background:#8ee8ff; font-size:13px; font-weight:950; text-transform:uppercase; letter-spacing:.12em; margin-bottom:18px; }
    .cover-date { margin: 0 0 18px; color:#8ee8ff; font-size:15px; font-weight:950; letter-spacing:.04em; }
    .cover-meta { display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; margin-top:34px; }
    .cover-meta div { padding:16px; border-radius:22px; background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.22); backdrop-filter:blur(10px); }
    .cover-meta b { display:block; font-size:26px; letter-spacing:-.06em; }
    .cover-meta span { display:block; margin-top:5px; color:rgba(255,255,255,.78); font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:.08em; }
    .cover-side { display:grid; align-content:space-between; gap:16px; }
    .cover-panel { padding:22px; border-radius:30px; background:rgba(255,255,255,.94); color:#071a3f; box-shadow:0 22px 54px rgba(0,0,0,.20); }
    .cover-panel.dark { color:white; background:linear-gradient(135deg,#071a3f,#0b5cad 60%,#00d4ff); }
    .cover-panel h3 { color:inherit; font-size:22px; margin:0 0 8px; }
    .cover-panel p { margin:0; color:inherit; opacity:.82; line-height:1.35; font-weight:800; }
    .cover-brand-line { display:grid; gap:9px; }
    .cover-brand-line span { height:12px; border-radius:999px; background:linear-gradient(90deg,#00d4ff,#7c3aed,#ff2aa0,#f28c28); }
    h1 { margin: 0; max-width: 760px; font-size: 74px; line-height: .86; letter-spacing: -0.08em; text-shadow: 0 18px 44px rgba(0,0,0,.28); }
    h2 { margin: 0; font-size: 30px; line-height: 1; letter-spacing: -0.06em; color: white; }
    h3 { margin: 0 0 8px; font-size: 18px; color: #123b5d; }
    .subtitle { margin: 18px 0 0; max-width: 850px; font-size: 21px; color: #d9ecff; }
    .content { padding: 28px 32px 46px; }
    .report-section { break-before: page; page-break-before: always; min-height: 650px; padding-top: 0; overflow: hidden; }
    .report-section.first { break-before: auto; page-break-before: auto; }
    .section-ribbon { display:grid; grid-template-columns:auto 1fr auto; gap:16px; align-items:center; margin:0 0 18px; padding:16px 18px; color:white; background:radial-gradient(circle at 92% 0%, rgba(255,42,160,.52), transparent 34%), linear-gradient(135deg,#071a3f,#0b5cad 52%,#7c3aed); border-radius:28px; box-shadow:0 18px 42px rgba(7,26,63,.22); position:relative; overflow:hidden; }
    .section-ribbon::after { content:''; position:absolute; left:0; right:0; bottom:0; height:7px; background:linear-gradient(90deg,#00d4ff,#7c3aed,#ff2aa0,#f28c28); }
    .section-number { width:54px; height:54px; display:grid; place-items:center; border-radius:18px; color:#071a3f; background:#8ee8ff; font-size:24px; font-weight:950; letter-spacing:-.06em; }
    .section-title small { display:block; margin-bottom:4px; color:#8ee8ff; font-size:11px; font-weight:950; text-transform:uppercase; letter-spacing:.16em; }
    .section-title h2 { color:white; }
    .section-meta { text-align:right; color:rgba(255,255,255,.82); font-size:12px; font-weight:900; text-transform:uppercase; letter-spacing:.08em; }
    .kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin: 28px 0; }
    .kpi { padding: 20px; border-radius: 24px; background: linear-gradient(135deg,#eaf7ff,#fff); border: 1px solid #b9dbf7; box-shadow: 0 14px 34px rgba(7,26,63,.10); }
    .kpi:nth-child(1) { background: linear-gradient(135deg,#071a3f,#0b5cad); color: white; }
    .kpi:nth-child(2) { background: linear-gradient(135deg,#0f8a5f,#00d4ff); color: #031224; }
    .kpi:nth-child(3) { background: linear-gradient(135deg,#7c3aed,#ff2aa0); color: white; }
    .kpi:nth-child(4) { background: linear-gradient(135deg,#f28c28,#ff2aa0); color: white; }
    .kpi:nth-child(5) { background: linear-gradient(135deg,#eaf7ff,#ffffff); }
    .kpi b { display:block; font-size: 44px; line-height: .9; letter-spacing: -0.08em; }
    .kpi span { color:#526173; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; }
    .kpi:nth-child(1) span, .kpi:nth-child(3) span, .kpi:nth-child(4) span { color: rgba(255,255,255,.82); }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .chart-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 10px 0 14px; page-break-inside: avoid; break-inside: avoid; }
    .chart-card { min-height: 148px; max-height: 190px; padding: 12px; border-radius: 18px; background: radial-gradient(circle at 95% 0%, rgba(0,212,255,.18), transparent 32%), linear-gradient(135deg,#ffffff,#f2fbff); border: 1px solid #d7e6f8; page-break-inside: avoid; break-inside: avoid; box-shadow: 0 8px 18px rgba(7,26,63,.08); overflow: hidden; }
    .chart-card h3 { font-size:14px; margin-bottom:6px; }
    .chart-wrap { display: flex; align-items: center; gap: 8px; min-width:0; }
    .donut-svg { width: 78px; height: 78px; flex: 0 0 78px; filter: drop-shadow(0 5px 9px rgba(7,26,63,.10)); }
    .donut-total { font-size: 18px; font-weight: 950; fill:#071a3f; letter-spacing:-.05em; }
    .donut-label { font-size: 7px; fill:#526173; font-weight:900; letter-spacing:.07em; text-transform:uppercase; }
    .legend { display: grid; gap: 5px; flex: 1; min-width:0; }
    .legend span { display: flex; align-items: center; gap: 7px; color: #3d4f63; font-size: 13px; font-weight: 800; line-height:1.35; }
    .swatch { width: 10px; height: 10px; border-radius: 3px; display: inline-block; flex:0 0 auto; }
    .bar-row { display: grid; grid-template-columns: 150px 1fr 34px; gap: 8px; align-items: center; margin: 7px 0; font-size: 13px; font-weight: 800; color: #3d4f63; }
    .bar-track { height: 8px; border-radius: 999px; background: #e5eef8; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg,#0b5cad,#00d4ff,#ff2aa0); }
    .matrix-chart { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .quadrant { min-height: 62px; padding: 10px; border-radius: 16px; color: white; background: linear-gradient(135deg,#0b5cad,#7c3aed); }
    .quadrant:nth-child(2) { background: linear-gradient(135deg,#0f8a5f,#00d4ff); color: #031224; }
    .quadrant:nth-child(3) { background: linear-gradient(135deg,#f28c28,#ff2aa0); }
    .quadrant:nth-child(4) { background: linear-gradient(135deg,#64748b,#111827); }
    .quadrant b { display: block; font-size: 24px; letter-spacing: -0.08em; }
    .quadrant span { font-size:10px; line-height:1.2; }
    .card { padding: 18px; border-radius: 24px; background: #f7fbff; border: 1px solid #d7e6f8; break-inside: avoid; }
    .report-card-grid { display:grid; grid-template-columns: repeat(2, 1fr); gap:16px; margin:18px 0 28px; }
    .report-card { padding:20px; border-radius:28px; background:linear-gradient(135deg,#ffffff,#f2fbff); border:1px solid #cfe4f8; box-shadow:0 16px 38px rgba(7,26,63,.10); break-inside:avoid; }
    .report-card.feature { color:white; background:radial-gradient(circle at 92% 0%, rgba(255,42,160,.42), transparent 32%), linear-gradient(135deg,#071a3f,#0b5cad 58%,#7c3aed); }
    .report-card.priority { color:white; background:linear-gradient(135deg,#0f8a5f,#00d4ff); }
    .report-card.shortlisted { color:white; background:linear-gradient(135deg,#0b5cad,#7c3aed); }
    .report-card.idea-only { color:white; background:linear-gradient(135deg,#f28c28,#ff2aa0); }
    .report-card h3 { margin:0 0 8px; font-size:24px; line-height:1; letter-spacing:-.05em; color:inherit; }
    .report-card p { margin:11px 0 0; color:inherit; opacity:.94; font-size:16px; line-height:1.55; font-weight:750; }
    .report-card p:has(> strong) { position:relative; padding-left:18px; }
    .report-card p:has(> strong)::before { content:'•'; position:absolute; left:2px; top:0; font-weight:950; }
    .report-card p > strong { font-weight:950; }
    .report-card .meta { display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }
    .report-card .meta span { display:inline-block; padding:7px 10px; border-radius:999px; color:#071a3f; background:white; font-size:11px; font-weight:950; text-transform:uppercase; letter-spacing:.06em; }
    .report-card.feature .meta span, .report-card.priority .meta span, .report-card.shortlisted .meta span, .report-card.idea-only .meta span { color:#071a3f; background:rgba(255,255,255,.92); }
    .hero-card-report { padding: 28px; border-radius: 30px; color: white; background: radial-gradient(circle at 92% 12%, rgba(255,42,160,.48), transparent 30%), linear-gradient(135deg,#071a3f,#0b5cad 60%,#00d4ff); box-shadow: 0 22px 50px rgba(7,26,63,.22); break-inside: avoid; }
    .tag { display:inline-block; padding: 7px 11px; border-radius: 999px; color:white; font-size: 12px; font-weight:900; }
    .priority { background: linear-gradient(135deg,#0f8a5f,#00d4ff); }
    .shortlisted { background: linear-gradient(135deg,#0b5cad,#7c3aed); }
    .idea-only { background: linear-gradient(135deg,#f28c28,#ff2aa0); }
    .not-selected { color:#4b5563; background:#e5e7eb; }
    table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 12px 0 24px; break-inside: auto; border: 1px solid #d7e6f8; border-radius: 18px; overflow: hidden; box-shadow: 0 12px 30px rgba(7,26,63,.08); }
    thead { display: table-header-group; }
    th { color: white; background: #123b5d; text-align: left; font-size: 13px; text-transform: uppercase; letter-spacing: .06em; }
    th, td { padding: 12px; border-right: 1px solid #d7e6f8; border-bottom: 1px solid #d7e6f8; vertical-align: top; }
    td { font-size: 14px; line-height: 1.55; }
    tr:nth-child(even) td { background: #f0f8ff; }
    .stage { padding: 14px; border-radius: 18px; color: white; background: linear-gradient(135deg,#0b5cad,#7c3aed); margin-bottom: 10px; }
    .stage:nth-child(2n) { background: linear-gradient(135deg,#0f8a5f,#00d4ff); }
    .stage:nth-child(3n) { background: linear-gradient(135deg,#f28c28,#ff2aa0); }
    .small { color:#526173; font-size: 13px; }
    .section-break { page-break-before: always; }
    @media print {
      body { background: white; font-size:12pt; line-height:1.5; }
      .page { width: 100%; max-width: none; box-shadow: none; }
      .report-card p { font-size:12pt; line-height:1.5; }
      th { font-size:11pt; }
      td { font-size:11pt; line-height:1.5; }
    }
  </style>
</head>
<body>
  <main class="page">
    <section class="cover">
      <div class="cover-inner">
        <div>
          <div class="cover-logo-card"><img class="logo" src="${logoUrl}" alt="Unleashed" /></div>
          <div class="cover-pill">Microsoft Copilot Adoption Workshop Report</div>
          <h1>${escapeReport(title)}</h1>
          <p class="cover-date">Workshop date · ${escapeReport(workshopDate)}</p>
          <p class="subtitle">${escapeReport(subtitle)}</p>
          <div class="cover-meta">
            <div><b>${stats.attendees}</b><span>Attendees</span></div>
            <div><b>${stats.ideas}</b><span>Ideas captured</span></div>
            <div><b>${topFiveIdeas.length}</b><span>Top 5 ideas</span></div>
          </div>
        </div>
        <div class="cover-side">
          <div class="cover-panel">
            <h3>What this report contains</h3>
            <p>Business goals, Workshop Groups, member AI-help tasks, captured ideas, prioritisation outcomes, adoption projects and next-stage growth recommendations.</p>
          </div>
          <div class="cover-brand-line">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </section>
    <section class="content">${sectionedBody}</section>
  </main>
</body>
</html>`
  }

  function wrapReportSections(body: string) {
    let index = 0
    const sectioned = body.trim().replace(/<h2>(.*?)<\/h2>/g, (_, title: string) => {
      index += 1
      return `</section><section class="report-section"><div class="section-ribbon"><div class="section-number">${String(index).padStart(2, '0')}</div><div class="section-title"><small>Microsoft Copilot Adoption Workshop</small><h2>${title}</h2></div><div class="section-meta">${escapeReport(clientDisplayName)}<br/>Unleashed</div></div>`
    })
    return `${sectioned.replace(/^<\/section><section class="report-section">/, '<section class="report-section first">')}</section>`
  }

  function downloadHtmlReport(fileName: string, html: string) {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  function loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = src
    })
  }

  async function downloadPdfReport(fileName: string, reportType: 'full' | 'projects' | 'managed') {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const page = { width: 297, height: 210 }
    const palette = {
      navy: [7, 26, 63] as const,
      blue: [11, 92, 173] as const,
      cyan: [0, 212, 255] as const,
      magenta: [255, 42, 160] as const,
      purple: [124, 58, 237] as const,
      orange: [242, 140, 40] as const,
      green: [15, 138, 95] as const,
      pale: [234, 247, 255] as const,
      grey: [82, 97, 115] as const,
    }

    const logo = await loadImage(unleashedLogoUrl)
    const title =
      reportType === 'full'
        ? `${clientDisplayName} Microsoft Copilot Adoption Workshop Report`
        : reportType === 'projects'
          ? `${clientDisplayName} Copilot Projects Report`
          : `${clientDisplayName} Copilot Managed Service Report`

    function rgb(color: readonly [number, number, number]) {
      doc.setTextColor(color[0], color[1], color[2])
    }

    function fill(color: readonly [number, number, number]) {
      doc.setFillColor(color[0], color[1], color[2])
    }

    function addCover() {
      fill(palette.navy)
      doc.rect(0, 0, page.width, page.height, 'F')
      fill(palette.blue)
      doc.circle(254, 28, 78, 'F')
      fill(palette.magenta)
      doc.circle(36, 184, 72, 'F')
      doc.addImage(logo, 'PNG', 18, 18, 76, 18.5)
      fill(palette.cyan)
      doc.roundedRect(20, 58, 58, 10, 5, 5, 'F')
      rgb(palette.navy)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.text('MICROSOFT COPILOT WORKSHOP', 24, 65)
      rgb([255, 255, 255])
      doc.setFontSize(30)
      const titleLines = doc.splitTextToSize(title, 170) as string[]
      doc.text(titleLines, 20, 88, { lineHeightFactor: 1.05 })
      const subtitleY = Math.min(132, 91 + titleLines.length * 11)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'normal')
      doc.text('An adoption, prioritisation and project-planning report.', 20, subtitleY, { maxWidth: 150 })
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      rgb(palette.cyan)
      doc.text(`Workshop date · ${workshopDate}`, 20, 151)
      drawCoverStat('Attendees', String(stats.attendees), 20, 164, palette.cyan)
      drawCoverStat('Ideas', String(stats.ideas), 72, 164, palette.purple)
      drawCoverStat('Top 5', String(topFiveIdeas.length), 124, 164, palette.green)
    }

    function drawCoverStat(label: string, value: string, x: number, y: number, color: readonly [number, number, number]) {
      fill(color)
      doc.roundedRect(x, y, 42, 22, 6, 6, 'F')
      rgb([255, 255, 255])
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(15)
      doc.text(value, x + 4, y + 9)
      doc.setFontSize(6)
      doc.text(label.toUpperCase(), x + 4, y + 18)
    }

    function addSection(titleValue: string, sectionNumber: number) {
      doc.addPage()
      fill(palette.pale)
      doc.rect(0, 0, page.width, page.height, 'F')
      fill(palette.navy)
      doc.roundedRect(12, 10, 273, 21, 7, 7, 'F')
      fill(palette.cyan)
      doc.roundedRect(18, 15, 14, 11, 4, 4, 'F')
      rgb(palette.navy)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text(String(sectionNumber).padStart(2, '0'), 21, 23)
      rgb([255, 255, 255])
      const titleMaxWidth = 235
      let titleFontSize = 16
      doc.setFontSize(titleFontSize)
      let fittedTitle = doc.splitTextToSize(titleValue, titleMaxWidth)
      while (fittedTitle.length > 2 && titleFontSize > 10) {
        titleFontSize -= 0.5
        doc.setFontSize(titleFontSize)
        fittedTitle = doc.splitTextToSize(titleValue, titleMaxWidth)
      }
      doc.text(fittedTitle.slice(0, 2), 38, fittedTitle.length > 1 ? 18 : 24, { lineHeightFactor: 1.05 })
      doc.setFontSize(6)
      doc.text(`${clientDisplayName} | Microsoft Copilot Adoption Workshop`, 214, 29)
      fill(palette.cyan)
      doc.rect(12, 31, 80, 2, 'F')
      fill(palette.purple)
      doc.rect(92, 31, 80, 2, 'F')
      fill(palette.magenta)
      doc.rect(172, 31, 113, 2, 'F')
    }

    function drawKpi(label: string, value: string, x: number, y: number, color: readonly [number, number, number]) {
      fill(color)
      doc.roundedRect(x, y, 50, 30, 7, 7, 'F')
      rgb([255, 255, 255])
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.text(value, x + 5, y + 15)
      doc.setFontSize(6)
      doc.text(label.toUpperCase(), x + 5, y + 25)
    }

    function donutImage(items: Array<{ label: string; value: number; color: string }>) {
      const canvas = document.createElement('canvas')
      canvas.width = 260
      canvas.height = 260
      const ctx = canvas.getContext('2d')
      if (!ctx) return ''
      const total = Math.max(1, items.reduce((sum, item) => sum + item.value, 0))
      let start = -Math.PI / 2
      items.forEach((item) => {
        const angle = (item.value / total) * Math.PI * 2
        ctx.beginPath()
        ctx.strokeStyle = item.color
        ctx.lineWidth = 38
        ctx.arc(130, 130, 82, start, start + angle)
        ctx.stroke()
        start += angle
      })
      ctx.beginPath()
      ctx.fillStyle = '#ffffff'
      ctx.arc(130, 130, 48, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#071a3f'
      ctx.font = 'bold 42px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(String(items.reduce((sum, item) => sum + item.value, 0)), 130, 142)
      return canvas.toDataURL('image/png')
    }

    function drawDonut(titleValue: string, items: Array<{ label: string; value: number; color: string }>, x: number, y: number) {
      fill([255, 255, 255])
      doc.roundedRect(x, y, 130, 58, 8, 8, 'F')
      rgb(palette.navy)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(titleValue, x + 5, y + 8)
      doc.addImage(donutImage(items), 'PNG', x + 5, y + 12, 36, 36)
      doc.setFontSize(7)
      items.forEach((item, index) => {
        const rowY = y + 17 + index * 8
        const color = hexToRgb(item.color)
        fill(color)
        doc.roundedRect(x + 47, rowY - 4, 4, 4, 1, 1, 'F')
        rgb(palette.grey)
        doc.text(`${item.label}: ${item.value}`, x + 54, rowY)
      })
    }

    function drawBars(titleValue: string, rows: Array<{ label: string; value: number }>, x: number, y: number, width = 130) {
      fill([255, 255, 255])
      doc.roundedRect(x, y, width, 58, 8, 8, 'F')
      rgb(palette.navy)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(titleValue, x + 5, y + 8)
      const max = Math.max(1, ...rows.map((row) => row.value))
      rows.slice(0, 6).forEach((row, index) => {
        const rowY = y + 17 + index * 6
        rgb(palette.grey)
        doc.setFontSize(6)
        doc.text(doc.splitTextToSize(row.label, 42)[0], x + 5, rowY)
        fill(palette.blue)
        doc.roundedRect(x + 52, rowY - 3.5, Math.max(4, (row.value / max) * (width - 72)), 4, 2, 2, 'F')
        rgb(palette.navy)
        doc.text(String(row.value), x + width - 12, rowY)
      })
    }

    function drawStructuredCardBody(
      lines: string[],
      x: number,
      y: number,
      width: number,
      maxY: number,
      color: readonly [number, number, number],
    ) {
      const lineStep = 4.3
      let cursorY = y
      lines.forEach((line) => {
        if (cursorY > maxY) return
        const separatorIndex = line.indexOf(':')
        const hasLabel = separatorIndex > 0 && separatorIndex < 70
        if (!hasLabel) {
          rgb(color)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10.5)
          const wrapped = doc.splitTextToSize(line, width)
          wrapped.forEach((wrappedLine: string) => {
            if (cursorY > maxY) return
            doc.text(wrappedLine, x, cursorY)
            cursorY += lineStep
          })
          cursorY += 1
          return
        }
        const label = `${line.slice(0, separatorIndex).trim()}:`
        const answer = line.slice(separatorIndex + 1).trim() || 'Not entered'
        rgb(color)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10.5)
        doc.text('•', x, cursorY)
        doc.text(label, x + 5, cursorY)
        const labelWidth = doc.getTextWidth(label)
        const answerX = x + 7 + labelWidth
        const firstLineWidth = Math.max(0, width - 7 - labelWidth)
        doc.setFont('helvetica', 'normal')
        const words = answer.split(/\s+/)
        let firstLine = ''
        while (words.length && firstLineWidth >= 25) {
          const candidate = firstLine ? `${firstLine} ${words[0]}` : words[0]
          if (doc.getTextWidth(candidate) > firstLineWidth) break
          firstLine = candidate
          words.shift()
        }
        if (firstLine) doc.text(firstLine, answerX, cursorY)
        cursorY += lineStep
        const remaining = words.join(' ')
        if (remaining) {
          const wrapped = doc.splitTextToSize(remaining, width - 5)
          wrapped.forEach((wrappedLine: string) => {
            if (cursorY > maxY) return
            doc.text(wrappedLine, x + 5, cursorY)
            cursorY += lineStep
          })
        }
        cursorY += 1
      })
    }

    function drawTextCard(titleValue: string, lines: string[], x: number, y: number, width = 84, height = 44, feature = false) {
      fill(feature ? palette.blue : [255, 255, 255])
      doc.roundedRect(x, y, width, height, 8, 8, 'F')
      rgb(feature ? [255, 255, 255] : palette.navy)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text(doc.splitTextToSize(titleValue, width - 10), x + 5, y + 9)
      drawStructuredCardBody(
        lines,
        x + 5,
        y + 20,
        width - 10,
        y + height - 6,
        feature ? [255, 255, 255] : palette.navy,
      )
    }

    function drawCanvasTile(
      titleValue: string,
      lines: string[],
      x: number,
      y: number,
      width: number,
      height: number,
      accent: readonly [number, number, number],
    ) {
      fill([255, 255, 255])
      doc.roundedRect(x, y, width, height, 8, 8, 'F')
      fill(accent)
      doc.roundedRect(x, y, width, 5, 3, 3, 'F')
      rgb(palette.navy)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text(doc.splitTextToSize(titleValue, width - 12), x + 6, y + 14)
      drawStructuredCardBody(lines, x + 6, y + 25, width - 12, y + height - 6, palette.navy)
    }

    function drawSummaryCard(
      titleValue: string,
      value: string,
      lines: string[],
      x: number,
      y: number,
      width = 130,
      height = 62,
      feature = false,
    ) {
      fill(feature ? palette.blue : [255, 255, 255])
      doc.roundedRect(x, y, width, height, 8, 8, 'F')
      rgb(feature ? [205, 239, 255] : palette.blue)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(titleValue.toUpperCase(), x + 6, y + 10)
      rgb(feature ? [255, 255, 255] : palette.navy)
      doc.setFontSize(21)
      doc.text(doc.splitTextToSize(value, width - 12).slice(0, 1), x + 6, y + 25)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      const maxBodyLines = Math.max(4, Math.floor((height - 39) / 5))
      doc.text(doc.splitTextToSize(lines.join('\n'), width - 12).slice(0, maxBodyLines), x + 6, y + 36, { lineHeightFactor: 1.22 })
    }

    function drawIdeaMiniCard(idea: Idea, x: number, y: number, width: number, height: number, accent: readonly [number, number, number]) {
      const isPriority = idea.status === 'Priority'
      fill(isPriority ? accent : [255, 255, 255])
      doc.roundedRect(x, y, width, height, 4, 4, 'F')
      fill(accent)
      doc.roundedRect(x, y, 3.5, height, 2, 2, 'F')
      rgb(isPriority ? [255, 255, 255] : palette.navy)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10.5)
      doc.text(doc.splitTextToSize(idea.title, width - 10).slice(0, 2), x + 7, y + 7)
      rgb(isPriority ? [230, 247, 255] : palette.grey)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.text(
        doc.splitTextToSize(`${idea.status} | ${stageLabel(idea.stage)} | Score ${priorityScore(idea)}`, width - 10).slice(0, 1),
        x + 7,
        y + 16,
      )
      const source = ideaSourceContext(idea, groupMemberships, attendees)
      doc.text(
        doc.splitTextToSize(
          `${source.contributorName}: ${source.sourceTask || 'Not entered'}`,
          width - 10,
        ).slice(0, 1),
        x + 7,
        y + 22,
      )
    }

    function drawWorkshopGroupsPage(sectionNo: number) {
      if (groups.length === 0) {
        addSection('Workshop Groups', sectionNo)
        drawTextCard('No Workshop Groups yet', ['Create Workshop Groups and assign team members before the workshop.'], 14, 44, 268, 42, true)
        return
      }
      groups.forEach((group, groupIndex) => {
        const members = groupMemberships
          .filter((membership) => membership.groupId === group.id)
          .map((membership) => ({
            membership,
            attendee: attendees.find((attendee) => attendee.id === membership.attendeeId),
          }))
          .filter((entry): entry is { membership: WorkshopGroupMembership; attendee: Attendee } => Boolean(entry.attendee))
        addSection(`Workshop Group ${groupIndex + 1}: ${group.name}`, sectionNo)
        fill([255, 255, 255])
        doc.roundedRect(14, 42, 268, 148, 9, 9, 'F')
        fill(groupIndex % 2 === 0 ? palette.blue : palette.purple)
        doc.roundedRect(14, 42, 268, 28, 9, 9, 'F')
        rgb([255, 255, 255])
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(14)
        doc.text(group.name, 22, 54)
        doc.setFontSize(10)
        doc.text(`${members.length} members | ${group.department} | Champion: ${group.champion || 'Unassigned'}`, 22, 64)
        if (members.length === 0) {
          rgb(palette.grey)
          doc.setFontSize(11)
          doc.text('No team members assigned.', 22, 86)
        }
        members.forEach(({ attendee, membership }, memberIndex) => {
          const rowY = 82 + memberIndex * 15
          rgb(palette.navy)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(11)
          doc.text(attendee.name, 22, rowY)
          rgb(palette.grey)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9.5)
          doc.text(
            doc.splitTextToSize(
              `Task: ${membership.challenge.trim() || 'Not entered'} | Improves: ${membership.improvement?.trim() || 'Not entered'}`,
              246,
            ).slice(0, 2),
            22,
            rowY + 5,
            { lineHeightFactor: 1.2 },
          )
        })
      })
    }

    function drawIdeaCardsPage(titleValue: string, sourceIdeas: Idea[], sectionNo: number, includeFullDesign = false) {
      const groupedIdeas = groups
        .map((group) => ({
          group,
          ideas: sourceIdeas
            .filter((idea) => idea.groupId === group.id)
            .sort((a, b) => ideaStatusRank(a.status) - ideaStatusRank(b.status) || priorityScore(b) - priorityScore(a)),
        }))
        .filter((item) => item.ideas.length > 0)
      const groupAccentColours = [palette.blue, palette.green, palette.orange, palette.purple, palette.magenta, palette.cyan]
      if (groupedIdeas.length === 0) {
        addSection(titleValue, sectionNo)
        drawTextCard('No Top 5 ideas selected yet', ['Selected Top 5 ideas will appear here grouped by Workshop Group.'], 14, 44, 268, 42, true)
        return
      }
      groupedIdeas.forEach(({ group, ideas: groupIdeas }, groupIndex) => {
        const accent = groupAccentColours[groupIndex % groupAccentColours.length]
        const chunks = Array.from({ length: Math.ceil(groupIdeas.length / 4) }, (_, index) =>
          groupIdeas.slice(index * 4, index * 4 + 4),
        )
        chunks.forEach((ideaChunk, chunkIndex) => {
          addSection(`${titleValue}: ${group.name}${chunks.length > 1 ? ` (${chunkIndex + 1}/${chunks.length})` : ''}`, sectionNo)
          fill([255, 255, 255])
          doc.roundedRect(14, 42, 268, 146, 9, 9, 'F')
          fill(accent)
          doc.roundedRect(14, 42, 268, 26, 9, 9, 'F')
          rgb([255, 255, 255])
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(13)
          doc.text(`Workshop Group ${group.name}`, 22, 53)
          doc.setFontSize(9.5)
          doc.text(`${groupIdeas.length} ideas | ${group.department}`, 22, 62)
          ideaChunk.forEach((idea, ideaIndex) => {
            drawIdeaMiniCard(idea, 22, 76 + ideaIndex * 27, 252, 23, accent)
          })
        })
      })
      if (includeFullDesign) {
        sourceIdeas.forEach((idea) => {
          const source = ideaSourceContext(idea, groupMemberships, attendees)
          const group = groups.find((item) => item.id === idea.groupId)
          const groupIdeaNumber = ideas.filter((item) => item.groupId === idea.groupId).findIndex((item) => item.id === idea.id) + 1
          const pageTitle = `${group?.name ?? 'No Workshop Group'} — Idea ${groupIdeaNumber}: ${idea.title}`
          const accent = groupAccentColours[Math.max(0, groups.findIndex((item) => item.id === idea.groupId)) % groupAccentColours.length]
          const supportingContextFitsMainPage = Boolean(idea.supportingContext && idea.supportingContext.length <= 260)
          addSection(pageTitle, sectionNo)
          drawCanvasTile(
            'Source, current task & problem',
            [
              `Contributor: ${source.contributorName}`,
              `Source task / current pain: ${source.sourceTask || idea.pain || 'Not entered'}`,
              `Difficult, slow or inconsistent today: ${idea.difficulty || 'Not entered'}`,
            ],
            14, 39, 130, 70, accent,
          )
          drawCanvasTile(
            'AI idea, outcome & improvement',
            [
              `AI/Copilot idea: ${idea.opportunity || 'Not entered'}`,
              `Ideal outcome or improvement: ${idea.idealOutcome || 'Not entered'}`,
              `Ultimately improves: ${source.sourceImprovement || 'Not entered'}`,
            ],
            153, 39, 130, 70, accent,
          )
          drawCanvasTile(
            'Information, systems & users',
            [
              `Information/data needed and source: ${idea.informationNeeded || 'Not entered'}`,
              `Integration needed: ${idea.integrationNeed || 'Not entered'}`,
              `Apps, systems or data sources: ${idea.integrationSystems || 'Not entered'}`,
              `Users / beneficiaries / scope: ${idea.mainUsers || 'Not entered'} | ${idea.userScopes?.join(', ') || 'Not entered'}`,
            ],
            14, 115, 130, 74, accent,
          )
          drawCanvasTile(
            'Benefits, controls & Copilot stage',
            [
              `Expected benefit/time/value: ${idea.benefit || 'Not entered'}`,
              `Risks, controls, review or dependencies: ${idea.concerns || 'Not entered'}`,
              `Recommended stage: ${stageLabel(idea.stage)}`,
              ...(supportingContextFitsMainPage
                ? [`Supporting contributor context: ${idea.supportingContext}`]
                : []),
            ],
            153, 115, 130, 74, accent,
          )
          const advancedLines = [
            idea.idealInteraction ? `Ideal AI interaction: ${idea.idealInteraction}` : '',
            idea.aiOutput ? `AI output/action: ${idea.aiOutput}` : '',
            idea.usageFrequency || idea.usageContext
              ? `Usage: ${idea.usageFrequency || 'Not entered'}${idea.usageContext ? ` (${idea.usageContext})` : ''}`
              : '',
            idea.humanReview ? `Human review: ${idea.humanReview}` : '',
            idea.successCriteria ? `Success criteria: ${idea.successCriteria}` : '',
            idea.constraints ? `Constraints: ${idea.constraints}` : '',
          ].filter(Boolean)
          if ((idea.supportingContext && !supportingContextFitsMainPage) || advancedLines.length) {
            addSection(`${group?.name ?? 'No Workshop Group'} — Idea ${groupIdeaNumber} (continued)`, sectionNo)
            if (idea.supportingContext && !supportingContextFitsMainPage) {
              drawCanvasTile(
                'Supporting contributors & merged evidence',
                [idea.supportingContext],
                14, 42, 268, advancedLines.length ? 62 : 142, accent,
              )
            }
            if (advancedLines.length) {
              drawCanvasTile(
                'Optional advanced delivery detail',
                advancedLines,
                14, idea.supportingContext && !supportingContextFitsMainPage ? 112 : 42, 268,
                idea.supportingContext && !supportingContextFitsMainPage ? 72 : 142, accent,
              )
            }
          }
        })
      }
    }

    function drawProjectCardsPage(sectionNo: number) {
      if (!activeProjectTasks.length) {
        addSection('Top 5 projects', sectionNo)
        drawTextCard('No active Top 5 projects', ['Select workshop-wide Top 5 ideas in Prioritise to create projects automatically.'], 14, 44, 268, 42, true)
        return
      }

      activeProjectTasks.forEach((task, index) => {
        const idea = ideas.find((item) => item.id === task.ideaId)
        const source = idea ? ideaSourceContext(idea, groupMemberships, attendees) : undefined
        const group = groups.find((item) => item.id === idea?.groupId)
        addSection(`Top 5 project ${index + 1}: ${idea?.title ?? task.action}`, sectionNo)
        drawTextCard(
          idea?.title ?? task.action,
          [
            `Workshop Group: ${group?.name ?? 'No Workshop Group'} | Member: ${source?.contributorName ?? 'Legacy idea'}`,
            `Original task: ${source?.sourceTask || idea?.pain || 'Not entered'}`,
            `Ultimately improves: ${source?.sourceImprovement || 'Not entered'}`,
            `Copilot stage: ${stageLabel(idea?.stage ?? task.copilotStage)} | Status: ${idea?.status ?? 'Priority'}`,
            `Scores: impact ${idea?.impact ?? '-'} | ease ${idea?.ease ?? '-'} | risk ${idea?.risk ?? '-'} | readiness ${idea?.readiness ?? '-'}`,
          ],
          14,
          44,
          130,
          62,
          true,
        )
        drawTextCard(
          'Complete linked idea',
          [
            `Current pain: ${idea?.pain ?? 'Not entered'}`,
            `Difficult, slow or inconsistent today: ${idea?.difficulty || 'Not entered'}`,
            `Opportunity: ${idea?.opportunity ?? 'Not entered'}`,
            `Ideal outcome: ${idea?.idealOutcome || 'Not entered'}`,
            `Expected benefit: ${idea?.benefit ?? 'Not entered'}`,
            `Concerns / controls: ${idea?.concerns ?? 'Not entered'}`,
            ...(idea?.supportingContext ? [`Supporting contributors / merged evidence: ${idea.supportingContext}`] : []),
          ],
          153,
          44,
          130,
          62,
        )
        drawTextCard(
          'Project-specific plan',
          [
            `Action: ${task.action}`,
            `Owner: ${task.owner || 'Unassigned'} | Target timing: ${task.dueDate || 'Not entered'}`,
            `Success measure: ${task.measure || 'Not entered'}`,
          ],
          14,
          114,
          130,
          70,
        )
        drawTextCard(
          'Project Readiness / Agent Governance',
          [
            `Sensitive data access: ${task.sensitiveDataAccess ?? 'No'}`,
            ...(task.sensitiveDataAccess === 'Yes'
              ? [`Sensitive data detail: ${task.sensitiveDataDetails || 'Required detail not entered'}`]
              : []),
            `Data protection: ${task.dataProtection || 'Not entered'}`,
            `Build governance: ${task.buildGovernance || task.governance || 'Not entered'}`,
            `Adoption and benefits monitoring: ${task.adoptionMonitoring || 'Not entered'}`,
            `Demo / pilot lead time: ${task.leadTime || 'Not entered'}`,
          ],
          153,
          114,
          130,
          70,
          true,
        )
        if (idea) {
          addSection(`Top 5 project ${index + 1}: linked idea solution design`, sectionNo)
          drawTextCard(
            'AI experience & evidence',
            [
              `Ideal outcome: ${idea.idealOutcome || 'Not entered'}`,
              `Ideal interaction: ${idea.idealInteraction || 'Not entered'}`,
              `Information/data needed and source: ${idea.informationNeeded || 'Not entered'}`,
              `AI output or action: ${idea.aiOutput || 'Not entered'}`,
            ],
            14, 44, 130, 62, true,
          )
          drawTextCard(
            'Integration & users',
            [
              `Integration needed: ${idea.integrationNeed || 'Not entered'}`,
              `Apps, systems or data sources: ${idea.integrationSystems || 'Not entered'}`,
              `Who could use this: ${idea.userScopes?.join(', ') || 'Not entered'}`,
              `Main users / beneficiaries: ${idea.mainUsers || 'Not entered'}`,
            ],
            153, 44, 130, 62,
          )
          drawTextCard(
            'Usage, review & value',
            [
              `Usage: ${idea.usageFrequency || 'Not entered'}${idea.usageContext ? ` | ${idea.usageContext}` : ''}`,
              `Human review: ${idea.humanReview || 'Not entered'}`,
              `Expected benefit: ${idea.benefit || 'Not entered'}`,
              `Success criteria: ${idea.successCriteria || 'Not entered'}`,
            ],
            14, 114, 130, 70,
          )
          drawTextCard(
            'Delivery constraints & controls',
            [
              `Constraints / dependencies: ${idea.constraints || 'Not entered'}`,
              `Concerns / controls: ${idea.concerns || 'Not entered'}`,
              ...(idea.supportingContext ? [`Supporting contributors / merged evidence: ${idea.supportingContext}`] : []),
              `Source remains linked to the Ideas section and updates automatically.`,
            ],
            153, 114, 130, 70, true,
          )
        }
      })
    }

    function drawManagedServicePage(sectionNo: number) {
      addSection('Managed service roadmap', sectionNo)
      managedServiceQuarters.forEach((quarter, index) => {
        const x = 14 + (index % 2) * 137
        const y = 44 + Math.floor(index / 2) * 68
        drawTextCard(
          `${quarter.name}: ${quarter.theme}`,
          [
            quarter.dayFormat,
            quarter.focus,
            `Projects mapped: ${activeProjectTasks.length}`,
            ...activeProjectTasks.slice(0, priorityIdeaLimit).map((task) => {
              const idea = ideas.find((item) => item.id === task.ideaId)
              return `${idea?.title ?? task.action}: ${managedQuarterProjectAction(task, quarter.id).title}`
            }),
            activeProjectTasks.length > 3 ? `+ ${activeProjectTasks.length - 3} more project recommendations in this quarter` : '',
          ],
          x,
          y,
          130,
          58,
          index === 1,
        )
      })
      drawTextCard(
        'Recommended next step',
        ['Continue from the workshop baseline into a quarterly adoption service: one focused onsite day per quarter, scorecard tracking and a light monthly steering check-in.'],
        14,
        184,
        268,
        24,
        true,
      )
    }

    function drawManagedServiceScorecard(sectionNo: number) {
      addSection('Managed service scorecard', sectionNo)
      drawKpi('Project roadmap', String(activeProjectTasks.length), 14, 44, palette.blue)
      drawKpi('Quarterly days', String(managedServiceQuarters.length), 70, 44, palette.green)
      drawKpi('Adoption score', String(adoptionScoreTotals.current), 126, 44, palette.purple)
      drawKpi('Improvement', `${adoptionScoreTotals.totalImprovement >= 0 ? '+' : ''}${adoptionScoreTotals.totalImprovement}`, 182, 44, palette.magenta)
      drawKpi('Gap to target', String(adoptionScoreTotals.gapToTarget), 238, 44, palette.orange)
      drawDonut('Projects by Copilot strand', stages.map((stage, index) => ({
        label: stage,
        value: topFiveIdeas.filter((idea) => idea.stage === stage).length,
        color: ['#0b5cad', '#0f8a5f', '#f28c28', '#7c3aed', '#ff2aa0'][index],
      })), 14, 90)
      drawBars('Adoption Score movement', adoptionScoreTracking.map((score) => ({ label: score.pillar, value: Math.max(0, score.current - score.baseline) })), 154, 90)
      drawTextCard(
        'Quarterly service rhythm',
        [
          'Every quarter combines a first-half adoption review, staff feedback, tips/tricks and scorecard movement with a second-half development lab.',
          'Projects from the workshop are pulled into the 12-month roadmap so the managed service becomes a practical delivery and improvement tool.',
          'New market opportunities can be considered each quarter and added to future roadmap activity only when the client sees value.',
        ],
        14,
        164,
        268,
        34,
        true,
      )
    }

    function drawManagedQuarterDetailPages(startSectionNo: number) {
      managedServiceQuarters.forEach((quarter, quarterIndex) => {
        addSection(`${quarter.name}: ${quarter.theme}`, startSectionNo + quarterIndex)
        drawTextCard(
          quarter.dayFormat,
          [
            quarter.focus,
            `Outcomes: ${quarter.outcomes.join(' | ')}`,
            `Deliverables: ${quarter.deliverables.join(' | ')}`,
          ],
          14,
          42,
          268,
          34,
          quarterIndex === 0,
        )
        activeProjectTasks.slice(0, 6).forEach((task, index) => {
          const group = groups.find((item) => item.id === task.groupId)
          const idea = ideas.find((item) => item.id === task.ideaId)
          const quarterAction = managedQuarterProjectAction(task, quarter.id)
          const x = 12 + (index % 3) * 91
          const y = 86 + Math.floor(index / 3) * 58
          drawTextCard(
            idea?.title ?? task.action,
            [
              `${group?.department ?? 'No group'} | ${stageLabel(task.copilotStage)}`,
              quarterAction.title,
              quarterAction.detail,
              `Evidence: ${quarterAction.evidence}`,
            ],
            x,
            y,
            85,
            52,
            index === 0,
          )
        })
        if (activeProjectTasks.length > 6) {
          drawTextCard(
            'Additional project recommendations',
            [`${activeProjectTasks.length - 6} more projects are held in the live roadmap and can be reviewed during this quarter.`],
            14,
            190,
            268,
            16,
          )
        }
      })
    }

    function drawOverallConfidencePage(sectionNo: number) {
      const pages = Math.ceil(attendees.length / 10)
      Array.from({ length: pages }, (_, pageIndex) => {
        addSection(`Overall Copilot confidence${pages > 1 ? ` (${pageIndex + 1}/${pages})` : ''}`, sectionNo)
        rgb(palette.grey)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(11)
        doc.text('One overall score per attendee. Scale: 1 Not confident to 5 Very confident, with 0.5 increments.', 14, 42)
        fill(palette.navy)
        doc.roundedRect(14, 49, 269, 13, 3, 3, 'F')
        rgb([255, 255, 255])
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.text('Attendee', 19, 58)
        doc.text('Before', 166, 58)
        doc.text('After', 207, 58)
        doc.text('Change', 249, 58)
        attendees.slice(pageIndex * 10, pageIndex * 10 + 10).forEach((attendee, rowIndex) => {
          const y = 66 + rowIndex * 12
          const entry = overallConfidence.find((item) => item.attendeeId === attendee.id)
          const movement = entry?.before && entry.after ? entry.after - entry.before : null
          fill(rowIndex % 2 === 0 ? [255, 255, 255] : palette.pale)
          doc.roundedRect(14, y, 269, 10, 2, 2, 'F')
          rgb(palette.navy)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10.5)
          doc.text(attendee.name, 19, y + 7)
          doc.setFont('helvetica', 'normal')
          doc.text(entry?.before ? formatConfidenceScore(entry.before) : '—', 169, y + 7)
          doc.text(entry?.after ? formatConfidenceScore(entry.after) : '—', 210, y + 7)
          doc.text(movement === null ? '—' : `${movement >= 0 ? '+' : ''}${formatConfidenceScore(movement)}`, 252, y + 7)
        })
      })
    }

    function drawAdoptionScorePage(sectionNo: number) {
      addSection('Adoption Score measurement', sectionNo)
      drawTextCard(
        'Quarterly score movement',
        [
          `Baseline total: ${adoptionScoreTotals.baseline} | Previous revisit: ${adoptionScoreTotals.previous} | Current: ${adoptionScoreTotals.current} | Target: ${adoptionScoreTotals.target}`,
          `Improvement from baseline: ${adoptionScoreTotals.totalImprovement >= 0 ? '+' : ''}${adoptionScoreTotals.totalImprovement} | This revisit: ${adoptionScoreTotals.quarterMovement >= 0 ? '+' : ''}${adoptionScoreTotals.quarterMovement} | Gap to target: ${adoptionScoreTotals.gapToTarget}`,
        ],
        14,
        42,
        268,
        30,
        true,
      )
      adoptionScoreTracking.slice(0, 6).forEach((score, index) => {
        const pillar = adoptionScorePillars.find((item) => item.name === score.pillar)
        const x = 12 + (index % 3) * 91
        const y = 82 + Math.floor(index / 3) * 54
        drawTextCard(
          score.pillar,
          [
            `Baseline ${score.baseline} | Previous ${score.previous} | Current ${score.current} | Target ${score.target}`,
            `Improvement: ${score.current - score.baseline >= 0 ? '+' : ''}${score.current - score.baseline} from baseline | ${score.current - score.previous >= 0 ? '+' : ''}${score.current - score.previous} this revisit`,
            score.notes,
            `Signals: ${pillar?.examples.join(' | ') ?? ''}`,
          ],
          x,
          y,
          85,
          48,
          score.pillar === 'AI adoption',
        )
      })
      const governance = adoptionScoreTracking.find((pillar) => pillar.pillar === 'Governance overlay')
      if (governance) {
        drawTextCard(
          governance.pillar,
          [`Current ${governance.current} against target ${governance.target}`, `Improvement: ${governance.current - governance.baseline >= 0 ? '+' : ''}${governance.current - governance.baseline}`, governance.notes],
          14,
          184,
          268,
          24,
          true,
        )
      }
    }

    function hexToRgb(hex: string): [number, number, number] {
      const clean = hex.replace('#', '')
      return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)]
    }

    function departmentAlignmentLines(department: Department) {
      const members = attendees.filter(
        (attendee) => attendee.team.trim().toLocaleLowerCase() === department.name.trim().toLocaleLowerCase(),
      )
      return [
        `Lead: ${department.lead || 'Unassigned'}`,
        `Champion: ${department.champion || 'Unassigned'}`,
        `People: ${department.headcount}`,
        `Team members: ${members.map((member) => member.name).join(', ') || 'None assigned'}`,
        `Focus: ${department.focus || 'Not added'}`,
        `Department objective: ${department.businessObjective || 'Not added'}`,
      ]
    }

    addCover()

    if (reportType === 'managed') {
      drawManagedServiceScorecard(1)
      drawManagedServicePage(2)
      drawManagedQuarterDetailPages(3)
      drawAdoptionScorePage(7)
    } else {
      addSection('Workshop summary', 1)
      drawSummaryCard(
        'Confidence before',
        `${formatConfidenceScore(confidenceSummary.beforeTotal)} / ${confidenceSummary.maximumTotal}`,
        [
          'Scoring: one overall 1-5 score per attendee.',
          `Maximum: ${attendees.length} attendees x 5 points.`,
          `Completion: ${confidenceSummary.beforeCompletedAttendees} of ${attendees.length} attendees.`,
          `Average entered score: ${confidenceSummary.beforeAverage ? confidenceSummary.beforeAverage.toFixed(1) : 'Not available'}.`,
        ],
        14, 43, 130, 68,
      )
      drawSummaryCard(
        'Confidence after',
        `${formatConfidenceScore(confidenceSummary.afterTotal)} / ${confidenceSummary.maximumTotal}`,
        [
          'Scoring: one overall 1-5 score per attendee.',
          `Maximum: ${attendees.length} attendees x 5 points.`,
          `Completion: ${confidenceSummary.afterCompletedAttendees} of ${attendees.length} attendees.`,
          `Average entered score: ${confidenceSummary.afterAverage ? confidenceSummary.afterAverage.toFixed(1) : 'Not available'}.`,
          confidenceSummary.enteredRatings
            ? `Matched movement: ${confidenceSummary.matchedMovement >= 0 ? '+' : ''}${formatConfidenceScore(confidenceSummary.matchedMovement)} points across ${confidenceSummary.enteredRatings} attendees.`
            : 'Matched movement: not available.',
        ],
        153, 43, 130, 68, true,
      )
      drawSummaryCard(
        'Idea pipeline',
        `${focusedIdeaPipeline.total} ideas`,
        [
          `Idea only: ${focusedIdeaPipeline.ideaOnly}`,
          `Shortlisted: ${focusedIdeaPipeline.shortlisted}`,
          `Top 5 / Projects: ${focusedIdeaPipeline.topFive}`,
          'The workshop-wide Top 5 automatically move into Projects.',
        ],
        14, 116, 130, 72,
      )
      drawSummaryCard(
        'Ideas taken through to Projects',
        `${topFiveIdeas.length} / ${priorityIdeaLimit} active`,
        Array.from({ length: priorityIdeaLimit }, (_, slot) =>
          `${slot + 1}. ${topFiveIdeas[slot]?.title ?? 'Top 5 slot not selected'}`,
        ),
        153, 116, 130, 72, true,
      )

      addSection('Business and department context', 2)
      drawTextCard('Company goal', [ultimateObjective?.title ?? 'Company goal'], 14, 44, 268, 34, true)
      departments.slice(0, 6).forEach((department, index) => {
        if (index > 0 && index % 2 === 0) addSection(`Business and department context (${Math.floor(index / 2) + 1})`, 2)
        drawTextCard(
          department.name,
          departmentAlignmentLines(department),
          14,
          index % 2 === 0 ? 84 : 148,
          268,
          58,
          index % 2 === 0,
        )
      })
    }

    if (reportType === 'full') {
      drawOverallConfidencePage(3)
      drawWorkshopGroupsPage(4)
      drawIdeaCardsPage('Ideas by Workshop Group and member task', ideas, 5, true)
      drawIdeaCardsPage(
        'Shortlisted ideas',
        [...ideas]
          .filter((idea) => idea.status === 'Shortlisted' || idea.status === 'Priority' || idea.isTopIdea)
          .sort((a, b) => priorityScore(b) - priorityScore(a)),
        6,
      )
      drawIdeaCardsPage('Workshop-wide top 5', topFiveIdeas.sort((a, b) => priorityScore(b) - priorityScore(a)), 7)
      drawProjectCardsPage(8)
      drawManagedServicePage(9)
      drawAdoptionScorePage(10)
    } else if (reportType === 'projects') {
      drawProjectCardsPage(3)
    }

    doc.save(fileName)
  }

  function renderRows(values: Array<Array<string | number>>) {
    return values
      .map((row) => `<tr>${row.map((value) => `<td>${escapeReport(value)}</td>`).join('')}</tr>`)
      .join('')
  }

  function donutChart(title: string, items: Array<{ label: string; value: number; color: string }>) {
    const total = items.reduce((sum, item) => sum + item.value, 0)
    const radius = 46
    const circumference = 2 * Math.PI * radius
    let offset = 0
    const slices = total
      ? items
          .map((item) => {
            const length = (item.value / total) * circumference
            const slice = `<circle cx="60" cy="60" r="${radius}" fill="none" stroke="${item.color}" stroke-width="18" stroke-dasharray="${length} ${circumference - length}" stroke-dashoffset="${-offset}" transform="rotate(-90 60 60)" />`
            offset += length
            return slice
          })
          .join('')
      : `<circle cx="60" cy="60" r="${radius}" fill="none" stroke="#e5e7eb" stroke-width="18" />`

    return `<div class="chart-card">
      <h3>${escapeReport(title)}</h3>
      <div class="chart-wrap">
        <svg class="donut-svg" viewBox="0 0 120 120" role="img" aria-label="${escapeReport(title)}">
          <circle cx="60" cy="60" r="${radius}" fill="none" stroke="#eaf1f8" stroke-width="18" />
          ${slices}
          <circle cx="60" cy="60" r="31" fill="white" />
          <text x="60" y="58" text-anchor="middle" class="donut-total">${total}</text>
          <text x="60" y="72" text-anchor="middle" class="donut-label">Total</text>
        </svg>
        <div class="legend">
          ${items
            .map(
              (item) =>
                `<span><i class="swatch" style="background:${item.color}"></i>${escapeReport(item.label)}: ${item.value}${total ? ` (${Math.round((item.value / total) * 100)}%)` : ''}</span>`,
            )
            .join('')}
        </div>
      </div>
    </div>`
  }

  function barChart(title: string, rows: Array<{ label: string; value: number }>) {
    const max = Math.max(1, ...rows.map((row) => row.value))
    return `<div class="chart-card">
      <h3>${escapeReport(title)}</h3>
      ${rows
        .map(
          (row) =>
            `<div class="bar-row"><span>${escapeReport(row.label)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.max(4, Math.round((row.value / max) * 100))}%"></div></div><b>${row.value}</b></div>`,
        )
        .join('')}
    </div>`
  }

  function priorityMatrixChart() {
    const priority = topFiveIdeas.length
    const shortlisted = ideas.filter((idea) => idea.status === 'Shortlisted').length
    const ideaOnly = ideas.filter((idea) => idea.status === 'Idea only').length
    const notSelected = ideas.filter((idea) => idea.status === 'Not selected').length
    return `<div class="chart-card">
      <h3>Prioritisation matrix</h3>
      <div class="matrix-chart">
        <div class="quadrant"><b>${priority}</b><span>Top 5<br/>May move toward production</span></div>
        <div class="quadrant"><b>${shortlisted}</b><span>Shortlisted<br/>Strong candidates</span></div>
        <div class="quadrant"><b>${ideaOnly}</b><span>Idea only<br/>Keep exploring</span></div>
        <div class="quadrant"><b>${notSelected}</b><span>Not selected<br/>Parked for now</span></div>
      </div>
    </div>`
  }

  function cardClassForStatus(status: IdeaStatus) {
    if (status === 'Priority') return 'priority'
    if (status === 'Shortlisted') return 'shortlisted'
    if (status === 'Idea only') return 'idea-only'
    return ''
  }

  function ideaReportCards(items = ideas) {
    return `<div class="report-card-grid">
      ${items
        .map((idea) => {
          const group = groups.find((item) => item.id === idea.groupId)
          const source = ideaSourceContext(idea, groupMemberships, attendees)
          const groupIdeaNumber = ideas.filter((item) => item.groupId === idea.groupId).findIndex((item) => item.id === idea.id) + 1
          return `<article class="report-card ${cardClassForStatus(idea.status)}">
            <h3>${escapeReport(group?.name ?? 'No Workshop Group')} — Idea ${groupIdeaNumber}: ${escapeReport(idea.title)}</h3>
            <p>${escapeReport(idea.opportunity)}</p>
            <div class="meta">
              <span>${escapeReport(idea.isTopIdea ? 'Top 5' : idea.status)}</span>
              <span>${escapeReport(group?.name ?? 'No Workshop Group')}</span>
              <span>${escapeReport(idea.stage)}</span>
              <span>Score ${priorityScore(idea)}</span>
            </div>
            <p><strong>Member:</strong> ${escapeReport(source.contributorName)}</p>
            <p><strong>AI-help task:</strong> ${escapeReport(source.sourceTask || 'Not entered')}</p>
            <p><strong>Ultimately improves:</strong> ${escapeReport(source.sourceImprovement || 'Not entered')}</p>
            <p><strong>Current task or process / pain:</strong> ${escapeReport(idea.pain || 'Not entered')}</p>
            <p><strong>Difficult, slow or inconsistent today:</strong> ${escapeReport(idea.difficulty || 'Not entered')}</p>
            <p><strong>AI/Copilot idea:</strong> ${escapeReport(idea.opportunity || 'Not entered')}</p>
            <p><strong>Ideal outcome or improvement:</strong> ${escapeReport(idea.idealOutcome || 'Not entered')}</p>
            <p><strong>Information/data needed and source:</strong> ${escapeReport(idea.informationNeeded || 'Not entered')}</p>
            <p><strong>Apps/systems or integration:</strong> ${escapeReport(idea.integrationNeed || 'Not entered')} · ${escapeReport(idea.integrationSystems || 'Not entered')}</p>
            <p><strong>Users / beneficiaries / scope:</strong> ${escapeReport(idea.userScopes?.join(', ') || 'Not entered')} · ${escapeReport(idea.mainUsers || 'Not entered')}</p>
            <p><strong>Expected benefit or time/value gain:</strong> ${escapeReport(idea.benefit || 'Not entered')}</p>
            <p><strong>Risks, controls, human review or dependencies:</strong> ${escapeReport(idea.concerns || 'Not entered')}</p>
            ${idea.supportingContext ? `<p><strong>Supporting contributors / merged evidence:</strong> ${escapeReport(idea.supportingContext)}</p>` : ''}
            <p><strong>Recommended Copilot stage:</strong> ${escapeReport(stageLabel(idea.stage))}</p>
            <p><strong>Optional advanced:</strong> Ideal AI interaction — ${escapeReport(idea.idealInteraction || 'Not entered')} · Output/action — ${escapeReport(idea.aiOutput || 'Not entered')} · Usage — ${escapeReport(idea.usageFrequency || 'Not entered')}${idea.usageContext ? ` (${escapeReport(idea.usageContext)})` : ''} · Human review — ${escapeReport(idea.humanReview || 'Not entered')} · Success — ${escapeReport(idea.successCriteria || 'Not entered')} · Constraints — ${escapeReport(idea.constraints || 'Not entered')}</p>
          </article>`
        })
        .join('')}
    </div>`
  }

  function priorityReportCards() {
    const ordered = [...ideas]
      .filter((idea) => idea.status === 'Shortlisted' || idea.status === 'Priority' || idea.isTopIdea)
      .sort((a, b) => Number(Boolean(b.isTopIdea)) - Number(Boolean(a.isTopIdea)) || priorityScore(b) - priorityScore(a))
    return ideaReportCards(ordered)
  }

  function projectReportCards() {
    return `<div class="report-card-grid">
      ${activeProjectTasks
        .map((task) => {
          const group = groups.find((item) => item.id === task.groupId)
          const idea = ideas.find((item) => item.id === task.ideaId)
          const source = idea ? ideaSourceContext(idea, groupMemberships, attendees) : undefined
          return `<article class="report-card feature">
            <h3>${escapeReport(task.action)}</h3>
            <p>${escapeReport(task.measure)}</p>
            <div class="meta">
              <span>${escapeReport(stageLabel(idea?.stage ?? task.copilotStage))}</span>
              <span>${escapeReport(task.owner)}</span>
              <span>Suggested timing: ${escapeReport(task.dueDate)}</span>
              <span>${escapeReport(group?.name ?? 'No Workshop Group')}</span>
            </div>
            <p><strong>Related idea:</strong> ${escapeReport(idea?.title ?? 'Unlinked')}</p>
            <p><strong>Workshop Group:</strong> ${escapeReport(group?.name ?? 'No Workshop Group')}</p>
            <p><strong>Person / member:</strong> ${escapeReport(source?.contributorName ?? 'Legacy idea')}</p>
            <p><strong>Member AI-help task:</strong> ${escapeReport(source?.sourceTask || idea?.pain || 'Legacy project task')}</p>
            <p><strong>Ultimately improves:</strong> ${escapeReport(source?.sourceImprovement || 'Not entered')}</p>
            <p><strong>Current pain:</strong> ${escapeReport(idea?.pain ?? 'Not entered')}</p>
            <p><strong>Difficult, slow or inconsistent today:</strong> ${escapeReport(idea?.difficulty || 'Not entered')}</p>
            <p><strong>Copilot opportunity:</strong> ${escapeReport(idea?.opportunity ?? 'Not entered')}</p>
            <p><strong>Ideal outcome or improvement:</strong> ${escapeReport(idea?.idealOutcome || 'Not entered')}</p>
            <p><strong>Ideal AI interaction:</strong> ${escapeReport(idea?.idealInteraction || 'Not entered')}</p>
            <p><strong>Integration:</strong> ${escapeReport(idea?.integrationNeed || 'Not entered')} · <strong>Apps, systems or data sources:</strong> ${escapeReport(idea?.integrationSystems || 'Not entered')}</p>
            <p><strong>Who could use this:</strong> ${escapeReport(idea?.userScopes?.join(', ') || 'Not entered')} · <strong>Main users:</strong> ${escapeReport(idea?.mainUsers || 'Not entered')}</p>
            <p><strong>Information or data needed:</strong> ${escapeReport(idea?.informationNeeded || 'Not entered')}</p>
            <p><strong>AI output or action:</strong> ${escapeReport(idea?.aiOutput || 'Not entered')}</p>
            <p><strong>Usage:</strong> ${escapeReport(idea?.usageFrequency || 'Not entered')}${idea?.usageContext ? ` · ${escapeReport(idea.usageContext)}` : ''}</p>
            <p><strong>Human review:</strong> ${escapeReport(idea?.humanReview || 'Not entered')}</p>
            <p><strong>Expected benefit:</strong> ${escapeReport(idea?.benefit ?? 'Not entered')}</p>
            <p><strong>Success criteria:</strong> ${escapeReport(idea?.successCriteria || 'Not entered')}</p>
            <p><strong>Constraints / dependencies:</strong> ${escapeReport(idea?.constraints || 'Not entered')}</p>
            <p><strong>Concerns / controls:</strong> ${escapeReport(idea?.concerns ?? 'Not entered')}</p>
            ${idea?.supportingContext ? `<p><strong>Supporting contributors / merged evidence:</strong> ${escapeReport(idea.supportingContext)}</p>` : ''}
            <p><strong>Idea scores:</strong> Impact ${idea?.impact ?? '-'} · Ease ${idea?.ease ?? '-'} · Risk ${idea?.risk ?? '-'} · Readiness ${idea?.readiness ?? '-'}</p>
            <p><strong>Sensitive data access:</strong> ${escapeReport(task.sensitiveDataAccess ?? 'No')}</p>
            ${task.sensitiveDataAccess === 'Yes' ? `<p><strong>Sensitive data detail:</strong> ${escapeReport(task.sensitiveDataDetails || 'Required detail not entered')}</p>` : ''}
            <p><strong>Data protection:</strong> ${escapeReport(task.dataProtection || 'Not entered')}</p>
            <p><strong>Build governance:</strong> ${escapeReport(task.buildGovernance || task.governance || 'Not entered')}</p>
            <p><strong>Adoption and benefits monitoring:</strong> ${escapeReport(task.adoptionMonitoring || 'Not entered')}</p>
            <p><strong>Demo / pilot lead time:</strong> ${escapeReport(task.leadTime || 'Not entered')}</p>
          </article>`
        })
        .join('')}
    </div>`
  }

  function fullReportHtml() {
    const executiveHeadline = ultimateObjective?.title.trim()
      ? `${escapeReport(clientDisplayName)} has aligned Copilot adoption to the company goal: <strong>${escapeReport(ultimateObjective.title)}</strong>.`
      : 'No company goal has been entered yet.'
    const overallConfidenceHtml = `
      <h2>Overall Copilot confidence before and after</h2>
      <p>One overall score per attendee on a 1–5 scale, with 0.5 increments. Maximum possible total: ${confidenceSummary.maximumTotal}.</p>
      <table>
        <thead><tr><th>Attendee</th><th>Before</th><th>After</th><th>Change</th></tr></thead>
        <tbody>
          ${attendees.map((attendee) => {
            const entry = overallConfidence.find((item) => item.attendeeId === attendee.id)
            const movement = entry?.before && entry.after ? entry.after - entry.before : null
            return `<tr><td>${escapeReport(attendee.name)}</td><td>${entry?.before ? formatConfidenceScore(entry.before) : '—'}</td><td>${entry?.after ? formatConfidenceScore(entry.after) : '—'}</td><td>${movement === null ? '—' : `${movement >= 0 ? '+' : ''}${formatConfidenceScore(movement)}`}</td></tr>`
          }).join('')}
        </tbody>
      </table>`
    const body = `
      <h2>Executive headline</h2>
      <div class="hero-card-report">
        <h3 style="color:white">Microsoft Copilot adoption opportunity</h3>
        <p>${executiveHeadline} The report below reflects only the workshop information entered in this browser.</p>
      </div>
      <div class="kpis">
        <div class="kpi"><b>${stats.attendees}</b><span>Attendees</span></div>
        <div class="kpi"><b>${stats.departments}</b><span>Departments</span></div>
        <div class="kpi"><b>${stats.ideas}</b><span>Ideas</span></div>
        <div class="kpi"><b>${topFiveIdeas.length}</b><span>Top 5 ideas</span></div>
        <div class="kpi"><b>${confidenceSummary.completedAttendees}/${attendees.length}</b><span>Confidence complete</span></div>
      </div>
      <div class="chart-grid">
        ${donutChart('Idea pipeline split', [
          { label: 'Priority', value: ideaStatusCounts.priority, color: '#0f8a5f' },
          { label: 'Shortlisted', value: ideaStatusCounts.shortlisted, color: '#0b5cad' },
          { label: 'Idea only', value: ideaStatusCounts.ideaOnly, color: '#f28c28' },
          { label: 'Not selected', value: ideaStatusCounts.notSelected, color: '#94a3b8' },
        ])}
        ${barChart('Overall confidence totals', [
          { label: 'Before', value: confidenceSummary.beforeTotal },
          { label: 'After', value: confidenceSummary.afterTotal },
        ])}
        ${barChart(
          'Department workshop coverage',
          departments.map((department) => ({ label: department.name, value: department.headcount })),
        )}
        ${priorityMatrixChart()}
      </div>

      ${overallConfidenceHtml}

      <h2>Visual executive scorecard</h2>
      <div class="chart-grid">
        ${donutChart(
          'Idea alignment by Workshop Group',
          groups.map((group, index) => ({
            label: group.name || `Workshop Group ${index + 1}`,
            value: ideas.filter((idea) => idea.groupId === group.id).length,
            color: ['#0b5cad', '#00d4ff', '#7c3aed', '#ff2aa0', '#f28c28', '#0f8a5f'][index % 6],
          })),
        )}
        ${barChart(
          'Priority strength by idea',
          [...ideas]
            .sort((a, b) => priorityScore(b) - priorityScore(a))
            .slice(0, 6)
            .map((idea) => ({ label: idea.title, value: priorityScore(idea) })),
        )}
        ${donutChart(
          'Project recommendations by Copilot strand',
          stages.map((stage, index) => ({
            label: stage,
            value: topFiveIdeas.filter((idea) => idea.stage === stage).length,
            color: ['#0b5cad', '#0f8a5f', '#f28c28', '#7c3aed', '#ff2aa0'][index],
          })),
        )}
        ${barChart('Workshop Group member challenges', groups.map((group) => ({
          label: group.name,
          value: groupMemberships.filter((membership) => membership.groupId === group.id && membership.challenge.trim()).length,
        })))}
      </div>

      <h2>Full workshop stage coverage</h2>
      <table><thead><tr><th>App stage</th><th>Report coverage</th></tr></thead><tbody>${renderRows([
        ['Agenda', 'Full day structure from 10:00 to 16:00, including the 12:30-13:30 lunch break and all workshop outputs.'],
        ['Business Goals', 'Current company goal and department context, including leads, champions, people, team members and focus.'],
        ['What is this workshop?', 'Microsoft Copilot adoption purpose, journey, outcomes and stages for growth.'],
        ['Adoption Pulse', 'One overall before/after Copilot confidence score per attendee on a 1–5 scale with 0.5 increments.'],
        ['Dashboard', 'Executive headline, performance indicators, pipeline status, adoption signal and commercial focus.'],
        ['Workshop Groups', 'Workshop Group structure, assigned members and each member’s one AI-help task or challenge.'],
        ['Ideas', 'Ideas organised by Workshop Group, member and member task, including opportunity, benefit and controls.'],
        ['Prioritise', 'Workshop Group shortlists, workshop-wide top 5, and detailed impact, ease, risk and readiness scoring.'],
        ['Projects', 'Top-five project recommendations, suggested owners, measures, governance notes and related member tasks.'],
        ['Managed Service', 'Quarterly adoption rhythm, Microsoft Adoption Score movement, year-one roadmap and ongoing service options.'],
        ['Export', 'Downloadable PDF reports and plain-text working summary for follow-up.'],
      ])}</tbody></table>

      <h2>Overall confidence movement</h2>
      <div class="stage"><strong>Before:</strong> ${formatConfidenceScore(confidenceSummary.beforeTotal)} / ${confidenceSummary.maximumTotal} · ${confidenceSummary.beforeCompletedAttendees} attendees entered · average ${confidenceSummary.beforeAverage.toFixed(1)}</div>
      <div class="stage"><strong>After:</strong> ${formatConfidenceScore(confidenceSummary.afterTotal)} / ${confidenceSummary.maximumTotal} · ${confidenceSummary.afterCompletedAttendees} attendees entered · average ${confidenceSummary.afterAverage.toFixed(1)}</div>
      <div class="stage"><strong>Matched movement:</strong> ${confidenceSummary.matchedMovement >= 0 ? '+' : ''}${formatConfidenceScore(confidenceSummary.matchedMovement)} across ${confidenceSummary.completedAttendees} attendees</div>

      <h2>Agenda and delivery stages</h2>
      <table><thead><tr><th>Time</th><th>Stage</th><th>Purpose</th><th>Output</th></tr></thead><tbody>${renderRows(
        agenda.map((item) => [item.time, item.title, item.purpose, item.output]),
      )}</tbody></table>

      <h2>Current business and department context</h2>
      <div class="grid">
        <div class="card"><h3>Company goal</h3><p>${escapeReport(ultimateObjective?.title)}</p><p class="small">Department leads, champions, people, team members, focus and one aligned business objective are captured below.</p></div>
        <div class="card"><h3>Prioritisation status</h3><p>Top 5: ${topFiveIdeas.length}<br/>Shortlisted: ${focusedIdeaPipeline.shortlisted}<br/>Idea only: ${focusedIdeaPipeline.ideaOnly}<br/>Not selected: ${ideaStatusCounts.notSelected}</p></div>
      </div>

      <h2>Department growth map</h2>
      <table><thead><tr><th>Department</th><th>Lead</th><th>Champion</th><th>People</th><th>Focus</th><th>Department Business Objective</th></tr></thead><tbody>${renderRows(
        departments.map((department) => [
          department.name,
          department.lead,
          department.champion,
          department.headcount,
          department.focus,
          department.businessObjective || 'Not entered',
        ]),
      )}</tbody></table>

      <h2>Workshop Groups and member tasks</h2>
      <table><thead><tr><th>Workshop Group</th><th>Department</th><th>Champion</th><th>Member</th><th>AI-help task</th><th>Ultimately improves</th></tr></thead><tbody>${renderRows(
        groups.flatMap((group) => {
          const members = groupMemberships
            .filter((membership) => membership.groupId === group.id)
            .map((membership) => ({
              membership,
              attendee: attendees.find((attendee) => attendee.id === membership.attendeeId),
            }))
            .filter((entry): entry is { membership: WorkshopGroupMembership; attendee: Attendee } => Boolean(entry.attendee))
          return members.length
            ? members.map(({ attendee, membership }) => [
                group.name,
                group.department,
                group.champion,
                attendee.name,
                membership.challenge || 'No task entered',
                membership.improvement || 'No intended improvement entered',
              ])
            : [[group.name, group.department, group.champion, 'No members assigned', '', '']]
        }),
      )}</tbody></table>

      <h2>Ideas by Workshop Group and member task</h2>
      ${ideaReportCards()}

      <h2>Shortlisted ideas and workshop-wide top 5</h2>
      ${priorityReportCards()}

      <h2>Workshop Group summary</h2>
      <table><thead><tr><th>Workshop Group</th><th>Department</th><th>Champion</th><th>Members</th></tr></thead><tbody>${renderRows(
        groups.map((group) => [
          group.name,
          group.department,
          group.champion,
          groupMemberships
            .filter((membership) => membership.groupId === group.id)
            .map((membership) => attendees.find((attendee) => attendee.id === membership.attendeeId)?.name)
            .filter(Boolean)
            .join(' | '),
        ]),
      )}</tbody></table>

      <h2>Projects</h2>
      ${projectReportCards()}

      <h2>Managed service roadmap</h2>
      <div class="grid">
        ${managedServiceQuarters
          .map(
            (quarter) => `<div class="card">
              <h3>${escapeReport(quarter.name)} · ${escapeReport(quarter.theme)}</h3>
              <p><strong>${escapeReport(quarter.dayFormat)}</strong></p>
              <p>${escapeReport(quarter.focus)}</p>
              <p class="small"><strong>Deliverables:</strong> ${escapeReport(quarter.deliverables.join(' | '))}</p>
              <p class="small"><strong>Projects mapped into this quarter:</strong></p>
              ${activeProjectTasks
                .map((task) => {
                  const group = groups.find((item) => item.id === task.groupId)
                  const idea = ideas.find((item) => item.id === task.ideaId)
                  const quarterAction = managedQuarterProjectAction(task, quarter.id)
                  return `<p class="small"><strong>${escapeReport(idea?.title ?? task.action)}</strong> · ${escapeReport(group?.department ?? 'No group')} · ${escapeReport(quarterAction.title)}<br/>${escapeReport(quarterAction.detail)}</p>`
                })
                .join('')}
            </div>`,
          )
          .join('')}
      </div>

      <h2>Quarterly measurement layer</h2>
      <div class="kpis">
        <div class="kpi"><b>${adoptionScoreTotals.baseline}</b><span>Baseline score</span></div>
        <div class="kpi"><b>${adoptionScoreTotals.previous}</b><span>Previous revisit</span></div>
        <div class="kpi"><b>${adoptionScoreTotals.current}</b><span>Current score</span></div>
        <div class="kpi"><b>${adoptionScoreTotals.totalImprovement >= 0 ? '+' : ''}${adoptionScoreTotals.totalImprovement}</b><span>Improvement</span></div>
        <div class="kpi"><b>${adoptionScoreTotals.gapToTarget}</b><span>Gap to target</span></div>
      </div>
      <div class="grid">
        ${adoptionScoreTracking
          .map(
            (score) => {
              const pillar = adoptionScorePillars.find((item) => item.name === score.pillar)
              return `<div class="card">
              <h3>${escapeReport(score.pillar)}</h3>
              <p>${escapeReport(pillar?.whatItTracks ?? '')}</p>
              <p><strong>Baseline:</strong> ${score.baseline} · <strong>Previous:</strong> ${score.previous} · <strong>Current:</strong> ${score.current} · <strong>Target:</strong> ${score.target}</p>
              <p class="small"><strong>Improvement:</strong> ${score.current - score.baseline >= 0 ? '+' : ''}${score.current - score.baseline} from baseline · ${score.current - score.previous >= 0 ? '+' : ''}${score.current - score.previous} this revisit</p>
              <p class="small"><strong>Notes:</strong> ${escapeReport(score.notes)}</p>
            </div>`
            },
          )
          .join('')}
      </div>
    `
    return reportShell(`${clientDisplayName} Microsoft Copilot Adoption Workshop Report`, 'An adoption, prioritisation and growth alignment report.', body)
  }

  function projectsReportBody() {
    return projectReportCards()
  }

  function projectsReportHtml() {
    const body = `
      <h2>Project delivery headline</h2>
      <div class="hero-card-report">
        <h3 style="color:white">From workshop ideas to owned action</h3>
        <p>This report captures the workshop-wide Top 5 projects, their complete linked idea context and every project-readiness and agent-governance answer.</p>
      </div>
      <div class="kpis">
        <div class="kpi"><b>${activeProjectTasks.length}</b><span>Top 5 projects</span></div>
        <div class="kpi"><b>${activeProjectTasks.length}</b><span>Project recommendations</span></div>
        <div class="kpi"><b>${topFiveIdeas.length}</b><span>Top 5 ideas</span></div>
        <div class="kpi"><b>${groups.length}</b><span>Workshop Groups</span></div>
      </div>
      <div class="chart-grid">
        ${donutChart(
          'Recommendation mix by Copilot strand',
          stages.map((stage, index) => ({
            label: stage,
            value: topFiveIdeas.filter((idea) => idea.stage === stage).length,
            color: ['#0b5cad', '#0f8a5f', '#f28c28', '#7c3aed', '#ff2aa0'][index],
          })),
        )}
        ${barChart(
          'Recommendations by group',
          groups.map((group) => ({ label: group.name, value: activeProjectTasks.filter((task) => task.groupId === group.id).length })),
        )}
        ${priorityMatrixChart()}
      </div>
      ${projectsReportBody()}
      <h2>Group delivery ownership</h2>
      <table><thead><tr><th>Group</th><th>Department</th><th>Champion</th><th>Project recommendations</th><th>Copilot strands</th></tr></thead><tbody>${renderRows(
        groups.map((group) => {
          const groupTasks = activeProjectTasks.filter((task) => task.groupId === group.id)
          return [
            group.name,
            group.department,
            group.champion,
            groupTasks.length,
            [...new Set(groupTasks.map((task) => stageLabel(ideas.find((idea) => idea.id === task.ideaId)?.stage ?? task.copilotStage)))].join(' | ') || '—',
          ]
        }),
      )}</tbody></table>
    `
    return reportShell(`${clientDisplayName} Copilot Projects Report`, 'Detailed project recommendation, owner, measure and prioritisation report.', body)
  }

  function reportSlug() {
    return customerName.trim()
      ? customerName.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase()
      : 'microsoft-copilot-adoption-workshop'
  }

  function downloadFullReportHtml() {
    downloadHtmlReport(`${reportSlug()}-copilot-adoption-full-report.html`, fullReportHtml())
  }

  function downloadProjectsReportHtml() {
    downloadHtmlReport(`${reportSlug()}-copilot-projects-report.html`, projectsReportHtml())
  }

  function downloadFullReportPdf() {
    void downloadPdfReport(`${reportSlug()}-copilot-adoption-full-report.pdf`, 'full')
  }

  function downloadProjectsReportPdf() {
    void downloadPdfReport(`${reportSlug()}-copilot-projects-report.pdf`, 'projects')
  }

  function downloadManagedServiceReportPdf() {
    void downloadPdfReport(`${reportSlug()}-copilot-managed-service-report.pdf`, 'managed')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img alt="Unleashed" className="brand-logo" src={unleashedLogoUrl} />
          <span>Microsoft Copilot Workshop</span>
        </div>
        <label className="company-brand-field">
          Client
          <input
            onChange={(event) => setCustomerName(event.target.value)}
            placeholder="Enter client name"
            value={customerName}
          />
          <button className="rail-add full destructive" onClick={startNewWorkshop} type="button">
            <Trash2 size={14} /> New Workshop
          </button>
        </label>
        {['Home', 'Dashboard', 'Business Goals', 'Adoption Pulse', 'Workshop Groups', 'Ideas', 'Prioritise', 'Projects', 'Managed Service', 'Agenda', 'Export'].map((view) => (
          <button
            className={activeView === view ? 'nav-item active' : 'nav-item'}
            key={view}
            onClick={() => setActiveView(view)}
            type="button"
          >
            {view}
          </button>
        ))}
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-heading">
            <span className="topbar-marker">IQ</span>
            <div>
            <p className="eyebrow">{clientDisplayName} · Copilot adoption workshop</p>
            <h1>{workshopName}</h1>
            </div>
          </div>
          <div className="topbar-actions">
            {activeView === 'Home' && (
              <>
                <button className="primary accent" onClick={downloadFullReportPdf} type="button">
                  <Download size={18} />
                  Full report PDF
                </button>
                <button className="secondary" onClick={downloadFullReportHtml} type="button">
                  <Download size={18} />
                  Full report HTML
                </button>
              </>
            )}
            <button className="primary" onClick={downloadSummary} type="button">
              <Download size={18} />
              Working summary TXT
            </button>
            <img alt="Unleashed" className="topbar-logo" src={unleashedLogoUrl} />
          </div>
        </header>

        {activeView === 'Dashboard' && (
          <section className="view">
            <div className="hero-card">
              <div>
                <p className="eyebrow">Current workshop</p>
                <textarea
                  aria-label="Workshop name"
                  className="hero-input"
                  onChange={(event) => setWorkshopName(event.target.value)}
                  rows={2}
                  value={workshopName}
                />
                <div className="inline-fields">
                  <label>
                    Company
                    <input onChange={(event) => setCustomerName(event.target.value)} value={customerName} />
                  </label>
                  <label>
                    Date
                    <input onChange={(event) => setWorkshopDate(event.target.value)} type="date" value={workshopDate} />
                  </label>
                </div>
                <div className="hero-actions">
                  <button className="primary accent" onClick={downloadFullReportPdf} type="button">
                    <Download size={18} />
                    Export full report PDF
                  </button>
                  <button className="secondary" onClick={downloadFullReportHtml} type="button">
                    <Download size={18} />
                    Export full report HTML
                  </button>
                  <span>Branded client report covering agenda, business goals, adoption pulse, ideas, prioritisation and projects.</span>
                </div>
              </div>
            </div>

            <div className="metric-grid">
              <Metric icon={<Users />} label="Attendees" value={stats.attendees} />
              <Metric icon={<Users />} label="Workshop Groups" value={stats.groups} />
              <Metric icon={<Lightbulb />} label="Ideas logged" value={stats.ideas} />
              <Metric icon={<Target />} label="Priority ideas" value={stats.pilotIdeas} />
              <Metric icon={<ClipboardList />} label="Project recommendations" value={stats.projectActions} />
            </div>

            <div className="dashboard-insights">
              <article className="insight-card headline">
                <span>Executive outcome</span>
                <strong>{ultimateObjective?.title}</strong>
                <p>
                  Copilot adoption is being positioned around revenue growth, faster customer response, stronger follow-up,
                  better listing quality and joined-up departmental execution.
                </p>
              </article>
              <article className="insight-card">
                <span>Idea pipeline</span>
                <strong>{ideaStatusCounts.priority} priority · {ideaStatusCounts.shortlisted} shortlisted</strong>
                <p>{ideaStatusCounts.ideaOnly} ideas remain in discovery and {ideaStatusCounts.notSelected} have been parked for now.</p>
              </article>
              <article className="insight-card">
                <span>Adoption signal</span>
                <strong>{confidenceSummary.completedAttendees}/{attendees.length} confidence sets complete</strong>
                <p>Average movement is {confidenceSummary.averageMovement >= 0 ? '+' : ''}{confidenceSummary.averageMovement.toFixed(1)} across completed before/after ratings.</p>
              </article>
            </div>

            <div className="two-column">
              <Panel title="Copilot adoption journey">
                <div className="journey">
                  {stages.map((stage, index) => (
                    <div className="stage-card" key={stage}>
                      <span>{index + 1}</span>
                      <strong>{stage}</strong>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title="Stages for growth">
                <div className="growth-roadmap">
                  <div>
                    <b>1</b>
                    <strong>Baseline usage</strong>
                    <span>Capture current confidence, barriers and high-friction work.</span>
                  </div>
                  <div>
                    <b>2</b>
                    <strong>Prioritise value</strong>
                    <span>Focus on high-impact, low-risk opportunities linked to the business goal.</span>
                  </div>
                  <div>
                    <b>3</b>
                    <strong>Assign owners</strong>
                    <span>Turn priority and shortlisted ideas into named tasks with measures.</span>
                  </div>
                  <div>
                    <b>4</b>
                    <strong>Scale with agents</strong>
                    <span>Progress from Copilot web and apps into agents, Copilot Studio and GitHub Copilot.</span>
                  </div>
                </div>
              </Panel>
            </div>

            <div className="two-column">
              <Panel title="Top priority ideas">
                <div className="stack">
                  {topIdeas.map((idea) => (
                    <IdeaMini key={idea.id} idea={idea} />
                  ))}
                </div>
              </Panel>
              <Panel title="Department momentum">
                <div className="department-momentum">
                  {departments.map((department) => (
                    <div key={department.id}>
                      <strong>{department.name}</strong>
                      <span>Champion: {department.champion || 'Unassigned'}</span>
                      <p>{department.focus || 'No department focus added yet.'}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div className="two-column">
              <Panel title="Adoption pulse snapshot">
                <div className="pulse-snapshot">
                  <div>
                    <strong>Overall confidence before</strong>
                    <span>{formatConfidenceScore(confidenceSummary.beforeTotal)} / {confidenceSummary.maximumTotal}</span>
                    <small>{confidenceSummary.beforeCompletedAttendees} of {attendees.length} attendees entered</small>
                  </div>
                  <div>
                    <strong>Overall confidence after</strong>
                    <span>{formatConfidenceScore(confidenceSummary.afterTotal)} / {confidenceSummary.maximumTotal}</span>
                    <small>{confidenceSummary.afterCompletedAttendees} of {attendees.length} attendees entered</small>
                  </div>
                </div>
              </Panel>
              <Panel title="Commercial focus">
                <div className="commercial-focus">
                  <div>
                    <strong>Revenue growth</strong>
                    <span>{ultimateObjective?.title}</span>
                  </div>
                  <div>
                    <strong>Workshop recommendations</strong>
                    <span>{stats.projectActions} priority project recommendations across {groups.length} workshop groups.</span>
                  </div>
                  <div>
                    <strong>Value pipeline</strong>
                    <span>{remainingUseCasesForProjects.length} shortlisted and idea-only use cases ready to add to a project.</span>
                  </div>
                </div>
              </Panel>
            </div>
            <DepartmentGoalMap
              attendees={attendees}
              companyGoal={ultimateObjective}
              departments={departments}
              onAddDepartment={addDepartment}
              onRemoveDepartment={removeDepartment}
              onUpdateCompanyGoal={updateCompanyGoal}
              onUpdateDepartment={updateDepartment}
            />
          </section>
        )}

        {activeView === 'Dashboard' && (
          <section className="view">
            <div className="section-actions">
              <div>
                <p className="eyebrow">{customerName} · Client adoption snapshot</p>
                <h2>Dashboard</h2>
              </div>
              <div>
                <button className="primary accent" onClick={downloadFullReportPdf} type="button">
                  <Download size={18} />
                  Full report PDF
                </button>
                <button className="secondary" onClick={downloadProjectsReportPdf} type="button">
                  <Download size={18} />
                  Projects PDF
                </button>
              </div>
            </div>

            <div className="focused-summary-grid">
              <article className="focused-summary-card confidence-before">
                <span className="focused-summary-label">Confidence before</span>
                <strong className="focused-summary-score">
                  {formatConfidenceScore(confidenceSummary.beforeTotal)}
                  <small> / {confidenceSummary.maximumTotal}</small>
                </strong>
                <p>One overall 1–5 score per attendee. Maximum: {attendees.length} attendees × 5 points.</p>
                <div className="focused-summary-meta">
                  <span>{confidenceSummary.beforeCompletedAttendees} of {attendees.length} attendees completed</span>
                  <span>{confidenceSummary.beforeAverage ? `${confidenceSummary.beforeAverage.toFixed(1)} average entered score` : 'No scores entered'}</span>
                </div>
              </article>

              <article className="focused-summary-card confidence-after">
                <span className="focused-summary-label">Confidence after</span>
                <strong className="focused-summary-score">
                  {formatConfidenceScore(confidenceSummary.afterTotal)}
                  <small> / {confidenceSummary.maximumTotal}</small>
                </strong>
                <p>One overall 1–5 score per attendee. Maximum: {attendees.length} attendees × 5 points.</p>
                <div className="focused-summary-meta">
                  <span>{confidenceSummary.afterCompletedAttendees} of {attendees.length} attendees completed</span>
                  <span>{confidenceSummary.afterAverage ? `${confidenceSummary.afterAverage.toFixed(1)} average entered score` : 'No scores entered'}</span>
                </div>
                {confidenceSummary.enteredRatings > 0 && (
                  <b className={`movement-chip ${confidenceSummary.matchedMovement >= 0 ? 'positive' : 'negative'}`}>
                    {confidenceSummary.matchedMovement >= 0 ? '+' : ''}{formatConfidenceScore(confidenceSummary.matchedMovement)} points across {confidenceSummary.enteredRatings} matched attendees
                  </b>
                )}
              </article>

              <article className="focused-summary-card idea-pipeline-card">
                <span className="focused-summary-label">Idea pipeline</span>
                <strong className="focused-summary-score">{focusedIdeaPipeline.total}<small> ideas</small></strong>
                <div className="focused-pipeline">
                  <div><i className="idea-only" /><span>Idea only</span><strong>{focusedIdeaPipeline.ideaOnly}</strong></div>
                  <div><i className="shortlisted" /><span>Shortlisted</span><strong>{focusedIdeaPipeline.shortlisted}</strong></div>
                  <div><i className="top-five" /><span>Top 5 / Projects</span><strong>{focusedIdeaPipeline.topFive}</strong></div>
                </div>
                <p>The workshop-wide Top 5 automatically move into Projects.</p>
              </article>

              <article className="focused-summary-card projects-taken-card">
                <span className="focused-summary-label">Ideas taken through to Projects</span>
                <div className="focused-project-list">
                  {Array.from({ length: priorityIdeaLimit }, (_, slot) => {
                    const idea = topFiveIdeas[slot]
                    return (
                      <div className={idea ? 'filled' : 'empty'} key={idea?.id ?? `empty-${slot}`}>
                        <b>{slot + 1}</b>
                        <span>{idea?.title ?? 'Top 5 slot not selected'}</span>
                      </div>
                    )
                  })}
                </div>
                <p>{topFiveIdeas.length}/{priorityIdeaLimit} active ideas are currently linked to Projects.</p>
              </article>
            </div>
          </section>
        )}

        {activeView === 'What is this workshop?' && (
          <section className="view">
            <div className="section-actions">
              <div>
                <p className="eyebrow">Setting the scene</p>
                <h2>What is this workshop?</h2>
              </div>
            </div>
            <div className="workshop-story">
              <Panel title="Purpose">
                <p>
                  This workshop is designed to move the organisation from curiosity about Copilot to a practical adoption
                  plan. We will look at where Copilot can improve productivity, reduce friction, support better decisions
                  and help teams turn opportunities into measurable business outcomes.
                </p>
              </Panel>
              <Panel title="How the day works">
                <div className="story-steps">
                  <article>
                    <strong>1</strong>
                    <span>Understand the business objective</span>
                  </article>
                  <article>
                    <strong>2</strong>
                    <span>Baseline confidence across the five Copilot stages</span>
                  </article>
                  <article>
                    <strong>3</strong>
                    <span>Explore practical examples and opportunities</span>
                  </article>
                  <article>
                    <strong>4</strong>
                    <span>Work in groups to identify valuable use cases</span>
                  </article>
                  <article>
                    <strong>5</strong>
                    <span>Prioritise, assign owners and agree next steps</span>
                  </article>
                </div>
              </Panel>
              <Panel title="What success looks like">
                <div className="success-grid">
                  <div>
                    <b>Clear use cases</b>
                    <span>Opportunities linked to real work and business outcomes.</span>
                  </div>
                  <div>
                    <b>Department ownership</b>
                    <span>Each group leaves with a champion and adoption tasks.</span>
                  </div>
                  <div>
                    <b>Prioritised next steps</b>
                    <span>The strongest opportunities are ranked and ready to progress.</span>
                  </div>
                  <div>
                    <b>Measurable adoption</b>
                    <span>The room has a baseline across web, apps, agents, Studio and GitHub Copilot.</span>
                  </div>
                </div>
              </Panel>
            </div>
          </section>
        )}

        {activeView === 'Business Goals' && (
          <section className="view">
            <div className="section-actions">
              <div>
                <p className="eyebrow">{customerName} · Current operating plan before Copilot</p>
                <h2>Business goals</h2>
              </div>
              <div>
                <button className="secondary" onClick={createGroupsFromDepartments} type="button">
                  Create Workshop Groups from departments
                </button>
                <button className="primary" onClick={addDepartment} type="button">
                  <Plus size={16} /> Add department
                </button>
              </div>
            </div>
            <DepartmentGoalMap
              attendees={attendees}
              companyGoal={ultimateObjective}
              departments={departments}
              onAddDepartment={addDepartment}
              onRemoveDepartment={removeDepartment}
              onUpdateCompanyGoal={updateCompanyGoal}
              onUpdateDepartment={updateDepartment}
            />
          </section>
        )}

        {activeView === 'Agenda' && (
          <section className="view">
            <Panel title="Workshop agenda">
              <div className="agenda-list">
                {agenda.map((item, index) => (
                  <button
                    className={index === currentAgendaIndex ? 'agenda-item active' : 'agenda-item'}
                    key={item.title}
                    onClick={() => setCurrentAgendaIndex(index)}
                    type="button"
                  >
                    <span>{item.time}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.purpose}</p>
                      <small>Output: {item.output}</small>
                    </div>
                  </button>
                ))}
              </div>
            </Panel>
            <Panel title="Adoption Pulse capture">
              <div className="agenda-pulse-summary">
                <div>
                  <strong>{confidenceSummary.beforeCompletedAttendees}/{attendees.length} before scores entered</strong>
                  <span>One overall Copilot confidence score per attendee</span>
                </div>
                <div>
                  <strong>{confidenceSummary.afterCompletedAttendees}/{attendees.length} after scores entered</strong>
                  <span>{confidenceSummary.completedAttendees} matched before/after pairs</span>
                </div>
                <button className="primary" onClick={() => setActiveView('Adoption Pulse')} type="button">
                  Open Adoption Pulse
                </button>
              </div>
            </Panel>
          </section>
        )}

        {activeView === 'Adoption Pulse' && (
          <section className="view">
            <div className="section-actions">
              <div>
                <p className="eyebrow">Overall Copilot confidence</p>
                <h2>Adoption Pulse</h2>
                <p>Capture one overall before and after confidence score for each attendee using the 1–5 scale.</p>
              </div>
              <div className="pulse-summary-chips">
                <span><b>{confidenceSummary.beforeCompletedAttendees}/{attendees.length}</b> before entered</span>
                <span><b>{confidenceSummary.afterCompletedAttendees}/{attendees.length}</b> after entered</span>
                <span><b>{confidenceSummary.completedAttendees}/{attendees.length}</b> matched pairs</span>
              </div>
            </div>
            <Panel title="Per-attendee confidence: before and after">
              <div className="confidence-intro">
                <div>
                  <strong>1–5 confidence scale in 0.5 increments</strong>
                  <span>1 Not confident · 3 Somewhat confident · 5 Very confident</span>
                </div>
                <div>
                  <strong>{confidenceSummary.averageMovement >= 0 ? '+' : ''}{confidenceSummary.averageMovement.toFixed(1)}</strong>
                  <span>average movement across {confidenceSummary.completedAttendees} matched attendees</span>
                </div>
              </div>
              <div className="overall-confidence-table">
                <div className="overall-confidence-header">
                  <span>Attendee</span>
                  <span>Before</span>
                  <span>After</span>
                  <span>Change</span>
                </div>
                {attendees.map((attendee) => {
                  const entry = overallConfidence.find((item) => item.attendeeId === attendee.id) ?? { attendeeId: attendee.id, before: 0, after: 0 }
                  const movement = entry.before && entry.after ? entry.after - entry.before : null
                  return (
                    <div className="overall-confidence-row" key={attendee.id}>
                      <div>
                        <strong>{attendee.name}</strong>
                        <span>{attendee.team || 'Workshop participant'}</span>
                      </div>
                      <label className="overall-confidence-score-field">
                        <span>Before</span>
                        <select
                          aria-label={`${attendee.name} confidence before`}
                          onChange={(event) => updateOverallConfidence(attendee.id, 'before', Number(event.target.value))}
                          value={entry.before}
                        >
                          {overallConfidenceScale.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </label>
                      <label className="overall-confidence-score-field">
                        <span>After</span>
                        <select
                          aria-label={`${attendee.name} confidence after`}
                          onChange={(event) => updateOverallConfidence(attendee.id, 'after', Number(event.target.value))}
                          value={entry.after}
                        >
                          {overallConfidenceScale.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </label>
                      <b className={movement !== null && movement > 0 ? 'positive' : ''}>
                        {movement === null ? '—' : `${movement >= 0 ? '+' : ''}${formatConfidenceScore(movement)}`}
                      </b>
                    </div>
                  )
                })}
              </div>
            </Panel>
          </section>
        )}

        {activeView === 'Workshop Groups' && (
          <section className="view">
            <div className="section-actions">
              <div>
                <h2>Workshop Groups</h2>
                <p>Assign team members and capture the one task or challenge each person believes AI could help with.</p>
              </div>
              <div>
                <button className="secondary" onClick={createGroupsFromDepartments} type="button">
                  Create Workshop Groups from departments
                </button>
                <button className="secondary" onClick={addGroup} type="button">
                  <Plus size={16} /> Add Workshop Group
                </button>
                <button className="primary" onClick={addAttendee} type="button">
                  <Plus size={16} /> Add team member
                </button>
              </div>
            </div>
            <div className="workshop-group-list">
              {groups.map((group) => {
                const groupMemberEntries = groupMemberships
                  .filter((membership) => membership.groupId === group.id)
                  .map((membership) => ({
                    membership,
                    attendee: attendees.find((attendee) => attendee.id === membership.attendeeId),
                  }))
                  .filter((entry): entry is { membership: WorkshopGroupMembership; attendee: Attendee } => Boolean(entry.attendee))
                const availableMembers = attendees.filter(
                  (attendee) =>
                    !groupMemberships.some(
                      (membership) => membership.groupId === group.id && membership.attendeeId === attendee.id,
                    ),
                )
                const challengeCount = groupMemberEntries.filter(({ membership }) => membership.challenge.trim()).length
                return (
                  <details className="workshop-group-card" key={group.id}>
                    <summary>
                      <div>
                        <strong>{group.name}</strong>
                        <span>{group.department}</span>
                        <small>Champion: {group.champion || 'Unassigned'}</small>
                      </div>
                      <b>{groupMemberEntries.length} members · {challengeCount} tasks/challenges</b>
                    </summary>
                    <div className="workshop-group-content">
                      <div className="panel-tools">
                        <span>Workshop Group details</span>
                        <button
                          className="secondary danger-button"
                          disabled={groups.length <= 1}
                          onClick={() => removeGroup(group.id)}
                          type="button"
                        >
                          <Trash2 size={16} /> Remove Workshop Group
                        </button>
                      </div>
                      <div className="form-grid">
                        <label>
                          Workshop Group name
                          <input onChange={(event) => updateGroup(group.id, { name: event.target.value })} value={group.name} />
                        </label>
                        <label>
                          Department / team
                          <input onChange={(event) => updateGroup(group.id, { department: event.target.value })} value={group.department} />
                        </label>
                        <label>
                          Workshop Group champion
                          <TeamMemberSelect
                            ariaLabel={`${group.name} Workshop Group champion`}
                            names={groupMemberEntries.map(({ attendee }) => attendee.name)}
                            onChange={(champion) => updateGroup(group.id, { champion })}
                            value={group.champion}
                          />
                        </label>
                        <label>
                          Session lead
                          <input onChange={(event) => updateGroup(group.id, { facilitator: event.target.value })} value={group.facilitator} />
                        </label>
                        <label>
                          Table / room
                          <input onChange={(event) => updateGroup(group.id, { table: event.target.value })} value={group.table} />
                        </label>
                        <label>
                          Add team member
                          <select
                            disabled={availableMembers.length === 0}
                            onChange={(event) => {
                              const attendeeId = Number(event.target.value)
                              if (attendeeId) addMembership(group.id, attendeeId)
                              event.target.value = ''
                            }}
                            value=""
                          >
                            <option value="">{availableMembers.length ? 'Select a team member' : 'All team members assigned here'}</option>
                            {availableMembers.map((attendee) => (
                              <option key={attendee.id} value={attendee.id}>
                                {attendee.name} · {attendee.team}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="workshop-member-list">
                        {groupMemberEntries.map(({ attendee, membership }) => (
                          <article className="workshop-member-row" key={membership.id}>
                            <label className="workshop-member-name">
                              Name of person
                              <input
                                aria-label={`${group.name} team member name`}
                                onChange={(event) => updateAttendee(attendee.id, { name: event.target.value })}
                                value={attendee.name}
                              />
                            </label>
                            <label>
                              One task AI could help with
                              <textarea
                                onChange={(event) => updateMembershipChallenge(membership.id, event.target.value)}
                                placeholder="Describe one task"
                                value={membership.challenge}
                              />
                            </label>
                            <label>
                              What would this ultimately improve?
                              <textarea
                                onChange={(event) => updateMembershipImprovement(membership.id, event.target.value)}
                                placeholder="Describe the intended improvement"
                                value={membership.improvement ?? ''}
                              />
                            </label>
                            <button
                              className="icon-button danger"
                              onClick={() => removeMembership(membership.id)}
                              title="Remove from Workshop Group"
                              type="button"
                            >
                              <Trash2 size={16} />
                            </button>
                          </article>
                        ))}
                        {groupMemberEntries.length === 0 && <div className="empty-state">No team members assigned to this Workshop Group.</div>}
                      </div>
                    </div>
                  </details>
                )
              })}
            </div>
          </section>
        )}

        {activeView === 'Ideas' && (
          <section className="view">
            <div className="section-actions">
              <div>
                <h2>Ideas by Workshop Group</h2>
                <p>Each member's task or challenge flows through from Workshop Groups and can support multiple distinct ideas where the workshop evidence captured them.</p>
              </div>
            </div>
            <div className="workshop-group-list">
              {groups.map((group) => {
                const groupMemberEntries = groupMemberships
                  .filter((membership) => membership.groupId === group.id)
                  .map((membership) => ({
                    membership,
                    attendee: attendees.find((attendee) => attendee.id === membership.attendeeId),
                  }))
                  .filter((entry): entry is { membership: WorkshopGroupMembership; attendee: Attendee } => Boolean(entry.attendee))
                const groupIdeas = ideas.filter((idea) => idea.groupId === group.id)
                const legacyIdeas = groupIdeas.filter((idea) => idea.membershipId === undefined)
                return (
                  <details className="workflow-disclosure" key={group.id}>
                    <summary>
                      <strong>{group.name}</strong>
                      <span>{groupMemberEntries.length} members · {groupIdeas.length} ideas</span>
                    </summary>
                    <div className="member-idea-list">
                      {groupMemberEntries.map(({ attendee, membership }) => {
                        const linkedIdeas = ideas.filter((item) => item.membershipId === membership.id)
                        return (
                          <article className="member-idea" key={membership.id}>
                            {linkedIdeas.length ? (
                              linkedIdeas.map((idea) => {
                                const source = ideaSourceContext(idea, groupMemberships, attendees)
                                return (
                                  <IdeaEditor
                                    contributorName={source.contributorName}
                                    groupMembers={groupMemberEntries.map((entry) => entry.attendee)}
                                    idea={idea}
                                    key={idea.id}
                                    onChange={(patch) => updateIdea(idea.id, patch)}
                                    onDelete={() => removeIdea(idea)}
                                    onMoveDown={() => moveIdea(idea.id, 1)}
                                    onMoveUp={() => moveIdea(idea.id, -1)}
                                    sourceImprovement={source.sourceImprovement}
                                    sourceTask={source.sourceTask}
                                  />
                                )
                              })
                            ) : (
                              <div className="empty-state">
                                <strong>{attendee.name}</strong><br />
                                {membership.challenge || 'No source task entered'}<br />
                                This source currently has no active idea. Editing its Workshop Group task can create a new one.
                              </div>
                            )}
                          </article>
                        )
                      })}
                      {legacyIdeas.length > 0 && (
                        <details className="legacy-idea-list">
                          <summary>{legacyIdeas.length} existing group ideas without a linked member</summary>
                          {legacyIdeas.map((idea) => (
                            (() => {
                              const source = ideaSourceContext(idea, groupMemberships, attendees)
                              return (
                                <IdeaEditor
                                  contributorName={source.contributorName}
                                  groupMembers={groupMemberEntries.map((entry) => entry.attendee)}
                                  idea={idea}
                                  key={idea.id}
                                  onChange={(patch) => updateIdea(idea.id, patch)}
                                  onDelete={() => removeIdea(idea)}
                                  onMoveDown={() => moveIdea(idea.id, 1)}
                                  onMoveUp={() => moveIdea(idea.id, -1)}
                                  sourceImprovement={source.sourceImprovement}
                                  sourceTask={source.sourceTask}
                                />
                              )
                            })()
                          ))}
                        </details>
                      )}
                      {groupMemberEntries.length === 0 && legacyIdeas.length === 0 && (
                        <div className="empty-state">Assign members and add their AI-help tasks in Workshop Groups first.</div>
                      )}
                    </div>
                  </details>
                )
              })}
            </div>
          </section>
        )}

        {activeView === 'Prioritise' && (
          <section className="view">
            <div className="section-actions">
              <div>
                <h2>Prioritise Workshop Group ideas</h2>
                <p>Shortlist ideas for consideration and select no more than five workshop-wide ideas to move toward production.</p>
              </div>
              <div className={topFiveIdeas.length >= priorityIdeaLimit ? 'top-five-counter limit' : 'top-five-counter'}>
                <strong>{topFiveIdeas.length} / {priorityIdeaLimit}</strong>
                <span>top ideas selected</span>
              </div>
            </div>
            {topFiveIdeas.length >= priorityIdeaLimit && (
              <div className="limit-feedback">Top 5 complete. Remove a top idea before selecting another.</div>
            )}
            <div className="workshop-group-list">
              {groups.map((group) => {
                const groupIdeas = ideas.filter((idea) => idea.groupId === group.id)
                return (
                  <details className="workflow-disclosure priority-disclosure" key={group.id}>
                    <summary>
                      <strong>Workshop Group {group.name}</strong>
                      <span>{groupIdeas.length} ideas</span>
                    </summary>
                    <div className="priority-choice-list">
                      {groupIdeas.map((idea) => {
                        const source = ideaSourceContext(idea, groupMemberships, attendees)
                        const isShortlisted = idea.status === 'Shortlisted' || idea.status === 'Priority' || Boolean(idea.isTopIdea)
                        const topLimitReached = topFiveIdeas.length >= priorityIdeaLimit && !idea.isTopIdea
                        const completion = ideaDesignCompletion(idea)
                        return (
                          <article className="priority-choice" key={idea.id}>
                            <div className="priority-idea-summary">
                              <strong>{idea.title}</strong>
                              <span>{source.contributorName} · {source.sourceTask || idea.pain}</span>
                              <small>
                                {idea.userScopes?.length ? idea.userScopes.join(', ') : 'User scope not entered'}
                                {' · '}
                                {stageLabel(idea.stage)}
                                {' · '}
                                {completion.completed}/{completion.total} core questions
                              </small>
                              <details>
                                <summary>Evidence-aligned idea detail</summary>
                                <p><strong>Current task / pain:</strong> {idea.pain || 'Not entered'}</p>
                                <p><strong>Difficult today:</strong> {idea.difficulty || 'Not entered'}</p>
                                <p><strong>AI/Copilot idea:</strong> {idea.opportunity || 'Not entered'}</p>
                                <p><strong>Ideal outcome:</strong> {idea.idealOutcome || 'Not entered'}</p>
                                <p><strong>Information / data:</strong> {idea.informationNeeded || 'Not entered'}</p>
                                <p><strong>Integration:</strong> {idea.integrationNeed || 'Not entered'}{idea.integrationSystems ? ` — ${idea.integrationSystems}` : ''}</p>
                                <p><strong>Users / scope:</strong> {idea.mainUsers || 'Not entered'}{idea.userScopes?.length ? ` — ${idea.userScopes.join(', ')}` : ''}</p>
                                <p><strong>Expected benefit:</strong> {idea.benefit || 'Not entered'}</p>
                                <p><strong>Risks / controls / review:</strong> {idea.concerns || 'Not entered'}</p>
                                {idea.supportingContext && <p><strong>Supporting contributors / merged evidence:</strong> {idea.supportingContext}</p>}
                              </details>
                            </div>
                            <label>
                              <input
                                checked={isShortlisted}
                                disabled={Boolean(idea.isTopIdea)}
                                onChange={(event) => setIdeaShortlisted(idea.id, event.target.checked)}
                                type="checkbox"
                              />
                              Shortlist
                            </label>
                            <label>
                              <input
                                checked={Boolean(idea.isTopIdea)}
                                disabled={topLimitReached}
                                onChange={(event) => setIdeaTopFive(idea.id, event.target.checked)}
                                type="checkbox"
                              />
                              Top 5
                            </label>
                          </article>
                        )
                      })}
                      {groupIdeas.length === 0 && <div className="empty-state">No ideas captured for this Workshop Group yet.</div>}
                    </div>
                  </details>
                )
              })}
            </div>
            <div className="section-actions compact-section-actions">
              <div>
                <h2>Detailed scoring</h2>
                <p>Score shortlisted and top-five ideas without duplicating selection controls.</p>
              </div>
              <label className="compact-filter">
                View Workshop Group
                <select
                  onChange={(event) =>
                    setSelectedPriorityGroup(event.target.value === 'all' ? 'all' : Number(event.target.value))
                  }
                  value={selectedPriorityGroup}
                >
                  <option value="all">All Workshop Groups</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Panel title="Shortlisted and top-five scoring matrix">
              <div className="table">
                <div className="table-row header prioritisation-table-row">
                  <span>Order</span>
                  <span>Workshop Group</span>
                  <span>Member</span>
                  <span>Use case</span>
                  <span>Stage</span>
                  <span>Impact</span>
                  <span>Ease</span>
                  <span>Risk</span>
                  <span>Ready</span>
                  <span>Score</span>
                  <span>Selection</span>
                </div>
                {filteredPriorityIdeas.map((idea) => {
                  const score = priorityScore(idea)
                  const group = groups.find((item) => item.id === idea.groupId)
                  const source = ideaSourceContext(idea, groupMemberships, attendees)
                  return (
                    <div className="table-row prioritisation-table-row" key={idea.id}>
                      <span className="order-controls">
                        <button className="icon-button" onClick={() => moveIdea(idea.id, -1)} title="Move up" type="button">
                          <ArrowUp size={15} />
                        </button>
                        <button className="icon-button" onClick={() => moveIdea(idea.id, 1)} title="Move down" type="button">
                          <ArrowDown size={15} />
                        </button>
                      </span>
                      <span>{group?.name ?? 'No Workshop Group'}</span>
                      <span>{source.contributorName}</span>
                      <strong>{idea.title}</strong>
                      <span>{idea.stage}</span>
                      <Score value={idea.impact} onChange={(value) => updateIdea(idea.id, { impact: value })} />
                      <Score value={idea.ease} onChange={(value) => updateIdea(idea.id, { ease: value })} />
                      <Score value={idea.risk} onChange={(value) => updateIdea(idea.id, { risk: value })} />
                      <Score value={idea.readiness} onChange={(value) => updateIdea(idea.id, { readiness: value })} />
                      <span className="score">{score}</span>
                      <span className={idea.isTopIdea ? 'selection-badge top' : 'selection-badge'}>
                        {idea.isTopIdea ? 'Top 5' : 'Shortlisted'}
                      </span>
                    </div>
                  )
                })}
                {filteredPriorityIdeas.length === 0 && (
                  <div className="empty-state">Shortlist ideas above to add them to the scoring matrix.</div>
                )}
              </div>
            </Panel>
          </section>
        )}

        {activeView === 'Projects' && (
          <section className="view">
            <div className="section-actions">
              <h2>Priority project recommendations</h2>
              <div>
                <label className="compact-filter">
                  Planning Workshop Group
                  <select
                    onChange={(event) =>
                      setSelectedActionGroup(event.target.value === 'all' ? 'all' : Number(event.target.value))
                    }
                    value={selectedActionGroup}
                  >
                    <option value="all">All Workshop Groups</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name} · {group.department}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="primary accent" onClick={downloadProjectsReportPdf} type="button">
                  <Download size={16} /> Projects PDF
                </button>
                <button className="secondary" onClick={downloadProjectsReportHtml} type="button">
                  <Download size={16} /> Projects HTML
                </button>
              </div>
            </div>
            <div className="group-priority-grid">
              {groups.map((group) => {
                const groupTasks = activeProjectTasks.filter((task) => task.groupId === group.id)
                return (
                  <article className="group-summary action" key={group.id}>
                    <span>{group.department}</span>
                    <strong>{group.champion}</strong>
                    <p>{group.name} adoption champion</p>
                    <b>{groupTasks.length} recommendations</b>
                    <small>
                      {[...new Set(groupTasks.map((task) => stageLabel(ideas.find((idea) => idea.id === task.ideaId)?.stage ?? task.copilotStage)))].join(' · ') || 'No priority yet'}
                    </small>
                  </article>
                )
              })}
            </div>
            <Panel title="Workshop-wide Top 5 projects">
              <div className="project-disclosure-list">
                {priorityProjectIdeas.map((idea) => {
                  const group = groups.find((item) => item.id === idea.groupId)
                  const source = ideaSourceContext(idea, groupMemberships, attendees)
                  const relatedTask = tasks.find((task) => task.ideaId === idea.id)
                  return (
                    <details className="project-disclosure" key={idea.id}>
                      <summary>
                        <div>
                          <span>{group?.name ?? 'No Workshop Group'} · {source.contributorName}</span>
                          <strong>{idea.title}</strong>
                        </div>
                        <b>{stageLabel(idea.stage)} · Score {priorityScore(idea)}</b>
                      </summary>
                      <div className="project-disclosure-content">
                        <div className="project-source-grid">
                          <div><span>Workshop Group</span><strong>{group?.name ?? 'No Workshop Group'}</strong></div>
                          <div><span>Person / member</span><strong>{source.contributorName}</strong></div>
                          <div><span>Original task</span><strong>{source.sourceTask || idea.pain}</strong></div>
                          <div><span>Ultimately improves</span><strong>{source.sourceImprovement || 'Not entered'}</strong></div>
                          <div><span>Idea</span><strong>{idea.title}</strong></div>
                          <div><span>Copilot stage</span><strong>{stageLabel(idea.stage)}</strong></div>
                          <div><span>Current pain</span><strong>{idea.pain}</strong></div>
                          <div><span>Difficult, slow or inconsistent today</span><strong>{idea.difficulty || 'Not entered'}</strong></div>
                          <div><span>Copilot opportunity</span><strong>{idea.opportunity}</strong></div>
                          <div><span>Ideal outcome or improvement</span><strong>{idea.idealOutcome || 'Not entered'}</strong></div>
                          <div><span>Expected benefit</span><strong>{idea.benefit}</strong></div>
                          <div><span>Concerns / controls</span><strong>{idea.concerns}</strong></div>
                          {idea.supportingContext && <div><span>Supporting contributors / merged evidence</span><strong>{idea.supportingContext}</strong></div>}
                          <div><span>Impact / ease</span><strong>{idea.impact} / {idea.ease}</strong></div>
                          <div><span>Risk / readiness</span><strong>{idea.risk} / {idea.readiness}</strong></div>
                        </div>
                        <details className="project-readiness project-idea-canvas">
                          <summary>Linked idea solution design · {ideaDesignCompletion(idea).completed}/{ideaDesignCompletion(idea).total} core questions</summary>
                          <div className="project-source-grid project-idea-grid">
                            <div><span>Ideal AI interaction</span><strong>{idea.idealInteraction || 'Not entered'}</strong></div>
                            <div><span>Integration needed</span><strong>{idea.integrationNeed || 'Not entered'}</strong></div>
                            <div><span>Apps, systems or data sources</span><strong>{idea.integrationSystems || 'Not entered'}</strong></div>
                            <div><span>Who could use this</span><strong>{idea.userScopes?.join(', ') || 'Not entered'}</strong></div>
                            <div><span>Main users / beneficiaries</span><strong>{idea.mainUsers || 'Not entered'}</strong></div>
                            <div><span>Information or data needed</span><strong>{idea.informationNeeded || 'Not entered'}</strong></div>
                            <div><span>AI output or action</span><strong>{idea.aiOutput || 'Not entered'}</strong></div>
                            <div><span>Usage frequency</span><strong>{idea.usageFrequency || 'Not entered'}{idea.usageContext ? ` — ${idea.usageContext}` : ''}</strong></div>
                            <div><span>Human review / approval</span><strong>{idea.humanReview || 'Not entered'}</strong></div>
                            <div><span>Success criteria</span><strong>{idea.successCriteria || 'Not entered'}</strong></div>
                            <div><span>Constraints / dependencies</span><strong>{idea.constraints || 'Not entered'}</strong></div>
                          </div>
                        </details>
                        {relatedTask ? (
                          <>
                            <div className="form-grid project-fields">
                              <label>
                                Project action
                                <textarea onChange={(event) => updateTask(relatedTask.id, { action: event.target.value })} value={relatedTask.action} />
                              </label>
                              <label>
                                Project owner
                                <TeamMemberSelect
                                  ariaLabel={`${idea.title} project owner`}
                                  names={attendees.map((item) => item.name)}
                                  onChange={(owner) => updateTask(relatedTask.id, { owner })}
                                  value={relatedTask.owner}
                                />
                              </label>
                              <label>
                                Target timing
                                <input onChange={(event) => updateTask(relatedTask.id, { dueDate: event.target.value })} value={relatedTask.dueDate} />
                              </label>
                              <label>
                                Success measure
                                <textarea onChange={(event) => updateTask(relatedTask.id, { measure: event.target.value })} value={relatedTask.measure} />
                              </label>
                            </div>
                            <details className="project-readiness">
                              <summary>Project Readiness / Agent Governance</summary>
                              <div className="project-readiness-fields">
                                <label>
                                  Will the agent integrate with or access sensitive data?
                                  <select
                                    onChange={(event) => updateTask(relatedTask.id, { sensitiveDataAccess: event.target.value as 'Yes' | 'No' })}
                                    value={relatedTask.sensitiveDataAccess ?? 'No'}
                                  >
                                    <option>No</option>
                                    <option>Yes</option>
                                  </select>
                                </label>
                                {(relatedTask.sensitiveDataAccess ?? 'No') === 'Yes' && (
                                  <label>
                                    Provide more detail about the sensitive data and access required.
                                    <textarea
                                      onChange={(event) => updateTask(relatedTask.id, { sensitiveDataDetails: event.target.value })}
                                      placeholder="Required when sensitive data access is Yes"
                                      required
                                      value={relatedTask.sensitiveDataDetails ?? ''}
                                    />
                                  </label>
                                )}
                                <label>
                                  How will we protect our data from being exposed?
                                  <textarea onChange={(event) => updateTask(relatedTask.id, { dataProtection: event.target.value })} value={relatedTask.dataProtection ?? ''} />
                                </label>
                                <label>
                                  How will we govern how the agent is built?
                                  <textarea onChange={(event) => updateTask(relatedTask.id, { buildGovernance: event.target.value })} value={relatedTask.buildGovernance ?? relatedTask.governance} />
                                </label>
                                <label>
                                  How will we monitor adoption and measure the agent's benefits?
                                  <textarea onChange={(event) => updateTask(relatedTask.id, { adoptionMonitoring: event.target.value })} value={relatedTask.adoptionMonitoring ?? ''} />
                                </label>
                                <label>
                                  What is the lead time to create a functional working demo/pilot?
                                  <input onChange={(event) => updateTask(relatedTask.id, { leadTime: event.target.value })} placeholder="For example: 2 weeks, subject to data access" value={relatedTask.leadTime ?? ''} />
                                </label>
                              </div>
                            </details>
                          </>
                        ) : (
                          <div className="empty-state">Creating the linked project record...</div>
                        )}
                      </div>
                    </details>
                  )
                })}
                {priorityProjectIdeas.length === 0 && (
                  <div className="empty-state">Select workshop-wide Top 5 ideas in Prioritise to create active projects automatically.</div>
                )}
              </div>
            </Panel>
          </section>
        )}

        {activeView === 'Managed Service' && (
          <section className="view">
            <div className="managed-hero">
              <div>
                <p className="eyebrow">Ongoing adoption service</p>
                <h2>Microsoft Copilot Managed Service</h2>
                <p>
                  Move beyond a one-day art-of-the-possible session into a structured quarterly adoption programme. Each revisit keeps your
                  teams focused on business outcomes, refreshes the idea pipeline, measures progress and moves the right use
                  cases through the five Copilot strands at the right pace.
                </p>
              </div>
              <div className="managed-hero-card">
                <span>Recommended cadence</span>
                <strong>1 day every quarter</strong>
                <p>Supported by a light monthly steering call in the recommended managed-service tier.</p>
                <button className="primary accent" onClick={downloadManagedServiceReportPdf} type="button">
                  <Download size={16} /> Managed Service PDF
                </button>
              </div>
            </div>

            <div className="metric-grid service-metrics">
              <Metric icon={<ClipboardList />} label="Quarterly days" value={managedServiceQuarters.length} />
              <Metric icon={<Users />} label="Champion groups" value={groups.length} />
              <Metric icon={<Lightbulb />} label="Idea backlog" value={ideas.length} />
              <Metric icon={<Target />} label="Priority projects" value={activeProjectTasks.length} />
              <Metric icon={<Download />} label="Reports per year" value={5} />
            </div>

            <div className="two-column">
              <Panel title="Your quarterly adoption rhythm">
                <div className="service-delivery-list">
                  <div>
                    <b>1</b>
                    <strong>Quarterly onsite adoption day</strong>
                    <span>A focused day to review progress, refresh priorities, support champions and agree the next quarter’s Copilot adoption focus.</span>
                  </div>
                  <div>
                    <b>2</b>
                    <strong>Monthly steering check-in</strong>
                    <span>A short session to keep momentum visible, review blockers and ensure the agreed priorities remain on track.</span>
                  </div>
                  <div>
                    <b>3</b>
                    <strong>Living adoption record</strong>
                    <span>Your goals, current tasks, ideas, priorities, recommendations, scorecard movement and quarterly outcomes stay in one place.</span>
                  </div>
                  <div>
                    <b>4</b>
                    <strong>Measured maturity progression</strong>
                    <span>Progress from Copilot Web and Microsoft 365 apps into agents, Copilot Studio and GitHub Copilot only where the value is clear.</span>
                  </div>
                </div>
              </Panel>

              <Panel title="What you receive">
                <div className="commercial-focus">
                  <div>
                    <strong>Ongoing accountability</strong>
                    <span>A quarterly rhythm that turns Copilot adoption into a continual improvement programme rather than a one-off training day.</span>
                  </div>
                  <div>
                    <strong>Measurable progress</strong>
                    <span>Each revisit updates adoption scores, confidence, priority ideas, active recommendations and business-value evidence.</span>
                  </div>
                  <div>
                    <strong>Practical outputs</strong>
                    <span>Prompt packs, workflow playbooks, champion notes, agent briefs and executive-ready progress reports.</span>
                  </div>
                </div>
              </Panel>
            </div>

            <Panel title="12-month project delivery roadmap">
              <div className="quarterly-roadmap">
                {managedServiceQuarters.map((quarter) => (
                  <article className="quarter-card" key={quarter.id}>
                    <div>
                      <span>{quarter.name}</span>
                      <h3>{quarter.theme}</h3>
                      <p>{quarter.dayFormat}</p>
                    </div>
                    <p>{quarter.focus}</p>
                    <div className="quarter-card-grid">
                      <div>
                        <strong>Outcomes</strong>
                        {quarter.outcomes.map((outcome) => (
                          <small key={outcome}>{outcome}</small>
                        ))}
                      </div>
                      <div>
                        <strong>Deliverables</strong>
                        {quarter.deliverables.map((deliverable) => (
                          <small key={deliverable}>{deliverable}</small>
                        ))}
                      </div>
                    </div>
                    <div className="managed-project-list">
                      <strong>Projects pulled through this quarter</strong>
                      {activeProjectTasks.map((task) => {
                        const group = groups.find((item) => item.id === task.groupId)
                        const idea = ideas.find((item) => item.id === task.ideaId)
                        const quarterAction = managedQuarterProjectAction(task, quarter.id)
                        return (
                          <div className="managed-project-item" key={`${quarter.id}-${task.id}`}>
                            <span>{group?.department ?? 'No group'} · {stageLabel(task.copilotStage)}</span>
                            <h4>{idea?.title ?? task.action}</h4>
                            <p>{quarterAction.title}</p>
                            <small>{quarterAction.detail}</small>
                          </div>
                        )
                      })}
                      {activeProjectTasks.length === 0 && (
                        <small>No project recommendations yet. Mark ideas as Priority and add them to Projects first.</small>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </Panel>

            <Panel title="Quarterly measurement: Microsoft Adoption Score plus workshop outcomes">
              <div className="adoption-score-intro">
                <div>
                  <span>Measurement layer</span>
                  <h3>Track real Microsoft 365 and Copilot adoption improvement</h3>
                  <p>
                    Each quarterly revisit combines your workshop priorities with Microsoft 365 Admin Center Adoption Score
                    signals, showing whether Microsoft 365 and Copilot are becoming part of day-to-day working habits.
                  </p>
                </div>
                <div>
                  <strong>{adoptionScoreTotals.current}</strong>
                  <span>Current tracked score · {adoptionScoreTotals.totalImprovement >= 0 ? '+' : ''}{adoptionScoreTotals.totalImprovement} from baseline</span>
                </div>
              </div>
              <div className="adoption-score-summary">
                <div><span>Baseline total</span><strong>{adoptionScoreTotals.baseline}</strong></div>
                <div><span>Previous revisit</span><strong>{adoptionScoreTotals.previous}</strong></div>
                <div><span>Current total</span><strong>{adoptionScoreTotals.current}</strong></div>
                <div><span>Quarter movement</span><strong>{adoptionScoreTotals.quarterMovement >= 0 ? '+' : ''}{adoptionScoreTotals.quarterMovement}</strong></div>
                <div><span>Gap to target</span><strong>{adoptionScoreTotals.gapToTarget}</strong></div>
              </div>
              <div className="adoption-score-tracker">
                <div className="adoption-score-row header">
                  <span>Pillar</span>
                  <span>Baseline</span>
                  <span>Previous</span>
                  <span>Current</span>
                  <span>Target</span>
                  <span>Improvement</span>
                  <span>Notes</span>
                </div>
                {adoptionScoreTracking.map((score) => {
                  const pillar = adoptionScorePillars.find((item) => item.name === score.pillar)
                  const improvement = score.current - score.baseline
                  const movement = score.current - score.previous
                  return (
                    <div className="adoption-score-row" key={score.pillar}>
                      <div>
                        <strong>{score.pillar}</strong>
                        <small>{pillar?.whatItTracks}</small>
                      </div>
                      <input
                        min={0}
                        max={600}
                        onChange={(event) => updateAdoptionScore(score.pillar, { baseline: Number(event.target.value) })}
                        type="number"
                        value={score.baseline}
                      />
                      <input
                        min={0}
                        max={600}
                        onChange={(event) => updateAdoptionScore(score.pillar, { previous: Number(event.target.value) })}
                        type="number"
                        value={score.previous}
                      />
                      <input
                        min={0}
                        max={600}
                        onChange={(event) => updateAdoptionScore(score.pillar, { current: Number(event.target.value) })}
                        type="number"
                        value={score.current}
                      />
                      <input
                        min={0}
                        max={600}
                        onChange={(event) => updateAdoptionScore(score.pillar, { target: Number(event.target.value) })}
                        type="number"
                        value={score.target}
                      />
                      <div className={improvement >= 0 ? 'score-movement positive' : 'score-movement negative'}>
                        <strong>{improvement >= 0 ? '+' : ''}{improvement}</strong>
                        <small>{movement >= 0 ? '+' : ''}{movement} this revisit</small>
                      </div>
                      <textarea
                        onChange={(event) => updateAdoptionScore(score.pillar, { notes: event.target.value })}
                        value={score.notes}
                      />
                    </div>
                  )
                })}
              </div>
            </Panel>

            <Panel title="Your quarterly service day format">
              <div className="managed-agenda">
                {[
                  ['10:00', 'Executive sponsor review', 'Review business goals, adoption score movement and what has changed since the last session.'],
                  ['10:45', 'Staff adoption review', 'Speak with staff about how they are using Copilot, agents or workflows, what is working, what is not and where they need help.'],
                  ['11:30', 'Tips, tricks and market update', 'Share practical Copilot tips, prompt examples, better ways of working and anything new in the market that Unleashed believes could benefit the business.'],
                  ['12:30', 'Lunch', 'Keep the informal conversations flowing.'],
                  ['13:30', 'Build/development lab', 'Build, improve or extend agents, workflows, Copilot Studio ideas, GitHub Copilot work or new opportunities from the project roadmap.'],
                  ['15:00', 'Project roadmap and governance', 'Confirm owners, measures, data considerations, rollout decisions, new market opportunities to add and next-quarter priorities.'],
                  ['15:45', 'Executive playback', 'Close with progress, recommendations, business impact and next steps.'],
                ].map(([time, titleValue, detail]) => (
                  <div key={time}>
                    <b>{time}</b>
                    <strong>{titleValue}</strong>
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        )}

        {activeView === 'Export' && (
          <section className="view">
            <Panel title="Workshop output summary">
              <textarea className="summary" readOnly value={buildSummary()} />
              <div className="export-actions">
                <button className="primary accent" onClick={downloadFullReportPdf} type="button">
                  <Download size={18} />
                  Full report PDF
                </button>
                <button className="primary accent" onClick={downloadProjectsReportPdf} type="button">
                  <Download size={18} />
                  Projects PDF
                </button>
                <button className="primary accent" onClick={downloadManagedServiceReportPdf} type="button">
                  <Download size={18} />
                  Managed Service PDF
                </button>
                <button className="primary" onClick={downloadSummary} type="button">
                  <Download size={18} />
                  Download working summary TXT
                </button>
              </div>
            </Panel>
          </section>
        )}
      </main>
    </div>
  )
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="metric">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function IdeaMini({ idea }: { idea: Idea }) {
  const score = priorityScore(idea)
  return (
    <div className="mini-card">
      <div>
        <strong>{idea.title}</strong>
        <span>{idea.stage}</span>
      </div>
      <b>{score}</b>
    </div>
  )
}

function IdeaEditor({
  idea,
  groupMembers,
  sourceTask,
  sourceImprovement,
  contributorName,
  onChange,
  onDelete,
  onMoveDown,
  onMoveUp,
}: {
  idea: Idea
  groupMembers: Attendee[]
  sourceTask: string
  sourceImprovement: string
  contributorName: string
  onChange: (patch: Partial<Idea>) => void
  onDelete: () => void
  onMoveDown: () => void
  onMoveUp: () => void
}) {
  const completion = ideaDesignCompletion(idea)
  const toggleScope = (scope: IdeaUserScope, checked: boolean) => {
    const current = idea.userScopes ?? []
    onChange({ userScopes: checked ? [...current, scope] : current.filter((item) => item !== scope) })
  }

  return (
    <article className="idea-card">
      <details className="idea-source-editor">
        <summary>
          <div>
            <strong>{contributorName}</strong>
            <span>{sourceTask || 'No source task entered'}</span>
            <small>Ultimately improves: {sourceImprovement || 'No intended improvement entered'}</small>
          </div>
          <b>Edit source</b>
        </summary>
        <div className="idea-source-fields">
          <label>
            Contributor
            <select
              onChange={(event) => onChange({ attendeeId: event.target.value ? Number(event.target.value) : undefined })}
              value={idea.attendeeId ?? ''}
            >
              <option value="">Select contributor</option>
              {!groupMembers.some((attendee) => attendee.id === idea.attendeeId) && idea.attendeeId && (
                <option value={idea.attendeeId}>{contributorName} (current)</option>
              )}
              {groupMembers.map((attendee) => (
                <option key={attendee.id} value={attendee.id}>{attendee.name}</option>
              ))}
            </select>
          </label>
          <label>
            Source task / pain
            <textarea
              onChange={(event) => onChange({ sourceTask: event.target.value })}
              value={sourceTask}
            />
          </label>
          <label>
            Ultimately improves / intended improvement
            <textarea
              onChange={(event) => onChange({ sourceImprovement: event.target.value })}
              value={sourceImprovement}
            />
          </label>
          <small>These values apply to this idea only. The original Workshop Group member task remains unchanged.</small>
        </div>
      </details>
      {idea.supportingContext && (
        <div className="idea-supporting-context">
          <strong>Supporting contributors / merged evidence</strong>
          <span>{idea.supportingContext}</span>
        </div>
      )}
      <div className="idea-card-header">
        <input onChange={(event) => onChange({ title: event.target.value })} value={idea.title} />
        <div className="idea-actions">
          <span className="idea-completion">{completion.completed} of {completion.total} core questions</span>
          <span className={`tag ${idea.status.replaceAll(' ', '-').toLowerCase()}`}>
            {idea.isTopIdea ? 'Top 5' : idea.status}
          </span>
          <button className="icon-button" onClick={onMoveUp} title="Move idea up" type="button">
            <ArrowUp size={16} />
          </button>
          <button className="icon-button" onClick={onMoveDown} title="Move idea down" type="button">
            <ArrowDown size={16} />
          </button>
          <button className="icon-button danger" onClick={onDelete} title={`Delete ${idea.title}`} type="button">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="idea-design-sections">
        <details className="idea-design-section">
          <summary>
            <strong>Current task & AI opportunity</strong>
            <span>Process, difficulty, Copilot idea and ideal outcome</span>
          </summary>
          <div className="idea-design-content">
            <div className="form-grid">
              <label>
                Current task or process / pain
                <textarea onChange={(event) => onChange({ pain: event.target.value })} value={idea.pain} />
              </label>
              <label>
                What is difficult, slow or inconsistent today?
                <textarea onChange={(event) => onChange({ difficulty: event.target.value })} value={idea.difficulty ?? ''} />
              </label>
              <label>
                AI/Copilot idea: how could AI help?
                <textarea onChange={(event) => onChange({ opportunity: event.target.value })} value={idea.opportunity} />
              </label>
              <label>
                Ideal outcome or improvement
                <textarea onChange={(event) => onChange({ idealOutcome: event.target.value })} value={idea.idealOutcome ?? ''} />
              </label>
            </div>
          </div>
        </details>

        <details className="idea-design-section">
          <summary>
            <strong>Information, systems & users</strong>
            <span>Evidence inputs, dependencies and likely beneficiaries</span>
          </summary>
          <div className="idea-design-content">
            <label>
              Information/data needed and where it comes from
              <textarea onChange={(event) => onChange({ informationNeeded: event.target.value })} value={idea.informationNeeded ?? ''} />
            </label>
            <div className="form-grid">
              <label>
                Apps/systems involved or integration dependency
                <select
                  onChange={(event) => onChange({ integrationNeed: event.target.value as Idea['integrationNeed'] })}
                  value={idea.integrationNeed ?? ''}
                >
                  <option value="">Select an answer</option>
                  <option>Yes</option>
                  <option>No</option>
                  <option>Not sure</option>
                </select>
              </label>
              {(idea.integrationNeed === 'Yes' || idea.integrationNeed === 'Not sure') && (
                <label>
                  Which apps, systems or data sources?
                  <textarea onChange={(event) => onChange({ integrationSystems: event.target.value })} value={idea.integrationSystems ?? ''} />
                </label>
              )}
            </div>
            <fieldset className="scope-selector">
              <legend>Who would use or benefit from it / likely scope?</legend>
              <div>
                {ideaUserScopes.map((scope) => (
                  <label key={scope}>
                    <input
                      checked={(idea.userScopes ?? []).includes(scope)}
                      onChange={(event) => toggleScope(scope, event.target.checked)}
                      type="checkbox"
                    />
                    {scope}
                  </label>
                ))}
              </div>
            </fieldset>
            <label>
              Main users or beneficiaries
              <input onChange={(event) => onChange({ mainUsers: event.target.value })} value={idea.mainUsers ?? ''} />
            </label>
          </div>
        </details>

        <details className="idea-design-section">
          <summary>
            <strong>Value, controls & recommended stage</strong>
            <span>Expected benefit, safeguards and Copilot route</span>
          </summary>
          <div className="idea-design-content">
            <div className="form-grid">
              <label>
                Expected benefit or time/value gain
                <textarea onChange={(event) => onChange({ benefit: event.target.value })} value={idea.benefit} />
              </label>
              <label>
                Recommended Copilot stage
                <select onChange={(event) => onChange({ stage: event.target.value as Stage })} value={idea.stage}>
                  {stages.map((stage) => (
                    <option key={stage}>{stage}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Risks, controls, human review or dependencies
              <textarea onChange={(event) => onChange({ concerns: event.target.value })} value={idea.concerns} />
            </label>
          </div>
        </details>

        <details className="idea-design-section idea-advanced-section">
          <summary>
            <strong>Optional advanced delivery detail</strong>
            <span>Workflow, outputs, frequency, review and measures</span>
          </summary>
          <div className="idea-design-content">
            <label>
              In an ideal scenario, how would you interact with AI to solve this problem?
              <textarea
                onChange={(event) => onChange({ idealInteraction: event.target.value })}
                placeholder="Describe the user journey, conversation or workflow."
                value={idea.idealInteraction ?? ''}
              />
            </label>
            <div className="form-grid">
              <label>
                What should the AI produce or do?
                <textarea onChange={(event) => onChange({ aiOutput: event.target.value })} value={idea.aiOutput ?? ''} />
              </label>
              <label>
                How often would this be used?
                <select
                  onChange={(event) => onChange({ usageFrequency: event.target.value as IdeaUsageFrequency | '' })}
                  value={idea.usageFrequency ?? ''}
                >
                  <option value="">Select a frequency</option>
                  {ideaUsageFrequencies.map((frequency) => <option key={frequency}>{frequency}</option>)}
                </select>
              </label>
              <label>
                Usage volume or context
                <input onChange={(event) => onChange({ usageContext: event.target.value })} value={idea.usageContext ?? ''} />
              </label>
              <label>
                Where is human review or approval required?
                <textarea onChange={(event) => onChange({ humanReview: event.target.value })} value={idea.humanReview ?? ''} />
              </label>
              <label>
                How would we know this idea is successful?
                <textarea onChange={(event) => onChange({ successCriteria: event.target.value })} value={idea.successCriteria ?? ''} />
              </label>
              <label>
                What could prevent this from working?
                <textarea onChange={(event) => onChange({ constraints: event.target.value })} value={idea.constraints ?? ''} />
              </label>
            </div>
          </div>
        </details>
      </div>
    </article>
  )
}

function Score({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <select className="score-select" onChange={(event) => onChange(Number(event.target.value))} value={value}>
      {[1, 2, 3, 4, 5].map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

function TeamMemberSelect({
  names,
  value,
  onChange,
  ariaLabel,
}: {
  names: string[]
  value: string
  onChange: (value: string) => void
  ariaLabel: string
}) {
  const options = [...new Set(names.filter((name) => name.trim()))]
  const hasCurrentValue = !value || options.includes(value)

  return (
    <select aria-label={ariaLabel} onChange={(event) => onChange(event.target.value)} value={value}>
      <option value="">Unassigned</option>
      {!hasCurrentValue && <option value={value}>{value} (current)</option>}
      {options.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  )
}

function DepartmentGoalMap({
  attendees,
  companyGoal,
  departments,
  onUpdateCompanyGoal,
  onAddDepartment,
  onUpdateDepartment,
  onRemoveDepartment,
}: {
  attendees: Attendee[]
  companyGoal?: ObjectiveNode
  departments: Department[]
  onUpdateCompanyGoal: (patch: Partial<ObjectiveNode>) => void
  onAddDepartment: () => void
  onUpdateDepartment: (id: number, patch: Partial<Department>) => void
  onRemoveDepartment: (id: number) => void
}) {
  return (
    <Panel title="Current company goal and department context">
      <div className="company-goal-card">
        <div>
          <p className="eyebrow">Business goal</p>
          <input
            onChange={(event) => onUpdateCompanyGoal({ title: event.target.value })}
            value={companyGoal?.title ?? 'Company goal'}
          />
        </div>
        <div className="goal-stats">
          <div>
            <b>{departments.length}</b>
            <span>departments</span>
          </div>
        </div>
      </div>

      <div className="section-actions inline">
        <h2>Departments</h2>
        <button className="primary" onClick={onAddDepartment} type="button">
          <Plus size={16} /> Add department
        </button>
      </div>

      <div className="department-map">
        {departments.map((department) => {
          const departmentName = department.name.trim().toLocaleLowerCase()
          const members = attendees.filter((attendee) => attendee.team.trim().toLocaleLowerCase() === departmentName)
          const memberNames = members.map((member) => member.name)
          return (
            <article className="department-card" key={department.id}>
              <div className="department-header">
                <div className="department-title-editor">
                  <input onChange={(event) => onUpdateDepartment(department.id, { name: event.target.value })} value={department.name} />
                  <span>{members.length} {members.length === 1 ? 'person' : 'people'}</span>
                </div>
                <button
                  className="icon-button danger"
                  disabled={departments.length <= 1}
                  onClick={() => onRemoveDepartment(department.id)}
                  title="Remove department"
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="department-members">
                <strong>Team members</strong>
                {members.length > 0 ? (
                  <div className="department-member-names" aria-label={`${department.name} team members`}>
                    {members.map((member) => (
                      <span key={member.id}>{member.name}</span>
                    ))}
                  </div>
                ) : (
                  <span className="department-members-empty">No team members assigned</span>
                )}
              </div>
              <div className="department-fields">
                <label>
                  Department lead
                  <TeamMemberSelect
                    ariaLabel={`${department.name} department lead`}
                    names={memberNames}
                    onChange={(lead) => onUpdateDepartment(department.id, { lead })}
                    value={department.lead}
                  />
                </label>
                <label>
                  Champion
                  <TeamMemberSelect
                    ariaLabel={`${department.name} champion`}
                    names={memberNames}
                    onChange={(champion) => onUpdateDepartment(department.id, { champion })}
                    value={department.champion}
                  />
                </label>
                <label className="wide">
                  Department focus
                  <textarea onChange={(event) => onUpdateDepartment(department.id, { focus: event.target.value })} value={department.focus} />
                </label>
                <label className="wide">
                  Department Business Objective
                  <small>How this department will contribute to the overall business goal.</small>
                  <textarea
                    onChange={(event) => onUpdateDepartment(department.id, { businessObjective: event.target.value })}
                    value={department.businessObjective ?? ''}
                  />
                </label>
              </div>
            </article>
          )
        })}
      </div>
    </Panel>
  )
}

export default App
