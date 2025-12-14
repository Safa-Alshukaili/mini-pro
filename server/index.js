// server/index.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const User = require("./Models/UserModel");

const app = express();

app.use(express.json());

// ✅ CORS (FIXED) — يسمح لـ React (3000) و Vite (5173)
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // لو الطلب من Postman/Server-side (بدون origin) نسمح
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error("Not allowed by CORS: " + origin));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ مهم للـ preflight
app.options(/.*/, cors());


// Static uploads
app.use("/uploads", express.static(__dirname + "/uploads"));

// Routes
const postRoutes = require("./routes/postRoutes");
const userRoutes = require("./routes/userRoutes");
app.use(postRoutes);
app.use(userRoutes);

// Health check
app.get("/", (req, res) => res.send("The server is up and running!"));

// Auth
app.post("/register", async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;
    if (!firstname || !lastname || !email || !password)
      return res.status(400).json({ message: "Missing required fields" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ firstname, lastname, email, password: hashed });

    res.json({
      user: {
        _id: user._id,
        firstname,
        lastname,
        email,
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || "",
        country: user.country || "",
        city: user.city || "",
        preferences: user.preferences || {
          privateAccount: false,
          showProfileLocation: true,
          emailNotifications: true,
          pushNotifications: true,
        },
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    res.json({
      user: {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || "",
        country: user.country || "",
        city: user.city || "",
        preferences: user.preferences || {
          privateAccount: false,
          showProfileLocation: true,
          emailNotifications: true,
          pushNotifications: true,
        },
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

// Seed
app.get("/seed-user", async (req, res) => {
  try {
    const email = "sssafa41@gmail.com";
    const exists = await User.findOne({ email });
    if (!exists) {
      const hashed = await bcrypt.hash("safa123", 10);
      await User.create({ firstname: "Safa", lastname: "Alshukaili", email, password: hashed });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "seed failed" });
  }
});

const PORT = process.env.PORT || 3001;

// Start only after DB connects
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
})();
