const { enableResourceInteractions } = require("../config/features");
const caseRepository = require("../repositories/case.repository");
const resourceRepository = require("../repositories/resource.repository");
const resourceInteractionRepository = require("../repositories/resource-interaction.repository");
const { createHttpError } = require("../utils/http-error");
const { addTimelineEvent } = require("./timeline.service");

async function ensureResourceInteractionsAvailable() {
  if (!enableResourceInteractions) {
    throw createHttpError(
      503,
      "Resource interactions are disabled",
      "Tracked resources are not available yet.",
    );
  }

  const ready = await resourceInteractionRepository.isResourceInteractionsSchemaReady();
  if (!ready) {
    throw createHttpError(
      503,
      "Resource interactions schema is unavailable",
      "Tracked resources are not available yet.",
    );
  }
}

async function verifyCaseOwnership(caseId, userId) {
  const { data: caseRecord, error } = await caseRepository.getCaseByIdForUser(
    caseId,
    userId,
  );

  if (error || !caseRecord) {
    throw createHttpError(404, "Case not found");
  }

  return caseRecord;
}

async function createInteraction(caseId, userId, body) {
  await ensureResourceInteractionsAvailable();
  await verifyCaseOwnership(caseId, userId);

  const { data: resource, error: resourceError } =
    await resourceRepository.getResourceById(body.resourceId);

  if (resourceError || !resource) {
    throw createHttpError(404, "Resource not found");
  }

  const { data: existingInteraction } =
    await resourceInteractionRepository.getResourceInteractionByCaseAndResource(
      caseId,
      body.resourceId,
    );

  if (existingInteraction) {
    throw createHttpError(409, "This resource is already being tracked");
  }

  const status = body.status || "SAVED";
  const { data, error } = await resourceInteractionRepository.createResourceInteraction({
    case_id: caseId,
    resource_id: body.resourceId,
    status,
    contacted_at: status === "CONTACTED" ? new Date().toISOString() : null,
  });

  if (error) {
    throw error;
  }

  await addTimelineEvent({
    case_id: caseId,
    resource_interaction_id: data.id,
    event_type: "RESOURCE_TRACKED",
    payload: { resourceId: body.resourceId, status },
    created_by: userId,
  });

  return data;
}

async function listInteractions(caseId, userId) {
  await ensureResourceInteractionsAvailable();
  await verifyCaseOwnership(caseId, userId);

  const { data, error } =
    await resourceInteractionRepository.listResourceInteractionsByCaseId(caseId);

  if (error) {
    throw error;
  }

  return data || [];
}

async function updateInteraction(interactionId, userId, body) {
  await ensureResourceInteractionsAvailable();

  const { data: interaction, error } =
    await resourceInteractionRepository.getResourceInteractionById(interactionId);

  if (error || !interaction) {
    throw createHttpError(404, "Tracked resource not found");
  }

  await verifyCaseOwnership(interaction.case_id, userId);

  const patch = {
    updated_at: new Date().toISOString(),
  };

  if (body.status !== undefined) {
    patch.status = body.status;
    if (body.status === "CONTACTED" && !interaction.contacted_at) {
      patch.contacted_at = new Date().toISOString();
    }
  }

  if (body.followUpAt !== undefined) {
    patch.follow_up_at = body.followUpAt || null;
  }

  if (body.responseNote !== undefined) {
    patch.response_note = String(body.responseNote || "").trim() || null;
  }

  if (body.applicationReference !== undefined) {
    patch.application_reference = String(body.applicationReference || "").trim() || null;
  }

  const { data, error: updateError } =
    await resourceInteractionRepository.updateResourceInteraction(interactionId, patch);

  if (updateError) {
    throw updateError;
  }

  if (body.status !== undefined && body.status !== interaction.status) {
    await addTimelineEvent({
      case_id: interaction.case_id,
      resource_interaction_id: interactionId,
      event_type: "RESOURCE_STATUS_CHANGED",
      payload: {
        previousStatus: interaction.status,
        status: body.status,
      },
      created_by: userId,
    });
  }

  return data;
}

module.exports = {
  createInteraction,
  listInteractions,
  updateInteraction,
};
