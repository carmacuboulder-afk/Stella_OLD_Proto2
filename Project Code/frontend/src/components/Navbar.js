import { React, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/navbar.css";
import logo from "../img/stella_logo.PNG";


export default function Navbar({loggedIn, setLoggedIn}) {
  const nav = useNavigate();

  // when logout button is clicked from navbar run this
  const handleLogout = async() => {
    try {
      const response = await fetch("http://localhost:8000/api/users/logout", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // after logging out, redirect to login page
      setLoggedIn(false);
      nav("/login");
      return;
    }
    catch (err) {
      console.log(err);
    }
  }

  console.log("loggedIn: " + loggedIn);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <a href="./"><img src={logo} alt="Stella logo" className="navbar-logo" /></a>
      </div>

      <div className="navbar-links">
        <Link to="/docs">Documentation</Link>
        <Link to="/data">Data</Link>
        <Link to="/map">Map</Link>
        <Link to="/about">About Us</Link>
        <Link to="/faq">FAQ</Link>
        {loggedIn 
          ? <>
              <Link to="/login" onClick={handleLogout}>Logout</Link>
              <Link to="/account">Account</Link>
            </> 
          : <Link to="/login" className="login-link">Login</Link>
        }
      </div>
    </nav>
  );
}