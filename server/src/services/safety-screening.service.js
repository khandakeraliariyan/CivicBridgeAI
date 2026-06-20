const { enableEmergencyScreening } = require("../config/features");

const RULES = [
  {
    category: "IMMEDIATE_PHYSICAL_DANGER",
    patterns: ["being attacked", "unsafe right now", "immediate danger", "violent threat"],
    message: "You may be in immediate physical danger.",
  },
  {
    category: "NO_SAFE_SHELTER",
    patterns: ["no safe shelter", "nowhere to sleep", "homeless tonight", "sleeping outside tonight"],
    message: "You may not have safe shelter for tonight.",
  },
  {
    category: "SEVERE_MEDICAL_EMERGENCY",
    patterns: ["medical emergency", "can't breathe", "severe bleeding", "chest pain"],
    message: "This sounds like a medical emergency.",
  },
  {
    category: "DOMESTIC_VIOLENCE",
    patterns: ["domestic violence", "abusive partner", "partner hit me", "unsafe at home"],
    message: "You may be dealing with domestic violence or abuse.",
  },
  {
    category: "CHILD_SAFETY_RISK",
    patterns: ["child in danger", "my child is unsafe", "children are not safe"],
    message: "A child safety concern may need urgent help.",
  },
  {
    category: "SELF_HARM_OR_SUICIDE_RISK",
    patterns: ["suicidal", "want to die", "kill myself", "self harm"],
    message: "You may need urgent mental health support right now.",
  },
  {
    category: "LOSS_OF_ESSENTIAL_MEDICATION",
    patterns: ["out of insulin", "no medication left", "can't afford medication", "essential medication"],
    message: "You may be at risk because essential medication is not available.",
  },
];

function screenSituation(situation) {
  const text = String(situation || "").toLowerCase();
  const matches = RULES.filter((rule) =>
    rule.patterns.some((pattern) => text.includes(pattern)),
  );

  return {
    isUrgent: matches.length > 0,
    categories: matches.map((rule) => rule.category),
    message: matches.length
      ? matches[0].message
      : "No urgent safety indicators were detected.",
    recommendedImmediateAction: matches.length
      ? "If you are in immediate danger or facing a medical emergency, contact local emergency services or a trusted professional right away. Civic Bridge AI is not an emergency service."
      : "You can continue with the normal assessment. If the situation becomes urgent, contact local emergency services or a trusted professional.",
    continueNormalAssessment: true,
  };
}

function getSafetyScreeningResult(situation) {
  if (!enableEmergencyScreening) {
    return {
      isUrgent: false,
      categories: [],
      message: "Emergency screening is not enabled.",
      recommendedImmediateAction:
        "If you are facing an emergency, contact local emergency services or a trusted professional.",
      continueNormalAssessment: true,
    };
  }

  return screenSituation(situation);
}

module.exports = {
  getSafetyScreeningResult,
  screenSituation,
};
