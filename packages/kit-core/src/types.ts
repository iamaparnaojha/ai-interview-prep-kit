export const requirementKinds = ['technical', 'behavioural', 'domain'] as const;
export const priorities = ['must', 'nice'] as const;
export const categories = ['technical', 'behavioural', 'system-design', 'company-fit'] as const;

export type RequirementKind = (typeof requirementKinds)[number];
export type Priority = (typeof priorities)[number];
export type Category = (typeof categories)[number];

export interface Requirement {
  id: string;
  text: string;
  kind: RequirementKind;
  priority: Priority;
}

export interface Question {
  id: string;
  requirement_ids: string[];
  category: Category;
  prompt: string;
  answer_outline: string;
  difficulty: 1 | 2 | 3;
  state?: 'generated' | 'edited' | 'pinned';
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  requirement_ids: string[];
  state?: 'generated' | 'edited' | 'pinned';
}

export interface ScheduleDay {
  day: number;
  focus: string;
  question_ids: string[];
  minutes: number;
}

export interface Kit {
  source: {
    company: string;
    company_url: string;
    role: string;
    location: string;
    jd_chars: number;
    researched_at: string;
    pages_used: string[];
  };
  company_brief: {
    summary: string;
    what_they_do: string;
    sources: string[];
  };
  role: {
    title: string;
    seniority: string;
    responsibilities: string[];
    requirements: Requirement[];
  };
  questions: Question[];
  flashcards: Flashcard[];
  schedule: {
    days_available: number;
    days: ScheduleDay[];
  };
  coverage: {
    uncovered_requirement_ids: string[];
    passes: number;
  };
}
