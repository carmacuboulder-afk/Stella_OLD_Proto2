import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ display: "flex", gap: "1rem" }}>
      <Link to="/">Home</Link>
      <Link to="/data">Data</Link>
      <Link to="/map">Map</Link>
      <Link to="/about">About</Link>
      <Link to="/faq">FAQ</Link>
    </nav>
  );
}

