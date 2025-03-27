import { Storage } from "@google-cloud/storage";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import Document from "../models/documentModel.js";
import StarredDocument from "../models/StarredDocument.js";
import sharp from "sharp";
import fs from "fs";
import path from "path";

dotenv.config();

const storage = new Storage({ keyFilename: process.env.GOOGLE_CLOUD_KEYFILE });
const bucket = storage.bucket(process.env.BUCKET_NAME);

// Generate Signed URL and Handle Thumbnail Creation
    export const generateSignedUrl = async (req, res) => {
        try {
            const { fileName, fileType, fileSize, title } = req.body;
            const uniqueFileName = `${uuidv4()}-${fileName}`;
            const file = bucket.file(uniqueFileName);

            const [signedUrl] = await file.getSignedUrl({
                action: "write",
                expires: Date.now() + 15 * 60 * 1000, // 15 min expiry
                contentType: fileType
            });

            // Save metadata to MongoDB
            const newDoc = new Document({
                title: title,
                mimeType: fileType,
                size: fileSize,
                storagePath: uniqueFileName,
                createdBy : req.user.id

            });

            await newDoc.save();


            res.json({ signedUrl, fileId: newDoc._id });
        } catch (error) {
            console.error("Error generating signed URL:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    };


    export const saveDocument = async (req, res) => {
        try {
            const { fileId, documentType, contentType,zone, state, language, product, brand, model, title, comment } = req.body;

            // Validate required fields
            if (!fileId || !documentType || !zone || !state || !language) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            // Check if the document exists
            const existingDocument = await Document.findById(fileId);
            if (!existingDocument) {
                return res.status(404).json({ error: "Document not found. Please check fileId." });
            }

            // Update document metadata
            existingDocument.title = title;
            existingDocument.documentType = documentType;
            existingDocument.contentType = contentType;
            existingDocument.zone = zone;
            existingDocument.state = state;
            existingDocument.language = language;
            existingDocument.product = product;
            existingDocument.brand = brand;
            existingDocument.model = model;
            existingDocument.status = "done";
            existingDocument.uploadedAt = new Date();
            existingDocument.comment = comment;

            // Update last updated info
            existingDocument.lastUpdatedBy = req.user.id;
            existingDocument.lastUpdatedAt = new Date();

            // Save updated document
            await existingDocument.save();

            res.json({ message: "Metadata saved successfully", document: existingDocument });

        } catch (error) {
            console.error("Error saving document metadata:", error.message);
            res.status(500).json({ error: "Internal Server Error" });
        }
    };

// Get Signed URL for Downloading
export const getSignedUrl = async (req, res) => {
    try {
        const { fileId } = req.params;
        const document = await Document.findById(fileId);
        if (!document) return res.status(404).json({ error: "File not found" });

        const file = bucket.file(document.storagePath);

        const [signedUrl] = await file.getSignedUrl({
            action: "read",
            expires: Date.now() + 10 * 60 * 1000, // 10 min expiry
        });

        res.json({ signedUrl, document });
    } catch (error) {
        console.error("Error fetching signed URL:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get File Details, Including Thumbnail URL
export const getBrandTreasuryById = async (req, res) => {
    try {
        const { fileId } = req.params;
         const userId = req.user._id;
        const document = await Document.findById(fileId)
            .populate({ path: 'product', select: 'name' }) 
            .populate({ path: 'brand', select: 'name' }) 
            .populate({ path: 'model', select: 'name' }) 
            .populate({ path: 'lastUpdatedBy', select: 'firstName lastName profilePic role' }) 
            .populate({ path: 'createdBy', select: 'firstName lastName profilePic role' })
            .populate({ path: 'approvedBy', select: 'firstName lastName profilePic role' });

        if (!document) {
            return res.status(404).json({ error: "File not found" });
        }

        const isStarred = await StarredDocument.exists({ userId, documentId: fileId });
        // Generate signed URL for secure access
        const file = bucket.file(document.storagePath);
        const [signedUrl] = await file.getSignedUrl({
            action: "read",
            expires: Date.now() + 10 * 60 * 1000, 
        });

        // Optimized response object
        res.json({
            _id: document._id,
            title: document.title,
            documentType: document.documentType,
            contentType: document.contentType,
            mimeType: document.mimeType,
            size: document.size,
            fileUrl: signedUrl, 
            thumbnailUrls: document.thumbnailUrls || "", 
            uploadedAt: document.createdAt,
            fileName: path.basename(document.storagePath),
            storagePath: document.storagePath,
            product: document.product?.name || null,
            brand: document.brand?.name || null,
            model: document.model?.name || null,
            lastUpdatedBy: document.lastUpdatedBy,
            createdBy: document.createdBy,
            updatedAt: document.updatedAt,
            createdAt: document.createdAt,
            approved: document.approved,
            approvedBy: document.approvedBy,
            approvedAt: document.approvedAt,
            isStarred: !!isStarred, // Ensure boolean response
            comment: document?.comment, // Ensure boolean response
        });
    } catch (error) {
        console.error("Error fetching file:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
export const updateApproval = async (req, res) => {
    const { id } = req.params;
    const { approved } = req.body;
    const userId = req.user._id; // Get logged-in user ID from middleware

    try {
        const updateData = { approved };

        // If approved, set approvedBy and approvedAt; otherwise, reset them
        if (approved) {
            updateData.approvedBy = userId;
            updateData.approvedAt = new Date();
        } else {
            updateData.approvedBy = null;
            updateData.approvedAt = null;
        }

        // Use $set to ensure all fields update properly
        const document = await Document.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, upsert: false } // Don't create a new document if not found
        );

        if (!document) {
            return res.status(404).json({ error: "Document not found." });
        }

        res.json({ success: true, document });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ error: "Database update failed." });
    }
};

export const uploadThumbnail = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const { fileId } = req.params;
        const file = req.file;
        const fileName = `thumbnails/${fileId}-${Date.now()}${path.extname(file.originalname)}`;
        const blob = bucket.file(fileName);

        // Create a writable stream
        const blobStream = blob.createWriteStream({
            metadata: { contentType: file.mimetype },
            public: true, // Make file publicly accessible
        });

        blobStream.on("error", (err) => {
            console.error("Upload Error:", err);
            return res.status(500).json({ error: "Upload failed", details: err.message });
        });

        blobStream.on("finish", async () => {
            await blob.makePublic(); // Make file public
            const publicUrl = `https://storage.googleapis.com/${process.env.BUCKET_NAME}/${fileName}`;

            // Find document
            const document = await Document.findById(fileId);
            if (!document) {
                return res.status(404).json({ error: "Document not found" });
            }

            // Limit max thumbnails to 4
            if (document.thumbnailUrls && document.thumbnailUrls.length >= 4) {
                return res.status(400).json({ error: "Maximum 4 thumbnails allowed" });
            }

            // Add new thumbnail
            document.thumbnailUrls = [...(document.thumbnailUrls || []), publicUrl];
            await document.save();

            res.json({ message: "Thumbnail uploaded successfully", thumbnailUrl: publicUrl });
        });

        blobStream.end(file.buffer);
    } catch (error) {
        console.error("Unexpected Error:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
};


export const getAllBrandTreasury = async (req, res) => {
    try {
        let { page = 1, limit = 10, documentType, starred,myDocuments, search ,languages } = req.query;
        console.log(languages ,"lectedLanguages")
        const userId = req.user?.id;

        let filter = {};
        
        if (documentType) filter.documentType = documentType;
        if (search) {
            filter.$or = [
                { documentType: { $regex: search, $options: "i" } },
                { language: { $regex: search, $options: "i" } }
            ];
        }
        if (myDocuments === "true") {
            console.log(myDocuments , "myDocuments")
            filter.lastUpdatedBy = userId;  // Ensure `createdBy` is stored in the Document model
        }

        if (languages) {
            const languagesArray = languages.split(",");
            if (languagesArray.length > 0) {
                filter.language = { $in: languagesArray };
            }
        }

        // Convert limit and page to integers
        const perPage = parseInt(limit, 10);
        const skip = (page - 1) * perPage;

        let starredIds = [];

        // If starred=true, filter only starred documents
        if (starred === "true") {
            const starredDocuments = await StarredDocument.find({ userId });
            starredIds = starredDocuments.map(doc => doc.documentId.toString());
            filter._id = { $in: starredIds }; // Apply filter to fetch only starred documents
        }

        // Fetch documents
        const brandTreasuries = await Document.find(filter)
            .skip(skip)
            .sort({ createdAt: -1 }) 
            .limit(perPage)
            .populate('createdBy', 'firstName lastName location profilePic');

        // If starred=false or not provided, fetch starred document IDs separately
        if (starred !== "true") {
            const starredDocuments = await StarredDocument.find({ userId });
            starredIds = starredDocuments.map(doc => doc.documentId.toString()); // Convert to array
        }

        // Add `isStarred` field to each document
        const updatedDocuments = brandTreasuries.map(doc => ({
            ...doc.toObject(),
            isStarred: starredIds.includes(doc._id.toString()) // Now always an array
        }));

        // Count total documents
        const totalDocuments = await Document.countDocuments(filter);
        
        res.status(200).json({
            data: updatedDocuments,
            pagination: {
                currentPage: parseInt(page, 10),
                totalPages: Math.ceil(totalDocuments / perPage),
                totalDocuments,
            },
        });
    } catch (error) {
        console.error("Error fetching Brand Treasury:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};



export const deleteBrandTreasury = async (req, res) => {
    try {
        const deletedRecord = await Document.findByIdAndDelete(req.params.id);
        if (!deletedRecord) {
            return res.status(404).json({ success: false, message: "Record not found" });
        }
        res.status(200).json({ success: true, message: "Record deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const deleteThumbnail = async (req, res) => {
    try {
        const { fileId, imageUrl } = req.body;
        console.log(fileId,'imageUrl')
        if (!fileId || !imageUrl) {
            return res.status(400).json({ error: "Missing id or imageUrl" });
        }

        // Extract relative file path (Remove base URL & bucket name)
        const bucketBaseUrl = `https://storage.googleapis.com/${process.env.BUCKET_NAME}/`;
        let filePath = imageUrl.replace(bucketBaseUrl, ""); // Remove base URL

        console.log("Extracted filePath:", filePath); // Debugging: Ensure correct path

        // Ensure extracted file path is valid
        if (!filePath.startsWith("thumbnails/")) {
            return res.status(400).json({ error: "Invalid file path" });
        }

        // Delete file from Google Cloud Storage
        await bucket.file(filePath).delete();

        // Update MongoDB: Remove the specific thumbnail URL from the array
        const updatedDoc = await Document.findByIdAndUpdate(
            fileId,
            { $pull: { thumbnailUrls: imageUrl } }, // Remove the image URL
            { new: true } // Return the updated document
        );

        if (!updatedDoc) {
            return res.status(404).json({ error: "Document not found" });
        }

        res.json({ success: true, message: "Thumbnail deleted successfully", thumbnails: updatedDoc.thumbnailUrls });
    } catch (error) {
        console.error("Error deleting thumbnail:", error);
        res.status(500).json({ error: "Failed to delete thumbnail" });
    }
};


export const deleteDocument = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ error: "Document ID is required" });
        }

        // Step 1: Fetch document from DB
        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }

        const { storagePath, thumbnailUrl } = document;
        const bucketBaseUrl = `https://storage.googleapis.com/${process.env.BUCKET_NAME}/`;

        // Ensure paths are valid before processing
        const filePath = storagePath && storagePath.startsWith(bucketBaseUrl)
            ? storagePath.replace(bucketBaseUrl, "")
            : storagePath;

        const thumbnailPath = thumbnailUrl && thumbnailUrl.startsWith(bucketBaseUrl)
            ? thumbnailUrl.replace(bucketBaseUrl, "")
            : thumbnailUrl;

        console.log("Deleting file:", filePath || "No file to delete");
        console.log("Deleting thumbnail:", thumbnailPath || "No thumbnail to delete");

        // Step 2: Delete file from GCS if it exists
        if (filePath) {
            try {
                const file = bucket.file(filePath);
                const [exists] = await file.exists();
                if (exists) {
                    await file.delete();
                    console.log("Main file deleted successfully.");
                } else {
                    console.warn("Main file not found in storage.");
                }
            } catch (err) {
                console.warn("Main file deletion failed:", err.message);
            }
        }

        // Step 3: Delete thumbnail from GCS if it exists
        if (thumbnailPath) {
            try {
                const file = bucket.file(thumbnailPath);
                const [exists] = await file.exists();
                if (exists) {
                    await file.delete();
                    console.log("Thumbnail deleted successfully.");
                } else {
                    console.warn("Thumbnail not found in storage.");
                }
            } catch (err) {
                console.warn("Thumbnail deletion failed:", err.message);
            }
        }

        // Step 4: Delete the document from the database
        await Document.findByIdAndDelete(id);

        res.json({ success: true, message: "Document deleted successfully" });
    } catch (error) {
        console.error("Error deleting document:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const toggleStarred = async (req, res) => {
    try {
        const { documentId } = req.params;
        const userId = req.user.id; // Assuming you're using authentication middleware

        // Check if the document is already starred by the user
        const existingStarred = await StarredDocument.findOne({ userId, documentId });

        if (existingStarred) {
            // If already starred, remove it (unstar)
            await StarredDocument.deleteOne({ userId, documentId });
            return res.status(200).json({ message: "Document unstarred successfully", isStarred: false });
        } else {
            // If not starred, add it to the starred list
            const newStarred = new StarredDocument({ userId, documentId });
            await newStarred.save();
            return res.status(200).json({ message: "Document starred successfully", isStarred: true });
        }
    } catch (error) {
        console.error("Error toggling starred document:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};
