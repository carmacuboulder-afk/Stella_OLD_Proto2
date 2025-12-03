import React from "react";
import { Link } from "react-router-dom";
import "../css/navbar.css";
import logo from "../img/stella_logo.png";


export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <img src={logo} alt="Stella logo" className="nav-logo" />
      </div>

      <div className="nav-right">
        <Link to="/docs" className="nav-link">Documentation</Link>
        <Link to="/data" className="nav-link">Data</Link>
        <Link to="/map" className="nav-link">Map</Link>
        <Link to="/about" className="nav-link">About Us</Link>
        <Link to="/faq" className="nav-link">FAQ</Link>
        <Link to="/login" className="nav-link">Log In</Link>
      </div>
    </nav>
  );
}

