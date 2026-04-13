import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../userContext";
import "../css/navbar.css";
import logo from "../img/stella_logo.PNG";

export default function Navbar({ loggedIn, setLoggedIn, ownedOrgId, setOwnedOrgId }) {
  const nav = useNavigate();

  const { setUser } = useUser();

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/users/logout", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Logout failed");
      setLoggedIn(false);
      setOwnedOrgId(null);
      setUser(null);
      nav("/login");
    } 
    catch (err) {
      console.log(err);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <a href="/"><img src={logo} alt="Stella logo" className="navbar-logo" /></a>
      </div>
      <div className="navbar-links">
        <Link to="/data">Data</Link>
        <Link to="/map">Map</Link>
        <div className="resources-menu">
          <button className="resources-btn">Resources ▾</button>
          <div className="resources-dropdown">
            <Link to="/about">About Us</Link>
            <Link to="/faq">FAQ</Link>
            <Link to="/docs">Documentation</Link>
          </div>
        </div>
        {loggedIn
          ? (
            <div className="account-menu">
              <button className="account-btn">Account ▾</button>
              <div className="account-dropdown">
                <Link to="/account">My Account</Link>
                {ownedOrgId
                  ? <Link to={`/orgs/${ownedOrgId}/manage`}>Manage Organization</Link>
                  : <Link to="/orgs/create">Create Organization</Link>
                }
                <button onClick={handleLogout} className="logout-button">Logout</button>
              </div>
            </div>
          )
          : <Link to="/login" className="login-link">Login</Link>
        }
      </div>
    </nav>
  );
}