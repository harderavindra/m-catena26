import Job from "../models/JobModel.js";
import User from "../models/User.js";
import { v4 as uuidv4 } from "uuid";
import { Storage } from "@google-cloud/storage";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { setCorsHeaders } from "../middlewares/corsMiddleware.js";


dotenv.config();

const storage = new Storage({
  keyFilename: process.env.GOOGLE_CLOUD_KEYFILE, // Ensure this file is set up properly
});

const bucketName = process.env.BUCKET_NAME;
const bucket = storage.bucket(bucketName);

const JOB_STATUS = ["Inprogress", "Hold", "Submited"];
const DECISION_STATUS = ["Created", "Approved", "Assigned", "Completed", "Rejected", "Resubmitted"];

export const createJob = async (req, res) => {
  try {
    const { title, type, priority, offerType, zone, state, language, product, brand, model, offerDetails, otherDetails, attachment,dueDate } = req.body;

    const newJob = new Job({
      title,
      type,
      priority,
      offerType,
      zone,
      state,
      language,
      product,
      brand,
      model,
      offerDetails,
      otherDetails,
      attachment,
      dueDate, 
      decisionHistory: [{ status: "Created", updatedBy: req.user._id }] // Auto-add initial status
    });

    await newJob.save();
    res.status(201).json({ success: true, job: newJob });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



export const getAllJobs = async (req, res) => {
  try {
    
    setCorsHeaders(req, res); // Set CORS headers

    const jobs = await Job.find()
    .populate('decisionHistory.updatedBy', 'firstName lastName email profilePic')
    .populate({ path: 'createdBy', select: 'firstName lastName profilePic role' })
      .populate('statusHistory.updatedBy', 'firstName lastName email profilePic')
      .populate('assignedTo','firstName email profilePic')

    const jobsWithSignedUrls = await Promise.all(jobs.map(async (job) => {
      let createdBy = null;

      // Find the "Created" status entry
      const createdStatus = job.decisionHistory.find(entry => entry.status === "Created");
      if (createdStatus?.updatedBy) {
        createdBy = {
          _id: createdStatus.updatedBy._id,
          email: createdStatus.updatedBy.email,
          firstName: createdStatus.updatedBy.firstName,
          profilePic: createdStatus.updatedBy.profilePic
        };
      }

      let attachmentSignedUrl = null;
      if (job.attachment) {
        try {
          const file = bucket.file(job.attachment);
          [attachmentSignedUrl] = await file.getSignedUrl({
            action: "read",
            expires: Date.now() + 10 * 60 * 1000, // 10 min expiry
          });
        } catch (err) {
          console.error(`Error generating signed URL for job ${job._id}:`, err);
        }
      }

      return {
        ...job.toObject(),
        createdBy,
        attachmentSignedUrl
      };
    }));

    res.status(200).json(jobsWithSignedUrls);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export const getJobById = async (req, res) => {
  setCorsHeaders(req, res); // Set CORS headers

  try {

    const { id } = req.params;

    const job = await Job.findById(id)
      .populate('decisionHistory.updatedBy', 'firstName lastName email profilePic')
      .populate('statusHistory.updatedBy', 'firstName lastName email profilePic')
      .populate({ path: 'createdBy', select: 'firstName lastName profilePic role' })
      .populate('assignedTo','firstName lastName email profilePic')

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }


    let createdBy = null;
    let approvedBy = null;

    // Find the "Created" status entry
    const createdStatus = job.decisionHistory.find(entry => entry.status === "Created");
    if (createdStatus?.updatedBy) {
      createdBy = {
        _id: createdStatus.updatedBy._id,
        email: createdStatus.updatedBy.email,
        firstName: createdStatus.updatedBy.firstName,
        lastName: createdStatus.updatedBy.lastName,
        profilePic: createdStatus.updatedBy.profilePic
      };
    }

    // Find the "Approved" status entry
    const approvedStatus = job?.decisionHistory.find(entry => entry.status === "Approved");
    if (approvedStatus?.updatedBy) {
      approvedBy = {
        _id: approvedStatus.updatedBy._id,
        email: approvedStatus.updatedBy.email,
        firstName: approvedStatus.updatedBy.firstName,
        lastName: approvedStatus.updatedBy.lastName,
        profilePic: approvedStatus.updatedBy.profilePic
      }; 
    }

    // Generate signed URL for main job attachment
    let attachmentSignedUrl = null;
    console.log(job.attachment)
    if (job.attachment) {
      try {
        attachmentSignedUrl = await generatesSignedUrlGCS(job.attachment);
      } catch (err) {
        console.error(`Error generating signed URL for job attachment:`, err);
      }
    }

    // Generate signed URLs for statusHistory attachments
    const statusHistoryWithSignedUrls = await Promise.all(
      job.statusHistory.map(async (entry) => ({
        ...entry.toObject(),
        attachmentSignedUrl: entry.attachment ? await generateSignedAttchmentUrl(entry.attachment) : null,
      }))
    );
     // Generate signed URLs for statusHistory attachments
    const decisionHistoryWithSignedUrls = await Promise.all(
      job.decisionHistory.map(async (entry) => ({
        ...entry.toObject(),
        attachmentSignedUrl: entry.attachment ? await generateSignedAttchmentUrl(entry.attachment) : null,
      }))
    );

    res.status(200).json({
      ...job.toObject(),
      createdBy,
      approvedBy,
      attachmentSignedUrl,
      statusHistory: statusHistoryWithSignedUrls, // Replace statusHistory with the updated version
      decisionHistory: decisionHistoryWithSignedUrls, // Replace statusHistory with the updated version
    });

  } catch (error) {
    console.error("Error fetching job by ID:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export const approveJob = async (req, res) => {
  setCorsHeaders(req, res); // Set CORS headers

  try {
    const { jobId } = req.params;
    const adminId = req.user._id; // Assuming user is authenticated


    const job = await Job.findById(jobId);
    console.log(req.params, job);

    if (!job) return res.status(404).json({ error: "Job not found" });

    // Add approval entry in status history
    job.decisionHistory.push({
      status: "Approved",
      updatedBy: adminId,
      date: new Date(),
    });
    job.finalStatus = "Approved"; 


    await job.save();
    res.status(200).json({ message: "Job approved successfully", job });
  } catch (error) {
    console.error("Error approving job:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const updateJobStatus = async (req, res) => {
  setCorsHeaders(req, res); // Set CORS headers

  try {
    const { jobId } = req.params;
    const { status, comment, attachment } = req.body;
    const adminId = req.user._id;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    if (DECISION_STATUS.includes(status)) {
      job.decisionHistory.push({
        status,
        comment,
        attachment,
        updatedBy: adminId,
        date: new Date(),
      });
    }

    if (JOB_STATUS.includes(status)) {
      job.statusHistory.push({
        status,
        comment,
        attachment,
        updatedBy: adminId,
        date: new Date(),
      });

    }
    job.finalStatus = status;

    await job.save();
    res.status(200).json({ message: `Job status updated to ${status}`, job });

  } catch (error) {
    console.error("Error updating job status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid job ID" });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Check if job has an attachment and delete it from GCS
    if (job.attachment) {
      const file = bucket.file(job.attachment);
      try {
        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          console.log(`Attachment ${job.attachment} deleted successfully from GCS.`);
        }
      } catch (err) {
        console.error("Error deleting attachment from GCS:", err);
        return res.status(500).json({ error: "Failed to delete job attachment" });
      }
    }

    // Delete job from the database
    await Job.findByIdAndDelete(id);
    res.status(200).json({ message: "Job and its attachment deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



export const generateSignedUrl = async (req, res) => {
  setCorsHeaders(req, res); // Set CORS headers

  try {
    const { fileName, fileType } = req.body;
    if (!fileName || !fileType) {
      return res.status(400).json({ message: "Missing file details" });
    }

    // Ensure the 'status' folder is added only once
    const folder = "status/";
    const sanitizedFileName = fileName.replace(/^status\//, ""); // Remove "status/" prefix if present
    const uniqueFileName = `${uuidv4()}-${sanitizedFileName}`;
    const fullFilePath = `${folder}${uniqueFileName}`;
    const file = bucket.file(fullFilePath);

    // Generate a signed URL for uploading
    const [signedUrl] = await file.getSignedUrl({
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15-minute expiry
      contentType: fileType,
    });

    res.json({
      signedUrl,
      fileUrl: `https://storage.googleapis.com/${bucketName}/${fullFilePath}`, // Fixed path
    });
  } catch (error) {
    console.error("Error generating signed URL:", {
      error,
      fileName: req.body.fileName,
      fileType: req.body.fileType,
    });
    res.status(500).json({ message: "Internal Server Error" });
  }
};


const generateSignedAttchmentUrl = async (filePath) => {
  // setCorsHeaders(req, res); // Set CORS headers

  try {
    if (!filePath) return null;
    // Ensure the file path includes the `/status/` folder
    const fullFilePath = filePath.startsWith("status/") ? filePath : `status/${filePath}`;

    const file = bucket.file(fullFilePath);
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    return signedUrl;
  } catch (err) {
    console.error(`Error generating signed URL for file: ${filePath}`, err);
    return null;
  }
};


export const getExternalUsers = async (req, res) => {
  console.log('getExternalUsers')
  try {
      const externalUsers = await User.find({ userType: "vendor" }).select("_id firstName profilePic email"); // Fetch only necessary fields
      res.status(200).json(externalUsers);
  } catch (error) {
      console.error("Error fetching external users:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
};


export const jobassignedTo = async (req, res) => {
  const { jobId } = req.params;
  const { assignedTo, comment } = req.body;  // Add 'comment' in the request body
  const adminId = req.user._id;

  try {
      // Find and update the job with the new assignedTo
      const job = await Job.findByIdAndUpdate(jobId, { assignedTo }, { new: true });
      
      if (!job) {
          return res.status(404).json({ message: "Job not found" });
      }

      // Push a new entry into the decisionHistory array
      job.decisionHistory.push({
        status: 'Assigned',
        comment: comment || '', // Use the provided comment or an empty string if no comment is provided
        updatedBy: adminId,
        date: new Date(), // Set the current date and time
      });
      job.finalStatus = 'Assigned';

      // Save the updated job document
      await job.save();

      res.status(200).json({ message: "User assigned successfully", job });
  } catch (error) {
      console.error("Error assigning user:", error);
      res.status(500).json({ message: "Internal Server Error" }); 
  }
};


export const signedUrlGCS = async (req, res) => {
  setCorsHeaders(req, res); // Set CORS headers

  try {
    const { fileName, fileType } = req.body;
    if (!fileName || !fileType) {
      return res.status(400).json({ error: "Missing fileName or fileType" });
    }

    // Ensure the file is uploaded to the "job" folder
    const filePath = `job/${fileName}`;
    const file = bucket.file(filePath);

    const [signedUrl] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes expiry
      contentType: fileType,
    });

    res.json({ signedUrl, fileUrl: `https://storage.googleapis.com/${bucketName}/${filePath}` });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


const generatesSignedUrlGCS = async (filePath) => {
  setCorsHeaders(req, res); // Set CORS headers

  try {
    if (!filePath) return null;

    // Extract only the filename from a full URL, if needed
    let cleanFilePath = filePath;
    if (filePath.startsWith("https://storage.googleapis.com/")) {
      cleanFilePath = new URL(filePath).pathname.replace(/^\/brand-treasury\//, "");
    }

    // Ensure it has the "job/" prefix
    const fullFilePath = cleanFilePath.startsWith("job/") ? cleanFilePath : `job/${cleanFilePath}`;

    const file = bucket.file(fullFilePath);
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    return signedUrl;
  } catch (err) {
    console.error(`Error generating signed URL for file: ${filePath}`, err);
    return null;
  }
};