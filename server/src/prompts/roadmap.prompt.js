const buildRoadmapPrompt = (situation, analysis, priorities) => `
You are an expert crisis recovery planner.

Situation:
${situation}

Analysis:
${JSON.stringify(analysis)}

Priorities:
${JSON.stringify(priorities)}

Generate an actionable roadmap that is specific to this case, not generic.

Rules:
- Focus on the current case only.
- Prioritize practical tasks the user can realistically take.
- Assign due dates yourself based on urgency and the situation details.
- Use ISO date format for dueAt when possible.
- Start with the most urgent and dependency-sensitive actions first.
- Keep tasks concrete, short, and user-facing.
- Do not produce broad motivational advice.

Return ONLY JSON.

{
  "roadmap": [
    {
      "timeline": "TODAY",
      "task": "Apply for emergency housing support",
      "dueAt": "2026-06-20"
    },
    {
      "timeline": "THIS_WEEK",
      "task": "Submit unemployment claim",
      "dueAt": "2026-06-24"
    }
  ]
}
`;

module.exports = {
    buildRoadmapPrompt,
};
