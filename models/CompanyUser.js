// models/CompanyUser.js
import mongoose from "mongoose";

const companyUserSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    companyId: {
      type: Number,
      required: true,
    },
    userId: {
      type: Number,
      required: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "companyUsers", // ✅ explicitly matches your collection name
    versionKey: "__v", // ✅ ensures versioning key works as per your document
  }
);

export default mongoose.model("CompanyUser", companyUserSchema);
