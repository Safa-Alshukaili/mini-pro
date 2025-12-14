// client/src/Components/Register.js
import { useState } from "react";
import { useDispatch } from "react-redux";
import { register } from "../Features/userSlice";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ new field
  const [confirmPassword, setConfirmPassword] = useState("");

  const [err, setErr] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    // ✅ validate confirm password
    if (password !== confirmPassword) {
      setErr("Passwords do not match");
      return;
    }

    try {
      await dispatch(register({ firstname, lastname, email, password })).unwrap();
      navigate("/login");
    } catch (e2) {
      setErr(typeof e2 === "string" ? e2 : e2?.message || "Registration failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h2 className="auth-title">Register</h2>
        <p className="auth-sub">Create your VOX account</p>
        <hr />

        {err && (
          <div
            className="card"
            style={{
              borderColor: "rgba(255,77,77,0.35)",
              background: "rgba(255,77,77,0.08)",
              color: "var(--danger)",
              fontWeight: 900,
              marginBottom: 12,
            }}
          >
            {err}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <div className="label">First name</div>
              <input
                className="input"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                placeholder="Safa"
                required
              />
            </div>

            <div className="field" style={{ flex: 1 }}>
              <div className="label">Last name</div>
              <input
                className="input"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                placeholder="Alshukaili"
                required
              />
            </div>
          </div>

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
              placeholder="Min 4 characters"
              required
            />
          </div>

          {/* ✅ NEW: Confirm Password */}
          <div className="field">
            <div className="label">Confirm Password</div>
            <input
              className="input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
            />
          </div>

          <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
            <button className="btn btn-primary" type="submit">
              Create account
            </button>

            <span className="chip" style={{ opacity: 0.9 }}>
              VOX
            </span>
          </div>

          <div className="auth-foot">
            Have an account? <Link to="/login">Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
