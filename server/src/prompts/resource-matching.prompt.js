const buildResourcePrompt = (situation, analysis, resources) => `
You are a civic resource matching AI.

Situation:
${situation}

Analysis:
${JSON.stringify(analysis)}

Available Resources:
${JSON.stringify(resources)}

Match the most relevant resources for this exact case.

Rules:
- Prefer resources that directly address the user's most urgent blockers.
- Use stabilizing and destabilizing details from the situation, not only the risk labels.
- Recommend the most actionable resources first.
- Avoid weak matches just to fill the list.
- Return 3 to 5 resources when possible.

Return ONLY JSON.

{
  "resources":[
    {
      "title":"",
      "reason":"",
      "priority":"LOW|MEDIUM|HIGH"
    }
  ]
}
`;

module.exports = {
    buildResourcePrompt,
};
