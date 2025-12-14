// client/src/Components/PostCard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE } from "../api";
import { Link } from "react-router-dom";
import { FiMessageCircle, FiEdit3, FiTrash2, FiRepeat } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { useSelector } from "react-redux";

export default function PostCard({
  post,
  onLike,
  onComment,
  onRepost,
  canEdit,
  onEdit,
  onDelete,
}) {
  const [cmt, setCmt] = useState("");
  const me = useSelector((s) => s.users.user);
  const isLoggedIn = !!me?._id;

  // ✅ repost handling
  const isRepost = !!post?.repostOf;
  const originalPost = isRepost ? post.repostOf : post;

  // who reposted (the repost post author)
  const reposter = isRepost ? post.author : null;

  // original author
  const author = originalPost?.author;

  const isLiked = !!originalPost?.likes?.includes(me?._id);

  const authorLabel = useMemo(() => {
    if (!author) return "User";
    const fn = author.firstname || "";
    const ln = author.lastname || "";
    const full = `${fn} ${ln}`.trim();
    return full || author.email || "User";
  }, [author]);

  const reposterLabel = useMemo(() => {
    if (!reposter) return "";
    const fn = reposter.firstname || "";
    const ln = reposter.lastname || "";
    const full = `${fn} ${ln}`.trim();
    return full || reposter.email || "User";
  }, [reposter]);

  const initial = useMemo(
    () => (authorLabel?.[0] || "U").toUpperCase(),
    [authorLabel]
  );

  const [burst, setBurst] = useState(false);
  const burstTimer = useRef(null);

  const triggerBurst = () => {
    setBurst(true);
    if (burstTimer.current) clearTimeout(burstTimer.current);
    burstTimer.current = setTimeout(() => setBurst(false), 380);
  };

  useEffect(() => {
    return () => {
      if (burstTimer.current) clearTimeout(burstTimer.current);
    };
  }, []);

  const handleLike = () => {
    if (!isLoggedIn) return;
    if (!isLiked) triggerBurst();
    onLike && onLike();
  };

  const onDoubleClickLike = () => {
    if (!isLoggedIn) return;
    if (!isLiked) {
      triggerBurst();
      onLike && onLike();
    }
  };

  const send = () => {
    const text = cmt.trim();
    if (!text) return;
    onComment && onComment(text);
    setCmt("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const commentInputRef = useRef(null);
  const focusComment = () => commentInputRef.current?.focus();

  return (
    <div className="card card-soft post" onDoubleClick={onDoubleClickLike}>
      {/* ✅ repost banner (show only when reposter exists; avoid undefined names) */}
      {isRepost && reposter && (
        <div className="h-sub" style={{ marginBottom: 6 }}>
          🔁 Reposted by{" "}
          {[reposter.firstname, reposter.lastname].filter(Boolean).join(" ") || "User"}
        </div>
      )}

      <div className="post-head">
        <div className="post-user">
          {author?.avatarUrl ? (
            <img
              className="post-avatar"
              src={`${API_BASE}${author.avatarUrl}`}
              alt=""
              loading="lazy"
            />
          ) : (
            <div className="post-avatarFallback">{initial}</div>
          )}

          {author?._id ? (
            <Link className="post-author" to={`/users/${author._id}`}>
              {authorLabel}
            </Link>
          ) : (
            <div className="post-author">{authorLabel}</div>
          )}
        </div>
      </div>

      {originalPost?.text && <div className="post-text">{originalPost.text}</div>}

      {originalPost?.locationName && (
        <div className="h-sub" style={{ marginTop: 6 }}>
          📍 {originalPost.locationName}
        </div>
      )}

      {originalPost?.mediaUrl && (
        <div className="post-mediaWrap">
          <img
            className="post-media"
            src={`${API_BASE}${originalPost.mediaUrl}`}
            alt=""
            loading="lazy"
          />
          {burst && (
            <div className="like-burst" aria-hidden="true">
              <FaHeart />
            </div>
          )}
        </div>
      )}

      <div className="post-actions">
        <div className="icon-row">
          {/* Like */}
          <button
            className={[
              "icon-btn",
              "like-btn",
              isLiked ? "liked" : "",
              burst ? "burst" : "",
              !isLoggedIn ? "is-disabled" : "",
            ].join(" ")}
            type="button"
            onClick={handleLike}
            disabled={!isLoggedIn}
            title={isLoggedIn ? "Like" : "Login to like"}
            aria-label="Like"
          >
            <FaHeart className="heart-ico" />
          </button>

          <span className={["icon-count", burst ? "count-pop" : ""].join(" ")}>
            {originalPost?.likes?.length || 0}
          </span>

          {/* Comment button same style */}
          <button
            className="icon-btn"
            type="button"
            onClick={focusComment}
            title="Comment"
            aria-label="Comment"
          >
            <FiMessageCircle />
          </button>

          <span className="icon-count" title="Comments count">
            {originalPost?.commentsCount || 0}
          </span>

          {/* Repost */}
          {onRepost && (
            <>
              <button
                className={["icon-btn", !isLoggedIn ? "is-disabled" : ""].join(" ")}
                type="button"
                onClick={() => isLoggedIn && onRepost()}
                disabled={!isLoggedIn}
                title={isLoggedIn ? "Repost" : "Login to repost"}
                aria-label="Repost"
              >
                <FiRepeat />
              </button>

              <span className="icon-count">
                {(originalPost?.repostsCount ?? 0)}
              </span>
            </>
          )}

          {canEdit && (
            <>
              <button
                className="icon-btn"
                type="button"
                onClick={onEdit}
                title="Edit"
                aria-label="Edit"
              >
                <FiEdit3 />
              </button>
              <button
                className="icon-btn danger"
                type="button"
                onClick={onDelete}
                title="Delete"
                aria-label="Delete"
              >
                <FiTrash2 />
              </button>
            </>
          )}
        </div>

        {!isLoggedIn && (
          <div className="hint" style={{ marginTop: 6 }}>
            Login to interact with posts.
          </div>
        )}
      </div>

      {/* comments list */}
      {originalPost?.comments?.length > 0 && (
        <div className="stack">
          {originalPost.comments.map((c) => {
            const name =
              `${c?.author?.firstname || ""} ${c?.author?.lastname || ""}`.trim() ||
              c?.author?.email ||
              "User";
            const init = (name?.[0] || "U").toUpperCase();

            return (
              <div key={c._id} className="comment">
                {c?.author?.avatarUrl ? (
                  <img
                    className="comment-avatar"
                    src={`${API_BASE}${c.author.avatarUrl}`}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <div className="comment-avatarFallback">{init}</div>
                )}

                <div>
                  <div className="comment-name">{name}</div>
                  <div className="comment-text">{c.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* comment input */}
      {onComment && (
        <div className="comment-row">
          <input
            ref={commentInputRef}
            className="input"
            value={cmt}
            onChange={(e) => setCmt(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Write a comment..."
          />
          <button
            className="btn btn-primary"
            type="button"
            onClick={send}
            disabled={!cmt.trim()}
          >
            Comment
          </button>
        </div>
      )}
    </div>
  );
}
