import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "../routes/auth.js"; // Import auth routes
import brandTreasuryRoutes from "../routes/brandTreasuryRoutes.js"; // Import auth routes
import masterDataRoutes from "../routes/masterDataRoutes.js"; // Import auth routes
import uploadRoutes from '../routes/uploadRoutes.js'
import profileRoutes from '../routes/profileRoutes.js'
import jobRoutes from '../routes/jobRoutes.js'
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
// Whitelist allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://m-catena26-f2jj-mnczg3y4e-harderavis-projects.vercel.app",
  "https://m-catena26-f2jj-dx51g224n-harderavis-projects.vercel.app",
  "https://m-catena26-nfjuh5vhr-harderavis-projects.vercel.app",
  "https://backend-73j2qhn4o-harderavis-projects.vercel.app"
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow cookies & headers like Authorization
  })
);


// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, 
//     {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   }
)
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


// Start Server
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "production") {
  console.log(`Local server running on port ${PORT}`);
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app; 