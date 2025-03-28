import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

// Import routes
import authRoutes from "./routes/auth.js";
import brandTreasuryRoutes from "./routes/brandTreasuryRoutes.js";
import masterDataRoutes from "./routes/masterDataRoutes.js";
import uploadRoutes from './routes/uploadRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import jobRoutes from './routes/jobRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Load allowed origins from environment variables

app.use(cors())

// Middleware
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/brand-treasury", brandTreasuryRoutes);
app.use("/api/master", masterDataRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/profile-pic", profileRoutes);
app.use("/api/jobs", jobRoutes);

app.get("/api/test", (req, res) => {
  res.json({
    message: "Backend is working!",
    environment: process.env.NODE_ENV || "development",
    test_url: process.env.TEST_URL,
  });
});

// Start the server
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
