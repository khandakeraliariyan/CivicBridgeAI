const resourceInteractionService = require("../services/resource-interaction.service");
const { sendError } = require("../utils/http-error");

async function createResourceInteraction(req, res) {
  try {
    const data = await resourceInteractionService.createInteraction(
      req.params.caseId,
      req.dbUser.id,
      req.body,
    );

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    return sendError(res, error, "Unable to track the resource right now.");
  }
}

async function listResourceInteractions(req, res) {
  try {
    const data = await resourceInteractionService.listInteractions(
      req.params.caseId,
      req.dbUser.id,
    );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    return sendError(res, error, "Unable to load tracked resources right now.");
  }
}

async function updateResourceInteraction(req, res) {
  try {
    const data = await resourceInteractionService.updateInteraction(
      req.params.interactionId,
      req.dbUser.id,
      req.body,
    );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    return sendError(res, error, "Unable to update the tracked resource right now.");
  }
}

module.exports = {
  createResourceInteraction,
  listResourceInteractions,
  updateResourceInteraction,
};
