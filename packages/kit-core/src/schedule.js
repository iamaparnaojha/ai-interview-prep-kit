"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allocateSchedule = allocateSchedule;
function allocateSchedule(requirements, questions, daysAvailable) {
    if (!Number.isInteger(daysAvailable) || daysAvailable < 1 || daysAvailable > 60)
        throw new Error('daysAvailable must be an integer from 1 to 60');
    const priority = new Map(requirements.map((requirement) => [requirement.id, requirement.priority === 'must' ? 2 : 1]));
    const ordered = [...questions].sort((a, b) => {
        const aScore = Math.max(...a.requirement_ids.map((id) => priority.get(id) ?? 0), 0) * 10 + a.difficulty;
        const bScore = Math.max(...b.requirement_ids.map((id) => priority.get(id) ?? 0), 0) * 10 + b.difficulty;
        return bScore - aScore || a.id.localeCompare(b.id);
    });
    const buckets = Array.from({ length: daysAvailable }, () => []);
    ordered.forEach((question, index) => buckets[index % daysAvailable].push(question));
    return buckets.map((bucket, index) => ({
        day: index + 1,
        focus: bucket.length ? bucket.slice(0, 2).map((question) => question.category).join(' + ') : 'Review and reflection',
        question_ids: bucket.map((question) => question.id),
        minutes: Math.max(15, bucket.reduce((total, question) => total + question.difficulty * 15, 0))
    }));
}
