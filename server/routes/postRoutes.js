// server/routes/postRoutes.js
const express = require("express");
const multer = require("multer");
const Post = require("../Models/PostModel");
const Comment = require("../Models/CommentModel");
const Follow = require("../Models/FollowModel");

const router = express.Router();

/* ===== Multer ===== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

/* ===== helpers ===== */
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

function basePopulate(q) {
  return q
    .populate("author", "firstname lastname email avatarUrl")
    .populate({
      path: "repostOf",
      populate: {
        path: "author",
        select: "firstname lastname email avatarUrl",
      },
    });
}

async function getFullPost(postId) {
  let postQ = Post.findById(postId);
  postQ = basePopulate(postQ);
  const post = await postQ;
  if (!post) return null;

  const withComments = await attachComments([post]);
  return withComments[0];
}

/* =========================================================
   CREATE POST
   POST /posts
   ========================================================= */
router.post("/posts", upload.single("media"), async (req, res) => {
  try {
    const author = req.body.authorId;

    const doc = {
      author,
      text: req.body.text || "",
      mediaUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
    };

    // location parsing
    const latRaw = req.body.lat;
    const lngRaw = req.body.lng;
    const locationName = req.body.locationName;

    const lat = latRaw !== undefined && latRaw !== "" ? Number(latRaw) : null;
    const lng = lngRaw !== undefined && lngRaw !== "" ? Number(lngRaw) : null;

    const validCoords =
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180;

    if (validCoords) {
      doc.location = { type: "Point", coordinates: [lng, lat] };

      let parsedDetails = null;
      try {
        parsedDetails = req.body.locationDetails
          ? JSON.parse(req.body.locationDetails)
          : null;
      } catch {}

      if (parsedDetails) doc.locationDetails = parsedDetails;
      doc.locationName = (locationName || "").toString();
    }

    const created = await Post.create(doc);
    const full = await getFullPost(created._id);
    res.json({ post: full });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "create failed" });
  }
});

/* =========================================================
   ✅ REPOST (ONE ROUTE ONLY)
   POST /posts/:id/repost   { userId }
   ========================================================= */
router.post("/posts/:id/repost", async (req, res) => {
  try {
    const { userId } = req.body;
    const originalId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: "userId required" });
    }

    const originalPost = await Post.findById(originalId);
    if (!originalPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    // منع تكرار الريبوست
    const exists = await Post.findOne({
      author: userId,
      repostOf: originalId,
    });

    if (exists) {
      const fullOriginal = await getFullPost(originalId);
      return res.json({
        repost: null,
        original: fullOriginal,
        alreadyReposted: true,
      });
    }

    // إنشاء الريبوست
    const repost = await Post.create({
      author: userId,
      repostOf: originalId,
    });

    // زيادة العداد في الأصل
    await Post.findByIdAndUpdate(originalId, { $inc: { repostsCount: 1 } });

    const fullRepost = await getFullPost(repost._id);
    const fullOriginal = await getFullPost(originalId);

    res.json({
      repost: fullRepost,
      original: fullOriginal,
      alreadyReposted: false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "repost failed" });
  }
});

/* =========================================================
   FEED: me + following
   GET /feed/:userId
   ========================================================= */
router.get("/feed/:userId", async (req, res) => {
  try {
    const me = req.params.userId;
    const following = await Follow.find({ follower: me }).select("following");
    const ids = [me, ...following.map((f) => f.following)];

    let q = Post.find({ author: { $in: ids } }).sort({ createdAt: -1 }).limit(50);
    q = basePopulate(q);
    const posts = await q;

    const postsWithComments = await attachComments(posts);
    res.json({ posts: postsWithComments });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "feed failed" });
  }
});

/* =========================================================
   POSTS BY USER
   GET /posts/by-user/:id
   ========================================================= */
router.get("/posts/by-user/:id", async (req, res) => {
  try {
    let q = Post.find({ author: req.params.id }).sort({ createdAt: -1 });
    q = basePopulate(q);
    const posts = await q;

    const postsWithComments = await attachComments(posts);
    res.json({ posts: postsWithComments });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "by-user failed" });
  }
});

/* ========================================================= */
router.patch("/posts/:id", async (req, res) => {
  try {
    const { text } = req.body;
    await Post.findByIdAndUpdate(req.params.id, { text }, { new: true });

    const full = await getFullPost(req.params.id);
    res.json({ post: full });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "update post failed" });
  }
});

/* =========================================================
   DELETE POST
   DELETE /posts/:id
   ========================================================= */
router.delete("/posts/:id", async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "delete post failed" });
  }
});

/* =========================================================
   EXPLORE
   GET /explore
   ========================================================= */
router.get("/explore", async (req, res) => {
  try {
    let q = Post.find({}).sort({ createdAt: -1 }).limit(50);
    q = basePopulate(q);
    const posts = await q;

    const postsWithComments = await attachComments(posts);
    res.json({ posts: postsWithComments });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "explore failed" });
  }
});

/* =========================================================
   NEARBY POSTS
   GET /posts/nearby?lat=..&lng=..&radiusKm=10
   ========================================================= */
router.get("/posts/nearby", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radiusKm = Number(req.query.radiusKm || 10);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: "Invalid lat/lng" });
    }

    const maxDistance = radiusKm * 1000;

    let q = Post.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: maxDistance,
        },
      },
    })
      .sort({ createdAt: -1 })
      .limit(50);

    q = basePopulate(q);
    const posts = await q;

    const postsWithComments = await attachComments(posts);
    res.json({ posts: postsWithComments });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "nearby failed" });
  }
});

module.exports = router;
