"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUncoveredRequirements = findUncoveredRequirements;
function findUncoveredRequirements(requirements, questions) {
    const validIds = new Set(requirements.map((requirement) => requirement.id));
    const covered = new Set(questions.flatMap((question) => question.requirement_ids).filter((id) => validIds.has(id)));
    return requirements.filter((requirement) => requirement.priority === 'must' && !covered.has(requirement.id)).map((requirement) => requirement.id);
}
