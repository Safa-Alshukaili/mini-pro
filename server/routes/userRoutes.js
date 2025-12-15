// server/routes/userRoutes.js
const express = require("express");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../Models/UserModel");
const Follow = require("../Models/FollowModel");
const Post = require("../Models/PostModel");
const Comment = require("../Models/CommentModel");

const router = express.Router();

/* ========== Avatar upload ========== */
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, "avatar-" + Date.now() + "-" + file.originalname),
});
const uploadAvatar = multer({ storage: avatarStorage });

/* ===== helpers (same behavior as postRoutes) ===== */
function basePopulate(q) {
  return q
    .populate("author", "firstname lastname email avatarUrl country city preferences")
    .populate({
      path: "repostOf",
      populate: {
        path: "author",
        select: "firstname lastname email avatarUrl country city preferences",
      },
    });
}

async function attachComments(posts) {
  const ids = posts.map((p) => p._id);

  const comments = await Comment.find({ post: { $in: ids } })
    .sort({ createdAt: 1 })
    .populate("author", "firstname lastname avatarUrl email");

  const map = {};
  for (const c of comments) {
    const pid = String(c.post);
    if (!map[pid]) map[pid] = [];
    map[pid].push(c);
  }

  return posts.map((p) => ({
    ...p.toObject(),
    comments: map[String(p._id)] || [],
  }));
}

/* ========== Public user profile ========== */
router.get("/users/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "user not found" });
    res.json({ user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "user fetch failed" });
  }
});

/* ========== My profile (user + posts + followers/following) ========== */
router.get("/profile/:id", async (req, res) => {
  const id = req.params.id;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json({ message: "user not found" });

    // ✅ FIX: populate repostOf like other pages + attach comments
    let q = Post.find({ author: id }).sort({ createdAt: -1 });
    q = basePopulate(q);
    const posts = await q;

    const postsWithComments = await attachComments(posts);

    const followersDocs = await Follow.find({ following: id }).populate(
      "follower",
      "firstname lastname email avatarUrl country city preferences"
    );
    const followingDocs = await Follow.find({ follower: id }).populate(
      "following",
      "firstname lastname email avatarUrl country city preferences"
    );

    const followers = followersDocs.map((f) => f.follower);
    const following = followingDocs.map((f) => f.following);

    res.json({ user, posts: postsWithComments, followers, following });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "profile failed" });
  }
});

/* ========== Update profile (name + bio + avatar + location) ========== */
router.put("/users/:id", uploadAvatar.single("avatar"), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const { firstname, lastname, bio, country, city } = req.body;
    const update = {};

    if (firstname) update.firstname = firstname;
    if (lastname) update.lastname = lastname;
    if (bio !== undefined) update.bio = bio;

    if (country !== undefined) update.country = String(country);
    if (city !== undefined) update.city = String(city);

    if (req.file) update.avatarUrl = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({ user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "update failed" });
  }
});

/* =========================================================
   ✅ Update Settings/Preferences
   PATCH /users/:id/preferences
   ========================================================= */
router.patch("/users/:id/preferences", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const { privateAccount, showProfileLocation, emailNotifications, pushNotifications } = req.body;

    const update = {};
    if (privateAccount !== undefined) update["preferences.privateAccount"] = !!privateAccount;
    if (showProfileLocation !== undefined) update["preferences.showProfileLocation"] = !!showProfileLocation;
    if (emailNotifications !== undefined) update["preferences.emailNotifications"] = !!emailNotifications;
    if (pushNotifications !== undefined) update["preferences.pushNotifications"] = !!pushNotifications;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "No settings provided to update" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "user not found" });

    res.json({ user });
  } catch (e) {
    console.error("preferences error:", e);
    res.status(500).json({ message: "update preferences failed" });
  }
});

/* =========================================================
   ✅ Change Password
   PATCH /users/:id/password
   ========================================================= */
router.patch("/users/:id/password", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Missing passwords" });
    }

    if (String(newPassword).length < 4) {
      return res.status(400).json({ message: "New password too short" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "user not found" });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(400).json({ message: "Current password is wrong" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "change password failed" });
  }
});

/* =========================================================
   ✅ Delete Account
   DELETE /users/:id
   ========================================================= */
router.delete("/users/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    await Post.deleteMany({ author: id });
    await Follow.deleteMany({ $or: [{ follower: id }, { following: id }] });
    await User.findByIdAndDelete(id);

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "delete account failed" });
  }
});

/* ========== Follow / Unfollow / Search / Stats ========== */
router.post("/users/:id/follow", async (req, res) => {
  try {
    const follower = req.body.userId;
    const following = req.params.id;
    await Follow.create({ follower, following });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: "already following?" });
  }
});

router.post("/users/:id/unfollow", async (req, res) => {
  try {
    await Follow.deleteOne({ follower: req.body.userId, following: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: "unfollow failed" });
  }
});

router.get("/search", async (req, res) => {
  const q = req.query.q || "";
  try {
    const users = await User.find({
      $or: [
        { firstname: { $regex: q, $options: "i" } },
        { lastname: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    }).select("firstname lastname email avatarUrl country city preferences");

    res.json({ users });
  } catch (e) {
    console.error(e);
    res.status(500).json({ users: [] });
  }
});

router.get("/users/:id/follow-status/:meId", async (req, res) => {
  const { id, meId } = req.params;
  try {
    const exists = await Follow.exists({ follower: meId, following: id });
    res.json({ isFollowing: !!exists });
  } catch (e) {
    console.error(e);
    res.status(500).json({ isFollowing: false });
  }
});

router.get("/users/:id/follow-stats", async (req, res) => {
  const id = req.params.id;
  try {
    const followers = await Follow.countDocuments({ following: id });
    const following = await Follow.countDocuments({ follower: id });
    res.json({ followers, following });
  } catch (e) {
    console.error(e);
    res.status(500).json({ followers: 0, following: 0 });
  }
});

router.get("/users/:id/followers", async (req, res) => {
  const id = req.params.id;
  const docs = await Follow.find({ following: id }).populate(
    "follower",
    "firstname lastname email avatarUrl country city preferences"
  );
  res.json({ followers: docs.map((f) => f.follower) });
});

router.get("/users/:id/following", async (req, res) => {
  const id = req.params.id;
  const docs = await Follow.find({ follower: id }).populate(
    "following",
    "firstname lastname email avatarUrl country city preferences"
  );
  res.json({ following: docs.map((f) => f.following) });
});

module.exports = router;
