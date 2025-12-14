// client/src/App.js
import React, { useState } from "react";
import { Container, Row } from "reactstrap";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

import Header from "./Components/Header";
import Footer from "./Components/Footer";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";

import Login from "./Components/Login";
import Register from "./Components/Register";
import Feed from "./Components/Feed";
import Compose from "./Components/Compose";
import Profile from "./Components/Profile";
import SearchUsers from "./Components/SearchUsers";
import OtherProfile from "./Components/OtherProfile";
import Settings from "./Components/Settings"; // ✅ added

import { useSelector } from "react-redux";

export default function App() {
  const [theme, setTheme] = useState("dark");
  const user = useSelector((state) => state.users.user);

  const toggleTheme = () => setTheme((p) => (p === "light" ? "dark" : "light"));

  return (
    <Router>
      <div className={`app-root theme-${theme}`}>
        <Container fluid className="app-container">
          <Row>
            {user?._id ? <Header theme={theme} onToggleTheme={toggleTheme} /> : null}
          </Row>

          <Row className="main">
            <div className="page">
              <Routes>
                <Route path="/" element={user?._id ? <Feed /> : <Navigate to="/login" replace />} />
                <Route path="/compose" element={user?._id ? <Compose /> : <Navigate to="/login" replace />} />
                <Route path="/profile" element={user?._id ? <Profile /> : <Navigate to="/login" replace />} />
                <Route path="/search" element={user?._id ? <SearchUsers /> : <Navigate to="/login" replace />} />
                <Route path="/users/:id" element={user?._id ? <OtherProfile /> : <Navigate to="/login" replace />} />

                {/* ✅ Settings */}
                <Route
                  path="/settings"
                  element={
                    user?._id ? (
                      <Settings theme={theme} onToggleTheme={toggleTheme} />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </Row>

          <Row>
            <Footer brand="VOX" />
          </Row>
        </Container>
      </div>
    </Router>
  );
}
