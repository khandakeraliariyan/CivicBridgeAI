const buildSimulationPrompt = (situation, decision) => `
You are a crisis outcome simulator.

Situation:
${situation}

Decision:
${decision}

Predict realistic consequences.

Return ONLY JSON.

{
  "housingImpact": "",
  "incomeImpact": "",
  "healthImpact": "",
  "summary": ""
}
`;

module.exports = {
    buildSimulationPrompt,
};