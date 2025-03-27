import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"
import authMiddleware from '../middlewares/authMiddleware.js'
import { deleteUser, getAllUsers, getMe, getUserById, login, logOut, registerUser, resetUserPassword, updateUser } from "../controllers/authController.js";
const router = express.Router();



// Login User
router.post("/login", login);
router.get("/users",authMiddleware, getAllUsers);
router.post("/register",authMiddleware, registerUser);

router.get("/me", authMiddleware, getMe)
router.post("/logout", logOut);

router.get("/:id", authMiddleware, getUserById);
router.put("/:id/reset-password", authMiddleware, resetUserPassword);

router.put("/:id", authMiddleware, updateUser);
router.delete("/:id", authMiddleware, deleteUser);



export default router;
