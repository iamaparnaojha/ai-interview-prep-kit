import type { Question, Requirement } from './types';

export function findUncoveredRequirements(requirements: Requirement[], questions: Question[]): string[] {
  const validIds = new Set(requirements.map((requirement) => requirement.id));
  const covered = new Set(questions.flatMap((question) => question.requirement_ids).filter((id) => validIds.has(id)));
  return requirements.filter((requirement) => requirement.priority === 'must' && !covered.has(requirement.id)).map((requirement) => requirement.id);
}
