import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"
import authMiddleware from '../middlewares/authMiddleware.js'
import { DESIGNATIONS, ROLES } from "../constants/enums.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;



    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.cookie("token", token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: 'strict',
      maxAge: 3600000
    });

    res.status(200).json({ message: "Login successful", user: { id: user._id, email: user.email, role: user.role } });

  } catch (error) {
    console.error("Login Error:", error); // ✅ Log error for debugging
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, designation, search } = req.query;
    console.log('page', page)

    let filter = {};

    if (role) filter.role = role;
    if (designation) filter.designation = designation;

    // Search by first name or last name
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } }
      ];
    }

    const users = await User.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(filter);

    res.json({
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("firstName lastNmae email role profilePic createdAt"); // Exclude password
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
export const logOut = (req, res) => {
  res.clearCookie("token", { httpOnly: true, secure: process.env.NODE_ENV === "production" });
  return res.status(200).json({ message: "Logged out successfully" });
}

export const getUserById = async (req, res) => {
  console.log(req.params.id)
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};


export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { firstName, lastName, contactNumber, userType, designation, role, status, location } = req.body;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (contactNumber) updateData.contactNumber = contactNumber;
    if (userType) {
      if (!["internal", "vendor"].includes(userType.toLowerCase())) {
        return res.status(400).json({ message: "Invalid userType" });
      }
      updateData.userType = userType;
    }
    if (designation) {
      const allDesignations = [...DESIGNATIONS.INTERNAL, ...DESIGNATIONS.VENDOR];
      if (!allDesignations.includes(designation)) {
        return res.status(400).json({ message: "Invalid designation" });
      }
      updateData.designation = designation;
    }
    if (role) {
      if (!Object.values(ROLES).includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      updateData.role = role;
    }
    if (status) {
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      updateData.status = status;
    }
    if (location) {
      if (typeof location !== "object") {
        return res.status(400).json({ message: "Invalid location format" });
      }
      console.log(location)
      updateData.location = {};
      if (location.city) updateData.location.city = location.city;
      if (location.state) updateData.location.state = location.state;
      if (location.country) updateData.location.country = location.country;
    }

    updateData.lastUpdatedAt = new Date();

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password"); // Exclude password from response

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully", updatedUser });
  } catch (error) {
    console.error("Error updating user:", error); // Log actual error in console
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


const validatePassword = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};
export const resetUserPassword = async (req, res) => {
  try {
    const adminId = req.user.id; // Admin ID from token
    const { id } = req.params; // Target User ID
    const { newPassword } = req.body;
    // Ensure admin is authorized
    const adminUser = await User.findById(adminId);
    // if (!adminUser || adminUser.role.toLowerCase() !== "admin") {
      //   return res.status(403).json({ message: "Access denied. Only admins can reset passwords." });
      // }
      
      // Find the target user
      const user = await User.findById(id).select("+password"); // Ensure password is accessible
      if (!user) return res.status(404).json({ message: "User not found" });
      console.log(user)

    // // Validate password strength
    // if (!validatePassword(newPassword)) {
    //   return res.status(400).json({
    //     message: "Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character."
    //   });
    // }

    // Hash new password
    user.password = newPassword;
    user.lastUpdatedBy = adminId; // Track who updated it
    await user.save();

    res.status(200).json({ message: "User password reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const adminId = req.user.id; // Admin ID from token
    const { id } = req.params; // Target User ID
console.log(id)
    // Ensure admin is authorized
    const adminUser = await User.findById(adminId);
    if (!adminUser || adminUser.role.toLowerCase() !== "admin") {
      return res.status(403).json({ message: "Access denied. Only admins can delete users." });
    }

    // Find and delete user
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const registerUser = async (req, res) => {

  try {
    console.log("Incoming request body:", req.body); // 🟢 Log request body before validation

    const user = new User({...req.body,lastUpdatedAt: new Date(),});
    console.log("User instance before saving:", user); // 🟢 Check what is stored before saving

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error saving user:", error);
    res.status(400).json({ message: error.message });
  }
};
