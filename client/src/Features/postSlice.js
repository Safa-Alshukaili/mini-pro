// client/src/Features/postSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE } from "../api";

export const getFeed = createAsyncThunk("posts/getFeed", async (userId) => {
  const { data } = await axios.get(`${API_BASE}/feed/${userId}`);
  return data.posts;
});

export const createPost = createAsyncThunk(
  "posts/createPost",
  async ({ authorId, text, file, lat, lng, locationName, locationDetails }) => {
    const form = new FormData();
    form.append("authorId", authorId);
    form.append("text", text || "");
    if (file) form.append("media", file);

    if (lat !== undefined && lat !== null) form.append("lat", String(lat));
    if (lng !== undefined && lng !== null) form.append("lng", String(lng));
    if (locationName) form.append("locationName", String(locationName));
    if (locationDetails) form.append("locationDetails", JSON.stringify(locationDetails));

    const { data } = await axios.post(`${API_BASE}/posts`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return data.post;
  }
);

export const likePost = createAsyncThunk(
  "posts/like",
  async ({ postId, userId }) => {
    const { data } = await axios.post(`${API_BASE}/posts/${postId}/like`, { userId });
    return data.post; // full post
  }
);

export const addComment = createAsyncThunk(
  "posts/addComment",
  async ({ postId, userId, text }) => {
    const { data } = await axios.post(`${API_BASE}/posts/${postId}/comments`, {
      userId,
      text,
    });
    // API يرجع comment فقط، لذلك نرجع postId + comment
    return { postId, comment: data.comment };
  }
);

export const repostPost = createAsyncThunk(
  "posts/repost",
  async ({ postId, userId }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(`${API_BASE}/posts/${postId}/repost`, { userId });
      // returns { repost, original }
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || "repost failed");
    }
  }
);

/**
 * ✅ Helper: يحدث البوست سواء كان:
 * - موجود كـ item._id
 * - أو موجود داخل item.repostOf._id
 */
function updatePostEverywhere(items, updated) {
  if (!updated?._id) return items;

  return items.map((p) => {
    if (!p) return p;

    // case 1: نفس البوست
    if (String(p._id) === String(updated._id)) {
      return updated;
    }

    // case 2: البوست الأصلي داخل repostOf
    if (p.repostOf && String(p.repostOf._id) === String(updated._id)) {
      return { ...p, repostOf: updated };
    }

    return p;
  });
}

const postsSlice = createSlice({
  name: "posts",
  initialState: { items: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(getFeed.fulfilled, (s, a) => {
      s.items = a.payload;
      s.status = "succeeded";
    })

      .addCase(createPost.fulfilled, (s, a) => {
        s.items.unshift(a.payload);
      })

      // ✅ Like: لازم نحدّث في كل مكان (حتى داخل repostOf)
      .addCase(likePost.fulfilled, (s, a) => {
        s.items = updatePostEverywhere(s.items, a.payload);
      })

      // ✅ Comment: نزيد العداد + نضيف comment سواء كان post مباشر أو داخل repostOf
      .addCase(addComment.fulfilled, (s, a) => {
        const { postId, comment } = a.payload;

        s.items = s.items.map((p) => {
          if (!p) return p;

          // لو هذا هو البوست الأصلي
          if (String(p._id) === String(postId)) {
            const updated = { ...p };
            updated.commentsCount = (updated.commentsCount || 0) + 1;
            if (!updated.comments) updated.comments = [];
            updated.comments = [...updated.comments, comment];
            return updated;
          }

          // لو هذا repost ويشير للأصل
          if (p.repostOf && String(p.repostOf._id) === String(postId)) {
            const updatedRepostOf = { ...p.repostOf };
            updatedRepostOf.commentsCount = (updatedRepostOf.commentsCount || 0) + 1;
            if (!updatedRepostOf.comments) updatedRepostOf.comments = [];
            updatedRepostOf.comments = [...updatedRepostOf.comments, comment];
            return { ...p, repostOf: updatedRepostOf };
          }

          return p;
        });
      })

      // ✅ Repost: أضف الريبوست بالأعلى + حدّث الأصل في كل مكان
      .addCase(repostPost.fulfilled, (state, action) => {
        const { repost, original } = action.payload;

        if (repost) state.items.unshift(repost);
        if (original) state.items = updatePostEverywhere(state.items, original);

        state.error = null;
      })

      .addCase(repostPost.rejected, (state, action) => {
        state.error = action.payload || "repost failed";
      });
  },
});

export default postsSlice.reducer;
