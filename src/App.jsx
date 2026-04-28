import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import BoothDetails from "./pages/BoothDetails";
import BoothApplication from "./pages/BoothApplication";
import AdminDashboard from "./pages/AdminDashboard";
import Chat from "./pages/Chat";
import Navbar from "./components/Navbar";
import OAuthCallback from "./pages/OAuthCallback";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth2/callback" element={<OAuthCallback />} />
        <Route path="/events" element={<Events />} />
        <Route path="/event/:eventId" element={<EventDetails />} />
        <Route path="/booth/:id" element={<BoothDetails />} />
        <Route path="/booth/:id/apply" element={<BoothApplication />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;