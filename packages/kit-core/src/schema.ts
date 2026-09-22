import { z } from 'zod';
import { categories, priorities, requirementKinds } from './types';

const requirementSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
  kind: z.enum(requirementKinds),
  priority: z.enum(priorities)
});

const questionSchema = z.object({
  id: z.string().min(1),
  requirement_ids: z.array(z.string()),
  category: z.enum(categories),
  prompt: z.string(),
  answer_outline: z.string(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  state: z.enum(['generated', 'edited', 'pinned']).optional()
});

const flashcardSchema = z.object({
  id: z.string().min(1),
  front: z.string(),
  back: z.string(),
  requirement_ids: z.array(z.string()),
  state: z.enum(['generated', 'edited', 'pinned']).optional()
});

export const kitSchema = z.object({
  source: z.object({
    company: z.string(), company_url: z.string(), role: z.string(), location: z.string(),
    jd_chars: z.number().int().nonnegative(), researched_at: z.string(), pages_used: z.array(z.string())
  }),
  company_brief: z.object({ summary: z.string(), what_they_do: z.string(), sources: z.array(z.string()) }),
  role: z.object({ title: z.string(), seniority: z.string(), responsibilities: z.array(z.string()), requirements: z.array(requirementSchema) }),
  questions: z.array(questionSchema),
  flashcards: z.array(flashcardSchema),
  schedule: z.object({
    days_available: z.number().int().min(1).max(60),
    days: z.array(z.object({ day: z.number().int(), focus: z.string(), question_ids: z.array(z.string()), minutes: z.number().int().nonnegative() }))
  }),
  coverage: z.object({ uncovered_requirement_ids: z.array(z.string()), passes: z.number().int().nonnegative() })
});

export function validateKit(value: unknown, requestedDays?: number) {
  const parsed = kitSchema.safeParse(value);
  if (!parsed.success) return parsed;
  const kit = parsed.data;
  const requirements = new Set(kit.role.requirements.map((item) => item.id));
  const questions = new Set(kit.questions.map((item) => item.id));
  const referencedRequirements = kit.questions.flatMap((item) => item.requirement_ids);
  if (referencedRequirements.some((id) => !requirements.has(id))) return { success: false as const, error: new Error('Question references an unknown requirement') };
  if (kit.schedule.days.some((day) => day.day < 1 || day.day > kit.schedule.days_available || day.question_ids.some((id) => !questions.has(id)))) return { success: false as const, error: new Error('Schedule contains an invalid day or question reference') };
  if (kit.schedule.days.length !== kit.schedule.days_available) return { success: false as const, error: new Error('Schedule day count does not match days_available') };
  if (requestedDays !== undefined && requestedDays !== kit.schedule.days_available) return { success: false as const, error: new Error('Schedule does not match requested days') };
  return parsed;
}
