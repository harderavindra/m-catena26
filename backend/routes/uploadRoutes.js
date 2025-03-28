import express from "express";
import multer from "multer"
import { generateSignedUrl, getBrandTreasuryById, saveDocument, uploadThumbnail, getAllBrandTreasury, deleteBrandTreasury, deleteThumbnail, deleteDocument, toggleStarred, updateApproval } from "../controllers/uploadController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { setCorsHeaders } from "../middlewares/corsMiddleware.js";

const router = express.Router();
const storage = multer.memoryStorage(); // Stores file in memory
const upload = multer({ storage });

router.get("/", authMiddleware,setCorsHeaders, getAllBrandTreasury);
router.post("/generate-signed-url", authMiddleware, setCorsHeaders, generateSignedUrl);
router.post("/save-document", authMiddleware,setCorsHeaders, saveDocument);
router.get("/get-brandtreasury/:fileId", authMiddleware, getBrandTreasuryById);
router.put("/update-thumbnail/:fileId", upload.single("thumbnail"), uploadThumbnail);
router.post("/:id/approval", authMiddleware ,updateApproval);
router.delete("/:id", deleteBrandTreasury);
router.post("/delete-thumbnail", deleteThumbnail);
router.post("/delete-document", deleteDocument);
router.patch("/star/:documentId", authMiddleware, toggleStarred);



export default router;
