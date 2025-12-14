// client/src/Components/SearchUsers.js
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { API_BASE } from "../api";
import PostCard from "./PostCard";
import { Form, FormGroup, Input, Button } from "reactstrap";

export default function SearchUsers() {
  const me = useSelector((s) => s.users.user);

  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);
  const [explore, setExplore] = useState([]);
  const [loadingExplore, setLoadingExplore] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    const loadExplore = async () => {
      try {
        setLoadingExplore(true);
        const { data } = await axios.get(`${API_BASE}/explore`);
        setExplore(data.posts || []);
      } finally {
        setLoadingExplore(false);
      }
    };
    loadExplore();
  }, []);

  const searchUsers = async (e) => {
    e.preventDefault();
    if (!q.trim()) {
      setUsers([]);
      return;
    }
    try {
      setLoadingUsers(true);
      const { data } = await axios.get(`${API_BASE}/search`, { params: { q } });
      setUsers(data.users || []);
    } finally {
      setLoadingUsers(false);
    }
  };

  const likePost = async (postId) => {
    if (!me?._id) return;
    const { data } = await axios.post(`${API_BASE}/posts/${postId}/like`, { userId: me._id });
    setExplore((prev) => prev.map((p) => {
      if (String(p._id) === String(data.post._id)) return data.post;
      if (p.repostOf && String(p.repostOf._id) === String(data.post._id)) return { ...p, repostOf: data.post };
      return p;
    }));
  };

  const addComment = async (postId, text) => {
    const { data } = await axios.post(`${API_BASE}/posts/${postId}/comments`, {
      userId: me._id,
      text,
    });

    setExplore((prev) =>
      prev.map((p) => {
        // original post
        if (String(p._id) === String(postId)) {
          const updated = { ...p };
          updated.commentsCount = (updated.commentsCount || 0) + 1;
          updated.comments = [...(updated.comments || []), data.comment];
          return updated;
        }

        // if this is a repost that points to original
        if (p.repostOf && String(p.repostOf._id) === String(postId)) {
          const updatedRepostOf = { ...p.repostOf };
          updatedRepostOf.commentsCount = (updatedRepostOf.commentsCount || 0) + 1;
          updatedRepostOf.comments = [...(updatedRepostOf.comments || []), data.comment];
          return { ...p, repostOf: updatedRepostOf };
        }

        return p;
      })
    );
  };

  // ✅ repost in explore (FIX: show real error + update counts everywhere)
  const repost = async (postId) => {
    try {
      if (!me?._id) return;

      const { data } = await axios.post(`${API_BASE}/posts/${postId}/repost`, {
        userId: me._id,
      });

      // ✅ add repost on top
      if (data.repost) setExplore((prev) => [data.repost, ...prev]);

      // ✅ update original repostsCount everywhere (post itself OR inside repostOf)
      if (data.original?._id) {
        setExplore((prev) =>
          prev.map((p) => {
            if (String(p._id) === String(data.original._id)) return data.original;
            if (p.repostOf && String(p.repostOf._id) === String(data.original._id)) {
              return { ...p, repostOf: data.original };
            }
            return p;
          })
        );
      }
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.message || e.message || "repost failed";
      alert(msg); // ✅ الآن يطلع السبب الحقيقي (مثل Already reposted)
    }
  };

  return (
    <div className="page">
      <div className="stack">
        <div className="page-head">
          <h2 className="h-title">Search & Explore</h2>
          <p className="h-sub">Find users and browse public posts.</p>
        </div>

        <div className="card card-soft stack">
          <Form onSubmit={searchUsers}>
            <FormGroup>
              <Input
                type="text"
                placeholder="Search users..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </FormGroup>

            <Button color="primary" block>
              {loadingUsers ? "Searching..." : "Search"}
            </Button>
          </Form>

          {users.length > 0 && (
            <div className="search-results">
              <hr />
              <div className="label">Users</div>
              <ul>
                {users.map((u) => {
                  const full =
                    `${u.firstname || ""} ${u.lastname || ""}`.trim() ||
                    u.email ||
                    "User";
                  const init = (full?.[0] || "U").toUpperCase();

                  return (
                    <li key={u._id}>
                      <Link to={`/users/${u._id}`} className="user-row">
                        {u.avatarUrl ? (
                          <img className="user-avatar" src={`${API_BASE}${u.avatarUrl}`} alt="" />
                        ) : (
                          <div className="user-avatarFallback">{init}</div>
                        )}

                        <div className="user-meta">
                          <div className="user-name">{full}</div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="page-head" style={{ marginTop: 8 }}>
          <h3 className="h-title" style={{ fontSize: 20, marginBottom: 0 }}>
            Explore Posts ({explore.length})
          </h3>
          <p className="h-sub">Latest posts from VOX.</p>
        </div>

        {loadingExplore && <div className="card card-soft">Loading posts...</div>}
        {!loadingExplore && explore.length === 0 && <div className="card card-soft">No posts yet in explore.</div>}

        {!loadingExplore &&
          explore.map((p) => (
            <PostCard
              key={p._id}
              post={p}
              onLike={() => likePost(p.repostOf?._id || p._id)}
              onComment={(text) => addComment(p.repostOf?._id || p._id, text)}
              onRepost={() => repost(p.repostOf?._id || p._id)}
            />
          ))}
      </div>
    </div>
  );
}
