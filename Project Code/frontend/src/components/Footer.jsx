import nasaLogo from "../img/nasa-logo.png"
import cosgcLogo from "../img/cosgc-logo.jpeg"

export default function Footer() {
  return (
    <footer id="site-footer" style={{ 
      background: "#A1BC98", 
      padding: "2rem 4rem", 
      display: "flex", 
      justifyContent: "space-evenly",
      alignItems: "center",
      flexWrap: "nowrap",
      marginTop: "50px"
    }}>
      <a href="https://www.nasa.gov/" target="_blank" rel="noopener noreferrer">
        <img src={nasaLogo} style={{ width: "clamp(8rem, 12vw, 15rem)" }} />
      </a>
      <a href="https://www.colorado.edu/center/spacegrant/" target="_blank" rel="noopener noreferrer">
        <img src={cosgcLogo} style={{ width: "clamp(8rem, 12vw, 15rem)" }} />
      </a>
    </footer>
  );
}