import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, USER_TYPES,  STATUS, GENDER, DESIGNATIONS } from "../constants/enums.js";

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, trim: true, lowercase: true },
    contactNumber: { 
      type: String, 
      unique: true, 
      sparse: true,
      validate: {
        validator: function(v) {
          return /^\d{10}$/.test(v);
        },
        message: props => `${props.value} is not a valid phone number!`
      }
    },
    password: { type: String, required: true },
    userType: { type: String, enum: ["internal", "vendor"], required: true },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },
    designation: { 
      type: String, 
      required: true, 
      enum: [...DESIGNATIONS.INTERNAL, ...DESIGNATIONS.VENDOR] 
    },
    profilePic: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    dob: { 
      type: Date, 
      validate: {
        validator: function(v) {
          return v < new Date();
        },
        message: props => `${props.value} is not a valid date of birth!`
      }
    },
    gender: { type: String, enum: ["male", "female", "other"] },
    location: {
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, default: "India", trim: true },
    },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastUpdatedAt: { type: Date },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function(next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  
  // Update lastUpdatedAt only if something other than the password is modified
  if (this.isModified() && !this.isModified("password")) {
    this.lastUpdatedAt = new Date();
  }

  next();
});

// Ensure lastUpdatedAt updates on modifications
UserSchema.pre("findOneAndUpdate", function(next) {
  this.set({ lastUpdatedAt: new Date() });
  next();
});

export default mongoose.model("User", UserSchema);
