// client/src/Components/Header.js
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../Features/userSlice";

/* Reactstrap */
import { Navbar, NavbarBrand, Nav, NavItem, NavLink } from "reactstrap";

/* Icons */
import {
  FiHome,
  FiEdit,
  FiUser,
  FiSearch,
  FiSun,
  FiMoon,
  FiLogOut,
  FiSettings, // ✅ added
} from "react-icons/fi";

export default function Header({ theme, onToggleTheme }) {
  const user = useSelector((state) => state.users.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // لا يظهر الهيدر بدون تسجيل دخول
  if (!user?._id) return null;

  const doLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <Navbar expand="md" className="topbar">
      {/* Left */}
      <div className="topbar-left">
        <NavbarBrand className="brand">VOX</NavbarBrand>

        <Nav navbar className="topnav-icons">
          <NavItem>
            <NavLink tag={Link} to="/" title="Feed" className="icon-btn" aria-label="Feed">
              <FiHome />
            </NavLink>
          </NavItem>

          <NavItem>
            <NavLink
              tag={Link}
              to="/compose"
              title="Compose"
              className="icon-btn"
              aria-label="Compose"
            >
              <FiEdit />
            </NavLink>
          </NavItem>

          <NavItem>
            <NavLink
              tag={Link}
              to="/profile"
              title="Profile"
              className="icon-btn"
              aria-label="Profile"
            >
              <FiUser />
            </NavLink>
          </NavItem>

          <NavItem>
            <NavLink
              tag={Link}
              to="/search"
              title="Search"
              className="icon-btn"
              aria-label="Search"
            >
              <FiSearch />
            </NavLink>
          </NavItem>

          {/* ✅ Settings */}
          <NavItem>
            <NavLink
              tag={Link}
              to="/settings"
              title="Settings"
              className="icon-btn"
              aria-label="Settings"
            >
              <FiSettings />
            </NavLink>
          </NavItem>
        </Nav>
      </div>

      {/* Right */}
      <div className="topbar-right">
        {/* Theme toggle */}
        <button
          className="icon-btn"
          onClick={onToggleTheme}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
          aria-label="Toggle theme"
          type="button"
        >
          {theme === "dark" ? <FiSun /> : <FiMoon />}
        </button>

        {/* Username */}
        <div className="chip">{user.firstname}</div>

        {/* Logout */}
        <button
          className="icon-btn danger"
          onClick={doLogout}
          title="Logout"
          aria-label="Logout"
          type="button"
        >
          <FiLogOut />
        </button>
      </div>
    </Navbar>
  );
}
