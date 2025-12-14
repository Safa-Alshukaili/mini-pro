// src/Components/Profile.js
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";

import { API_BASE } from "../api";
import PostCard from "./PostCard";

import { getMyLocation, reverseGeocodeOSM } from "../utils/geo";
import { FiMapPin } from "react-icons/fi";

export default function Profile() {
  const me = useSelector((s) => s.users.user);

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    bio: "",
    country: "",
    city: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [locLoading, setLocLoading] = useState(false);

  useEffect(() => {
    if (!me?._id) return;

    const load = async () => {
      const { data } = await axios.get(`${API_BASE}/profile/${me._id}`);
      setUser(data.user);
      setPosts(data.posts || []);
      setFollowers(data.followers || []);
      setFollowing(data.following || []);

      setForm({
        firstname: data.user.firstname || "",
        lastname: data.user.lastname || "",
        bio: data.user.bio || "",
        country: data.user.country || "",
        city: data.user.city || "",
      });
    };

    load();
  }, [me?._id]);

  if (!me?._id) {
    return (
      <div className="page">
        <div className="card card-soft">Please login first.</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page">
        <div className="card card-soft">Loading profile...</div>
      </div>
    );
  }

  const pickProfileLocation = async () => {
    try {
      setLocLoading(true);

      const { lat, lng } = await getMyLocation();
      const { details } = await reverseGeocodeOSM(lat, lng);

      const country =
        details?.country ||
        details?.address?.country ||
        "";

      const city =
        details?.city ||
        details?.town ||
        details?.village ||
        details?.municipality ||
        details?.state_district ||
        details?.address?.city ||
        details?.address?.town ||
        details?.address?.village ||
        details?.address?.municipality ||
        details?.address?.state_district ||
        "";

      setForm((prev) => ({
        ...prev,
        country: country || prev.country,
        city: city || prev.city,
      }));
    } catch (e) {
      alert("Location permission denied or unavailable.");
    } finally {
      setLocLoading(false);
    }
  };

  const clearProfileLocation = () => {
    setForm((prev) => ({ ...prev, country: "", city: "" }));
  };

  const handleSave = async () => {
    const fd = new FormData();
    fd.append("firstname", form.firstname);
    fd.append("lastname", form.lastname);
    fd.append("bio", form.bio);
    fd.append("country", form.country || "");
    fd.append("city", form.city || "");

    if (avatarFile) fd.append("avatar", avatarFile);

    const { data } = await axios.put(`${API_BASE}/users/${me._id}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setUser(data.user);
    setEditMode(false);
    setAvatarFile(null);
  };

  const deletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    await axios.delete(`${API_BASE}/posts/${postId}`);
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const editPost = async (post) => {
    const text = window.prompt("Edit post text:", post.text || "");
    if (text === null) return;
    const { data } = await axios.patch(`${API_BASE}/posts/${post._id}`, { text });
    setPosts((prev) => prev.map((p) => (p._id === data.post._id ? data.post : p)));
  };

  const like = async (postId) => {
    const { data } = await axios.post(`${API_BASE}/posts/${postId}/like`, {
      userId: me._id,
    });
    setPosts((prev) => prev.map((p) => (p._id === data.post._id ? data.post : p)));
  };

  const comment = async (postId, text) => {
    const { data } = await axios.post(`${API_BASE}/posts/${postId}/comments`, {
      userId: me._id,
      text,
    });
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? {
              ...p,
              commentsCount: (p.commentsCount || 0) + 1,
              comments: [...(p.comments || []), data.comment],
            }
          : p
      )
    );
  };

  const fullName = `${user.firstname || ""} ${user.lastname || ""}`.trim() || "VOX User";

  // ✅ location label
  const profileLocationLabel = (() => {
    const cty = user.city || "";
    const ctr = user.country || "";
    if (!cty && !ctr) return "";
    return [cty, ctr].filter(Boolean).join(", ");
  })();

  // ✅ Preference: show location or hide it
  const showLocation = user?.preferences?.showProfileLocation !== false; // default true

  return (
    <div className="page">
      <div className="stack">
        <div className="page-head">
          <h2 className="h-title">Profile</h2>
          <p className="h-sub">Manage your information and posts.</p>
        </div>

        <div className="card card-soft profile-ig">
          <div className="profile-igTop">
            <div className="profile-igAvatarWrap">
              {user.avatarUrl ? (
                <img className="profile-igAvatar" src={`${API_BASE}${user.avatarUrl}`} alt="" />
              ) : (
                <div className="profile-igAvatar profile-igAvatarFallback">
                  {fullName?.[0]?.toUpperCase() || "V"}
                </div>
              )}
            </div>

            <div className="profile-igMeta">
              <div className="profile-igStats">
                <div className="profile-igStat">
                  <div className="profile-igStatNum">{posts.length}</div>
                  <div className="profile-igStatLbl">Posts</div>
                </div>
                <div className="profile-igStat">
                  <div className="profile-igStatNum">{followers.length}</div>
                  <div className="profile-igStatLbl">Followers</div>
                </div>
                <div className="profile-igStat">
                  <div className="profile-igStatNum">{following.length}</div>
                  <div className="profile-igStatLbl">Following</div>
                </div>
              </div>

              {!editMode ? (
                <div className="profile-igText">
                  <div className="profile-igName">{fullName}</div>
                  <div className="profile-igEmail">{user.email}</div>

                  {/* ✅ show location only if preference allows */}
                  {showLocation && profileLocationLabel ? (
                    <div className="h-sub" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <FiMapPin />
                      {profileLocationLabel}
                    </div>
                  ) : null}

                  {user.bio ? (
                    <div className="profile-igBio">{user.bio}</div>
                  ) : (
                    <div className="profile-igBio profile-igBioMuted">No bio yet.</div>
                  )}
                </div>
              ) : (
                <div className="profile-igEdit">
                  <div className="field">
                    <div className="label">First name</div>
                    <input
                      className="input"
                      value={form.firstname}
                      onChange={(e) => setForm({ ...form, firstname: e.target.value })}
                    />
                  </div>

                  <div className="field">
                    <div className="label">Last name</div>
                    <input
                      className="input"
                      value={form.lastname}
                      onChange={(e) => setForm({ ...form, lastname: e.target.value })}
                    />
                  </div>

                  <div className="field">
                    <div className="label">Bio</div>
                    <textarea
                      className="input"
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      placeholder="Write something about you..."
                    />
                  </div>

                  <div className="field">
                    <div className="label">Location (optional)</div>

                    <div className="row wrap">
                      <button
                        className="btn btn-ghost btn-block"
                        type="button"
                        onClick={pickProfileLocation}
                        disabled={locLoading}
                      >
                        {locLoading ? "Detecting..." : "Use my location"}
                      </button>

                      {(form.country || form.city) && (
                        <button className="btn btn-danger" type="button" onClick={clearProfileLocation}>
                          Remove
                        </button>
                      )}
                    </div>

                    {(form.country || form.city) && (
                      <div className="h-sub" style={{ marginTop: 6 }}>
                        Selected: {[form.city, form.country].filter(Boolean).join(", ")}
                      </div>
                    )}
                  </div>

                  <div className="field">
                    <div className="label">Avatar</div>
                    <input
                      className="file-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
              )}

              <div className="profile-igButtons">
                <button className="btn btn-primary" onClick={() => (editMode ? handleSave() : setEditMode(true))}>
                  {editMode ? "Save profile" : "Edit profile"}
                </button>

                {editMode && (
                  <button className="btn btn-primary" onClick={() => setEditMode(false)}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="page-head" style={{ marginTop: 6 }}>
          <h3 className="h-title" style={{ fontSize: 20, marginBottom: 0 }}>
            My Posts
          </h3>
          <p className="h-sub">Your recent posts.</p>
        </div>

        {posts.length === 0 && <div className="card card-soft">No posts yet.</div>}

        {posts.map((p) => (
          <PostCard
            key={p._id}
            post={p}
            onLike={() => like(p._id)}
            onComment={(text) => comment(p._id, text)}
            canEdit
            onEdit={() => editPost(p)}
            onDelete={() => deletePost(p._id)}
          />
        ))}
      </div>
    </div>
  );
}
