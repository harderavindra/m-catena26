import User from "../models/User.js";
import { v4 as uuidv4 } from "uuid"; // For unique file names
import { Storage } from "@google-cloud/storage";
import dotenv from "dotenv";

dotenv.config();

const storage = new Storage({ keyFilename: process.env.GOOGLE_CLOUD_KEYFILE });
const bucket = storage.bucket(process.env.BUCKET_NAME);

// 🔹 Upload Profile Picture
export const uploadProfilePic = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const userId = req.body.userId;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        // 🔹 Delete Old Profile Pic if Exists
        if (user.profilePic) {
            const oldFile = bucket.file(user.profilePic);
            oldFile.delete().catch(() => console.warn("Old file not found, skipping delete"));
        }

        // 🔹 Define New File Name
        const uniqueFilename = `avatars/${userId}/${uuidv4()}-${req.file.originalname}`;
        const file = bucket.file(uniqueFilename);

        // 🔹 Upload File to Google Cloud Storage
        await file.save(req.file.buffer, { contentType: req.file.mimetype });

        // 🔹 Make file publicly accessible (Optional)
        await file.makePublic();
        const fileUrl = `https://storage.googleapis.com/${process.env.BUCKET_NAME}/${uniqueFilename}`;

        // 🔹 Save New Image URL in MongoDB
        user.profilePic = fileUrl;
        console.log(fileUrl)
        await user.save();

        res.json({ message: "Profile picture updated", profilePicUrl: fileUrl });

    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getProfilePicUrl = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.profilePic) return res.status(404).json({ error: "Profile picture not found" });

        const file = bucket.file(user.profilePic);
        const [signedUrl] = await file.getSignedUrl({
            action: "read",
            expires: Date.now() + 10 * 60 * 1000, // Expires in 10 min
        });

        res.json({ profilePicUrl: signedUrl });

    } catch (error) {
        console.error("Error fetching profile picture:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const deleteProfilePic = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.profilePic) return res.status(404).json({ error: "Profile picture not found" });

        const file = bucket.file(user.profilePic);
        await file.delete();

        // Remove profilePic field from database
        user.profilePic = null;
        await user.save();

        res.json({ message: "Profile picture deleted successfully" });

    } catch (error) {
        console.error("Error deleting profile picture:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
