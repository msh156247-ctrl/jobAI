export interface TeamRecruitment {
  id: string;
  organizationId?: string;
  organizationName?: string;
  organizationDescription?: string;
  organizationWebsite?: string;
  title: string;
  description?: string;
  leaderId?: string;
  teamType?: string;
  industry?: string;
  techStack?: string[];
  location?: string;
  locationDetail?: string;
  duration?: string;
  schedule?: string;
  totalSlots?: number;
  filledSlots?: number;
  status?: string;
  views?: number;
  applicantsCount?: number;
  bookmarksCount?: number;
  deadline?: string;
  culture?: {
    values?: string[];
    workingStyle?: string[];
    communicationStyle?: string;
    meetingFrequency?: string;
    decisionMaking?: string;
    workLifeBalance?: string;
    learningOpportunities?: string;
    feedbackCulture?: string;
  };
  benefits?: {
    salary?: string;
    equity?: boolean;
    bonus?: string;
    workFromHome?: boolean;
    flexibleHours?: boolean;
    meals?: boolean;
    snacks?: boolean;
    equipment?: boolean;
    education?: boolean;
    conferences?: boolean;
    books?: boolean;
    vacation?: string;
    sickLeave?: string;
    other?: string[];
  };
  currentProjects?: Array<{
    id: string;
    name: string;
    description?: string;
    progress?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    techStack?: string[];
    repositoryUrl?: string;
    demoUrl?: string;
  }>;
  positions?: Array<{
    id: string;
    title: string;
    description?: string;
    requiredCount?: number;
    filledCount?: number;
    requiredSkills?: string[];
    preferredSkills?: string[];
    responsibilities?: string[];
    urgency?: number;
    recruitmentReason?: string;
    expectedStartDate?: string;
    isActive?: boolean;
  }>;
}

export interface TeamApplication {
  id: string;
  teamId: string;
  positionId: string;
  applicantId: string;
  motivation?: string;
  relevantExperience?: string;
  availableTime?: string;
  portfolioLinks?: string[];
  customAnswers?: string[];
  matchScore?: number;
  matchDetails?: unknown;
  status?: string;
  evaluation?: unknown;
  evaluatedBy?: string;
  evaluatedAt?: string;
  createdAt?: string;
}

export interface WaitlistEntry {
  id: string;
  teamId: string;
  positionId: string;
  applicantId: string;
  applicantName?: string;
  matchScore?: number;
  appliedAt?: string;
  teamPriority?: number;
  positionUrgency?: number;
  status?: string;
  lastActivityAt?: string;
  expiresAt?: string;
  notified?: boolean;
  notifiedAt?: string;
  createdAt?: string;
}
