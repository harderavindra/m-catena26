import express from "express";
import upload from "../middlewares/uploadMiddleware.js";
import { uploadProfilePic, getProfilePicUrl, deleteProfilePic } from "../controllers/profileController.js";

const router = express.Router();

router.post("/upload-profile-pic", upload.single("profilePic"), uploadProfilePic);
router.get("/get-profile-pic", getProfilePicUrl);
router.delete("/delete-profile-pic", deleteProfilePic);

export default router;
