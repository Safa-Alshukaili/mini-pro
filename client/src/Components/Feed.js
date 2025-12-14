// client/src/Components/Feed.js
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getFeed, likePost, addComment, repostPost } from "../Features/postSlice";
import PostCard from "./PostCard";

export default function Feed() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.users.user);
  const { items, error } = useSelector((s) => s.posts);

  useEffect(() => {
    if (user?._id) dispatch(getFeed(user._id));
  }, [user?._id, dispatch]);

  const doRepost = (p) => {
    const targetId = p.repostOf?._id || p._id;

    dispatch(repostPost({ postId: targetId, userId: user._id }))
      .unwrap()
      .catch((msg) => alert(msg)); // ✅ يظهر السبب الحقيقي
  };

  return (
    <div className="page">
      <div className="stack">
        <div className="page-head">
          <h2 className="h-title">Feed</h2>
          <p className="h-sub">Latest posts from people you follow.</p>
        </div>

        {items.length === 0 && <div className="card card-soft">No posts yet.</div>}

        {items.map((p) => (
          <PostCard
            key={p._id}
            post={p}
            onLike={() =>
              dispatch(likePost({ postId: (p.repostOf?._id || p._id), userId: user._id }))
            }
            onComment={(text) =>
              dispatch(addComment({ postId: (p.repostOf?._id || p._id), userId: user._id, text }))
            }
            onRepost={() => doRepost(p)}
          />
        ))}
      </div>
    </div>
  );
}
