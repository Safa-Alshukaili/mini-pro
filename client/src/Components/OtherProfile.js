// client/src/Components/OtherProfile.js
import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../api";
import PostCard from "./PostCard";
import { useSelector } from "react-redux";

export default function OtherProfile() {
  const { id } = useParams();
  const me = useSelector((s) => s.users.user);

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState({ followers: 0, following: 0 });

  useEffect(() => {
    const load = async () => {
      const u = await axios.get(`${API_BASE}/users/${id}`);
      setUser(u.data.user);

      const p = await axios.get(`${API_BASE}/posts/by-user/${id}`);
      setPosts(p.data.posts || []);

      if (me?._id && me._id !== id) {
        const fs = await axios.get(
          `${API_BASE}/users/${id}/follow-status/${me._id}`
        );
        setIsFollowing(fs.data.isFollowing);
      }

      const st = await axios.get(`${API_BASE}/users/${id}/follow-stats`);
      setStats(st.data);
    };

    load();
  }, [id, me?._id]);

  const fullName = useMemo(() => {
    if (!user) return "User";
    return `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.email || "User";
  }, [user]);

  const toggleFollow = async () => {
    if (isFollowing) {
      await axios.post(`${API_BASE}/users/${id}/unfollow`, { userId: me._id });
      setIsFollowing(false);
      setStats((prev) => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
    } else {
      await axios.post(`${API_BASE}/users/${id}/follow`, { userId: me._id });
      setIsFollowing(true);
      setStats((prev) => ({ ...prev, followers: prev.followers + 1 }));
    }
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

  if (!user) {
    return (
      <div className="page">
        <div className="card card-soft">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="stack">
        {/* ✅ Instagram-like header */}
        <div className="card card-soft profile-ig">
          <div className="profile-igTop">
            <div className="profile-igAvatarWrap">
              {user.avatarUrl ? (
                <img
                  className="profile-igAvatar"
                  src={`${API_BASE}${user.avatarUrl}`}
                  alt=""
                />
              ) : (
                <div className="profile-igAvatarFallback">
                  {(fullName?.[0] || "U").toUpperCase()}
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
                  <div className="profile-igStatNum">{stats.followers}</div>
                  <div className="profile-igStatLbl">Followers</div>
                </div>
                <div className="profile-igStat">
                  <div className="profile-igStatNum">{stats.following}</div>
                  <div className="profile-igStatLbl">Following</div>
                </div>
              </div>

              <div className="profile-igText">
                <div className="profile-igName">{fullName}</div>
                {user.email && <div className="profile-igEmail">{user.email}</div>}
                {user.bio ? (
                  <div className="profile-igBio">{user.bio}</div>
                ) : (
                  <div className="profile-igBio profile-igBioMuted">No bio yet.</div>
                )}
              </div>

              {me?._id && me._id !== id && (
                <div className="profile-igButtons">
                  <button
                    className={`btn ${isFollowing ? "btn-ghost" : "btn-primary"}`}
                    onClick={toggleFollow}
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="page-head" style={{ marginTop: 6 }}>
          <h3 className="h-title" style={{ fontSize: 20, marginBottom: 0 }}>
            Posts
          </h3>
          <p className="h-sub">Posts by this user.</p>
        </div>

        {posts.length === 0 && <div className="card card-soft">No posts yet.</div>}

        {posts.map((p) => (
          <PostCard
            key={p._id}
            post={p}
            onLike={() => like(p._id)}
            onComment={(text) => comment(p._id, text)}
          />
        ))}
      </div>
    </div>
  );
}
