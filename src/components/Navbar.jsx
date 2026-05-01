import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem("user");
    if (!userData || userData === "undefined" || userData === "null") return null;
    try {
      return JSON.parse(userData);
    } catch (e) {
      console.warn("Failed to parse stored user data:", e);
      return null;
    }
  });
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
    navigate("/");
    window.location.reload();
  };

  return (
    <nav className="main-nav">
      <Link to="/" className="nav-brand" aria-label="Career Fair home">
        <span className="nav-brand-mark">CF</span>
        <span className="nav-brand-text">Career Fair</span>
      </Link>

      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        {(!isLoggedIn || user?.role !== "ADMIN") && (
          <Link to="/events" className="nav-link">Events</Link>
        )}
        
        {!isLoggedIn ? (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link nav-link-cta">Register</Link>
          </>
        ) : (
          <>
            <Link to="/chat" className="nav-link">Chat</Link>
            {user && user.role === 'ADMIN' && <Link to="/admin" className="nav-link">Admin</Link>}
            <button
              onClick={handleLogout}
              className="nav-logout"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
