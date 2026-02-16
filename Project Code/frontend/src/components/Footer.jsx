import React from "react";
import { Link } from "react-router-dom";
import nasaLogo from "../img/nasa-logo.png"
import cosgcLogo from "../img/cosgc-logo.jpeg"



export default function Footer() {
  return (
    <footer style={{ 
                    background: "#A1BC98",  
                    display: "flex", 
                    justifyContent: "center", 
                    gap: "20rem", 
                    marginTop: "50px",
                    padding: "10px"
                    }}>
        <a href = "https://www.nasa.gov/" target="_blank" rel="noopener noreferrer"><img src={nasaLogo} style={{ width: "15rem" }} /></a>
        <a href = "https://www.colorado.edu/center/spacegrant/" target="_blank" rel="noopener noreferrer"><img src={cosgcLogo} style={{ width: "15rem" }} /></a>

    </footer>
  );
}
