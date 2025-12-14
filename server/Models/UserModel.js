// server/Models/UserModel.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true, trim: true },
    lastname: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    bio: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },

    // ✅ Profile Location (Country + City only)
    country: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },

    // ✅ SETTINGS (NEW)
    preferences: {
      privateAccount: { type: Boolean, default: false }, // حساب خاص
      showProfileLocation: { type: Boolean, default: true }, // عرض الموقع في الملف الشخصي
      emailNotifications: { type: Boolean, default: true }, // إشعارات البريد الإلكتروني
      pushNotifications: { type: Boolean, default: true }, // إشعارات الدفع
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
