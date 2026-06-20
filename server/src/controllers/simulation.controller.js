const assessmentRepository = require("../repositories/assessment.repository");

const riskRepository = require("../repositories/risk.repository");

const simulationService = require("../services/simulation.service");

const {
    verifyAssessmentOwnership,
} = require("../services/ownership.service");
const caseRepository = require("../repositories/case.repository");
const { sendError } = require("../utils/http-error");

const createSimulation = async (req, res) => {
    try {
        const { assessmentId, decision, } = req.body;

        await verifyAssessmentOwnership(assessmentId, req.dbUser.id);

        const {
            data: assessment,
        } =
            await assessmentRepository.getAssessmentById(
                assessmentId
            );

        const {
            data: riskAnalysis,
        } =
            await riskRepository.getRiskAssessment(
                assessmentId
            );

        const result =
            await simulationService.createSimulation({
                assessment,
                analysis: riskAnalysis,
                decision,
            });

        return res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error(error);

        return sendError(res, error, "Unable to create the simulation right now.");
    }
};

const listCaseSimulations = async (req, res) => {
    try {
        const { data: caseRecord, error } =
            await caseRepository.getCaseByIdForUser(
                req.params.caseId,
                req.dbUser.id
            );

        if (error || !caseRecord) {
            return res.status(404).json({
                success: false,
                message: "Case not found",
            });
        }

        const data =
            await simulationService.getCaseSimulationHistory(
                req.params.caseId
            );

        return res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error(error);

        return sendError(res, error, "Unable to load case simulations right now.");
    }
};

module.exports = {
    createSimulation,
    listCaseSimulations,
};
