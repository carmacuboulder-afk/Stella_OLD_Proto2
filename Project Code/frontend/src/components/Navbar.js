import React from "react";
import { Link } from "react-router-dom";
import "../css/navbar.css";
import logo from "../img/stella_logo.PNG";


export default function Navbar() {
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
        <Link to="/login" className="login-link">Log In</Link>
      </div>
    </nav>
  );
}

