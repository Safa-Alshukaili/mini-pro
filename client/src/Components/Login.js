// client/src/Components/Login.js
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../Features/userSlice";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading, isSuccess } = useSelector((s) => s.users);

  const submit = (e) => {
    e.preventDefault();
    dispatch(login({ email, password }));
  };

  useEffect(() => {
    if (user?._id || isSuccess) navigate("/");
  }, [user, isSuccess, navigate]);

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h2 className="auth-title">Login</h2>
        <p className="auth-sub">Welcome back to VOX</p>
        <hr />

        <form onSubmit={submit}>
          <div className="field">
            <div className="label">Email</div>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="field">
            <div className="label">Password</div>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
            <button className="btn btn-primary" type="submit" disabled={isLoading}>
              {isLoading ? "Loading..." : "Login"}
            </button>

            <span className="chip" style={{ opacity: 0.9 }}>
              VOX
            </span>
          </div>

          <div className="auth-foot">
            No account? <Link to="/register">Register</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
