"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kitSchema = void 0;
exports.validateKit = validateKit;
const zod_1 = require("zod");
const types_1 = require("./types");
const requirementSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    text: zod_1.z.string(),
    kind: zod_1.z.enum(types_1.requirementKinds),
    priority: zod_1.z.enum(types_1.priorities)
});
const questionSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    requirement_ids: zod_1.z.array(zod_1.z.string()),
    category: zod_1.z.enum(types_1.categories),
    prompt: zod_1.z.string(),
    answer_outline: zod_1.z.string(),
    difficulty: zod_1.z.union([zod_1.z.literal(1), zod_1.z.literal(2), zod_1.z.literal(3)]),
    state: zod_1.z.enum(['generated', 'edited', 'pinned']).optional()
});
const flashcardSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    front: zod_1.z.string(),
    back: zod_1.z.string(),
    requirement_ids: zod_1.z.array(zod_1.z.string()),
    state: zod_1.z.enum(['generated', 'edited', 'pinned']).optional()
});
exports.kitSchema = zod_1.z.object({
    source: zod_1.z.object({
        company: zod_1.z.string(), company_url: zod_1.z.string(), role: zod_1.z.string(), location: zod_1.z.string(),
        jd_chars: zod_1.z.number().int().nonnegative(), researched_at: zod_1.z.string(), pages_used: zod_1.z.array(zod_1.z.string())
    }),
    company_brief: zod_1.z.object({ summary: zod_1.z.string(), what_they_do: zod_1.z.string(), sources: zod_1.z.array(zod_1.z.string()) }),
    role: zod_1.z.object({ title: zod_1.z.string(), seniority: zod_1.z.string(), responsibilities: zod_1.z.array(zod_1.z.string()), requirements: zod_1.z.array(requirementSchema) }),
    questions: zod_1.z.array(questionSchema),
    flashcards: zod_1.z.array(flashcardSchema),
    schedule: zod_1.z.object({
        days_available: zod_1.z.number().int().min(1).max(60),
        days: zod_1.z.array(zod_1.z.object({ day: zod_1.z.number().int(), focus: zod_1.z.string(), question_ids: zod_1.z.array(zod_1.z.string()), minutes: zod_1.z.number().int().nonnegative() }))
    }),
    coverage: zod_1.z.object({ uncovered_requirement_ids: zod_1.z.array(zod_1.z.string()), passes: zod_1.z.number().int().nonnegative() })
});
function validateKit(value, requestedDays) {
    const parsed = exports.kitSchema.safeParse(value);
    if (!parsed.success)
        return parsed;
    const kit = parsed.data;
    const requirements = new Set(kit.role.requirements.map((item) => item.id));
    const questions = new Set(kit.questions.map((item) => item.id));
    const referencedRequirements = kit.questions.flatMap((item) => item.requirement_ids);
    if (referencedRequirements.some((id) => !requirements.has(id)))
        return { success: false, error: new Error('Question references an unknown requirement') };
    if (kit.schedule.days.some((day) => day.day < 1 || day.day > kit.schedule.days_available || day.question_ids.some((id) => !questions.has(id))))
        return { success: false, error: new Error('Schedule contains an invalid day or question reference') };
    if (kit.schedule.days.length !== kit.schedule.days_available)
        return { success: false, error: new Error('Schedule day count does not match days_available') };
    if (requestedDays !== undefined && requestedDays !== kit.schedule.days_available)
        return { success: false, error: new Error('Schedule does not match requested days') };
    return parsed;
}
