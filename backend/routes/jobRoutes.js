import express from "express";
import {
    approveJob,
    createJob,
    deleteJob,
    generateSignedUrl,
    getAllJobs,
    getExternalUsers,
    getJobById,
    jobassignedTo,
    signedUrlGCS,
    updateJobStatus,

} from "../controllers/jobController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Routes

router.get("/external-users",authMiddleware, getExternalUsers);
router.get("/:id", authMiddleware, getJobById);
router.post("/:jobId/approve", authMiddleware, approveJob);

router.post("/:jobId/update-status", authMiddleware, updateJobStatus);

router.post("/create", authMiddleware, createJob);
router.post("/signed-url", authMiddleware, generateSignedUrl);
router.post("/signed-url-gcs", authMiddleware, signedUrlGCS);

router.get("/", authMiddleware, getAllJobs);
router.delete("/:id", authMiddleware, deleteJob);
router.post("/:jobId/assign", authMiddleware, jobassignedTo)



export default router;
