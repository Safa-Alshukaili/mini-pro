// server/Models/PostModel.js
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    // صاحب البوست
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // نص البوست
    text: {
      type: String,
      default: "",
    },

    // صورة (اختياري)
    mediaUrl: {
      type: String,
      default: "",
    },

    /**
     * ✅ Location-Based Service (GeoJSON) — OPTIONAL
     * مهم: لا نضع defaults داخل location حتى لا يتم إنشاء Point بدون coordinates
     */
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number], // [lng, lat]
      },
    },

    // اسم المكان (Muscat, Nizwa, ...)
    locationName: {
      type: String,
      default: "",
    },

    // (اختياري) تفاصيل مكان
    locationDetails: { type: Object, default: null },

    // ✅ Repost
    repostOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },

    // ✅ عدد الريبوستات (على البوست الأصلي)
    repostsCount: {
      type: Number,
      default: 0,
    },

    // إعجابات
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // عدد التعليقات
    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * ✅ مهم جداً لميزة nearby
 * ملاحظة: لو كانت location غير موجودة في بعض الوثائق، لا مشكلة
 */
postSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Post", postSchema);
