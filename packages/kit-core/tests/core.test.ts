import { describe, expect, it } from 'vitest';
import { allocateSchedule, findUncoveredRequirements, validateKit, type Question, type Requirement } from '../src';

const requirements: Requirement[] = [
  { id: 'r1', text: 'React', kind: 'technical', priority: 'must' },
  { id: 'r2', text: 'Mentoring', kind: 'behavioural', priority: 'must' },
  { id: 'r3', text: 'Healthcare', kind: 'domain', priority: 'nice' }
];
const questions: Question[] = [
  { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'React?', answer_outline: 'Example', difficulty: 3 },
  { id: 'q2', requirement_ids: ['r2'], category: 'behavioural', prompt: 'Mentor?', answer_outline: 'Example', difficulty: 2 }
];

describe('coverage', () => {
  it('finds only uncovered must requirements', () => expect(findUncoveredRequirements(requirements, questions)).toEqual([]));
  it('finds one and multiple gaps', () => expect(findUncoveredRequirements(requirements.slice(0, 2), [questions[0]])).toEqual(['r2']));
  it('ignores invalid question references', () => expect(findUncoveredRequirements(requirements, [{ ...questions[0], requirement_ids: ['unknown'] }])).toEqual(['r1', 'r2']));
});

describe('schedule', () => {
  it.each([1, 2, 5, 60])('returns exactly %s days', (days) => expect(allocateSchedule(requirements, questions, days)).toHaveLength(days));
  it('keeps harder must-have material in the earliest bucket', () => expect(allocateSchedule(requirements, questions, 2)[0].question_ids).toContain('q1'));
});

describe('kit validation', () => {
  it('rejects a schedule with an unknown question', () => {
    const kit = { source: { company: '', company_url: '', role: '', location: '', jd_chars: 0, researched_at: '', pages_used: [] }, company_brief: { summary: '', what_they_do: '', sources: [] }, role: { title: '', seniority: '', responsibilities: [], requirements }, questions, flashcards: [], schedule: { days_available: 1, days: [{ day: 1, focus: '', question_ids: ['q404'], minutes: 30 }] }, coverage: { uncovered_requirement_ids: [], passes: 1 } };
    expect(validateKit(kit).success).toBe(false);
  });
});
