// client/src/Components/Settings.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { API_BASE } from "../api";
import { logout } from "../Features/userSlice";
import { useNavigate } from "react-router-dom";
import {
  FiLock,
  FiSun,
  FiMoon,
  FiUser,
  FiBell,
  FiShield,
  FiTrash2,
  FiEyeOff,
  FiEye,
} from "react-icons/fi";

export default function Settings({ theme, onToggleTheme }) {
  const me = useSelector((s) => s.users.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(null);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [prefs, setPrefs] = useState({
    privateAccount: false,
    showProfileLocation: true,
    emailNotifications: true,
    pushNotifications: true,
  });

  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  useEffect(() => {
    const load = async () => {
      if (!me?._id) return;
      try {
        setLoading(true);
        const { data } = await axios.get(`${API_BASE}/users/${me._id}`);
        setUser(data.user);

        const p = data.user.preferences || {};
        setPrefs({
          privateAccount: !!p.privateAccount,
          showProfileLocation: p.showProfileLocation !== undefined ? !!p.showProfileLocation : true,
          emailNotifications: p.emailNotifications !== undefined ? !!p.emailNotifications : true,
          pushNotifications: p.pushNotifications !== undefined ? !!p.pushNotifications : true,
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [me?._id]);

  const createdLabel = useMemo(() => {
    if (!user?.createdAt) return "";
    const d = new Date(user.createdAt);
    return d.toLocaleDateString();
  }, [user?.createdAt]);

  if (!me?._id) {
    return (
      <div className="page">
        <div className="card card-soft">Please login first.</div>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="page">
        <div className="card card-soft">Loading settings...</div>
      </div>
    );
  }

  const savePreferences = async () => {
    try {
      setSavingPrefs(true);
      const { data } = await axios.patch(`${API_BASE}/users/${me._id}/preferences`, prefs);
      setUser(data.user);
      alert("Settings saved ✅");
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || "Saving settings failed");
    } finally {
      setSavingPrefs(false);
    }
  };

  const changePassword = async () => {
    const { currentPassword, newPassword, confirmNewPassword } = passForm;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return alert("Please fill all password fields.");
    }
    if (newPassword.length < 4) return alert("New password must be at least 4 characters.");
    if (newPassword !== confirmNewPassword) return alert("Confirm password does not match.");

    try {
      setChangingPass(true);
      await axios.patch(`${API_BASE}/users/${me._id}/password`, { currentPassword, newPassword });
      setPassForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      alert("Password changed ✅");
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || "Change password failed");
    } finally {
      setChangingPass(false);
    }
  };

  const deleteAccount = async () => {
    const ok = window.confirm("Are you sure you want to delete your account? This cannot be undone.");
    if (!ok) return;

    try {
      setDeleting(true);
      await axios.delete(`${API_BASE}/users/${me._id}`);
      await dispatch(logout());
      navigate("/login");
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || "Delete account failed");
    } finally {
      setDeleting(false);
    }
  };

  const themeLabel = theme === "dark" ? "Dark" : "Light";

  return (
    <div className="page settings-page">
      <div className="stack">
        <div className="page-head">
          <h2 className="h-title">Settings</h2>
          <p className="h-sub">Preferences, security, and account controls.</p>
        </div>

        {/* ===== Account Info (Read-only) ===== */}
        <div className="card card-soft settings-card">
          <div className="settings-title">
            <FiUser /> <span>Account</span>
          </div>

          <div className="settings-kv">
            <div className="settings-k">
              <div className="label">Email</div>
              <div className="settings-v">{user.email}</div>
            </div>

            <div className="settings-k">
              <div className="label">Member since</div>
              <div className="settings-v">{createdLabel || "—"}</div>
            </div>
          </div>
        </div>

        {/* ===== Preferences (NEW) ===== */}
        <div className="card card-soft settings-card">
          <div className="settings-title">
            <FiShield /> <span>Preferences</span>
          </div>

          <div className="settings-toggles">
            <label className="settings-toggle">
              <span className="settings-toggle-left">
                {prefs.privateAccount ? <FiEyeOff /> : <FiEye />}
                <span>
                  <b>Private Account</b>
                  <div className="h-sub">Only approved followers can see your posts (feature logic can be extended).</div>
                </span>
              </span>

              <input
                type="checkbox"
                checked={prefs.privateAccount}
                onChange={(e) => setPrefs((p) => ({ ...p, privateAccount: e.target.checked }))}
              />
            </label>

            <label className="settings-toggle">
              <span className="settings-toggle-left">
                <FiEye />
                <span>
                  <b>Show Profile Location</b>
                  <div className="h-sub">Show/hide your city & country on profile.</div>
                </span>
              </span>

              <input
                type="checkbox"
                checked={prefs.showProfileLocation}
                onChange={(e) => setPrefs((p) => ({ ...p, showProfileLocation: e.target.checked }))}
              />
            </label>
          </div>

          <button
            className="btn btn-primary btn-block"
            type="button"
            onClick={savePreferences}
            disabled={savingPrefs}
          >
            {savingPrefs ? "Saving..." : "Save Preferences"}
          </button>
        </div>

        {/* ===== Notifications (NEW) ===== */}
        <div className="card card-soft settings-card">
          <div className="settings-title">
            <FiBell /> <span>Notifications</span>
          </div>

          <div className="settings-toggles">
            <label className="settings-toggle">
              <span className="settings-toggle-left">
                <FiBell />
                <span>
                  <b>Email Notifications</b>
                  <div className="h-sub">Enable/disable notifications by email.</div>
                </span>
              </span>

              <input
                type="checkbox"
                checked={prefs.emailNotifications}
                onChange={(e) => setPrefs((p) => ({ ...p, emailNotifications: e.target.checked }))}
              />
            </label>

            <label className="settings-toggle">
              <span className="settings-toggle-left">
                <FiBell />
                <span>
                  <b>Push Notifications</b>
                  <div className="h-sub">Enable/disable in-app alerts (project option).</div>
                </span>
              </span>

              <input
                type="checkbox"
                checked={prefs.pushNotifications}
                onChange={(e) => setPrefs((p) => ({ ...p, pushNotifications: e.target.checked }))}
              />
            </label>
          </div>

          <button
            className="btn btn-primary btn-block"
            type="button"
            onClick={savePreferences}
            disabled={savingPrefs}
          >
            {savingPrefs ? "Saving..." : "Save Notification Settings"}
          </button>
        </div>

        {/* ===== Appearance ===== */}
        <div className="card card-soft settings-card">
          <div className="settings-title">
            {theme === "dark" ? <FiMoon /> : <FiSun />} <span>Appearance</span>
          </div>

          <div className="settings-row">
            <div className="h-sub">
              Theme: <b>{themeLabel}</b>
            </div>

            <button className="btn btn-ghost" type="button" onClick={onToggleTheme}>
              Toggle Theme
            </button>
          </div>
        </div>

        {/* ===== Security ===== */}
        <div className="card card-soft settings-card">
          <div className="settings-title">
            <FiLock /> <span>Security</span>
          </div>

          <div className="settings-grid">
            <div className="field">
              <div className="label">Current password</div>
              <input
                className="input"
                type="password"
                value={passForm.currentPassword}
                onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <div className="field">
              <div className="label">New password</div>
              <input
                className="input"
                type="password"
                value={passForm.newPassword}
                onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                placeholder="Min 4 characters"
              />
            </div>

            <div className="field">
              <div className="label">Confirm new password</div>
              <input
                className="input"
                type="password"
                value={passForm.confirmNewPassword}
                onChange={(e) => setPassForm({ ...passForm, confirmNewPassword: e.target.value })}
                placeholder="Repeat new password"
              />
            </div>
          </div>

          <button
            className="btn btn-primary btn-block"
            type="button"
            onClick={changePassword}
            disabled={changingPass}
          >
            {changingPass ? "Changing..." : "Change Password"}
          </button>
        </div>

        {/* ===== Danger Zone ===== */}
        <div className="card card-soft settings-card settings-danger">
          <div className="settings-title">
            <FiTrash2 /> <span>Danger Zone</span>
          </div>

          <div className="h-sub" style={{ marginBottom: 10 }}>
            Delete your account and all your posts. This cannot be undone.
          </div>

          <button className="btn btn-danger btn-block" type="button" onClick={deleteAccount} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
