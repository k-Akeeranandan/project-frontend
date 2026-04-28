import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    let parsedUser = null;

    if (userData && userData !== "undefined" && userData !== "null") {
      try {
        parsedUser = JSON.parse(userData);
      } catch (e) {
        console.warn("Failed to parse stored user data:", e);
      }
    }

    setIsLoggedIn(!!token);
    setUser(parsedUser);
  }, []);

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
      <h2>🎯 Career Fair</h2>

      <div className="nav-links">
        <Link to="/">Home</Link>
        {(!isLoggedIn || user?.role !== "ADMIN") && (
          <Link to="/events">Events</Link>
        )}
        
        {!isLoggedIn ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <>
            <Link to="/chat">Chat</Link>
            {user && user.role === 'ADMIN' && <Link to="/admin">Admin</Link>}
            <button
              onClick={handleLogout}
              style={{
                background: "#ff6b6b",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "600",
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => {
                e.target.style.background = "#ff5252";
                e.target.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "#ff6b6b";
                e.target.style.transform = "translateY(0)";
              }}
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