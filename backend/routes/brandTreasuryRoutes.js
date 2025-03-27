import express from "express";
import {
  createBrandTreasury,
  getBrandTreasuries,
  getBrandTreasuryById,
  updateBrandTreasury,
  deleteBrandTreasury
} from "../controllers/brandTreasuryController.js";

const router = express.Router();

// Routes
// router.post("/", createBrandTreasury); // Create a new Brand Treasury record
router.get("/", getBrandTreasuries); // Get all records
router.get("/:id", getBrandTreasuryById); // Get a single record by ID
router.put("/:id", updateBrandTreasury); // Update a record by ID
router.delete("/:id", deleteBrandTreasury); // Delete a record by ID

export default router;
