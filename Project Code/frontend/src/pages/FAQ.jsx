import React from "react";
import "../css/FAQ.css"

export default function FAQ() {
  return (
    <main className="faq">
      <h1>Frequently Asked Questions</h1>
      <p className="faq-intro">Find quick solutions and helpful tips for building your STELLA device, uploading data, and exploring your measurements on the map.</p>
      <h2>General</h2>
      <ul>
        <li>What is STELLA and what does it do?</li>
        <p>Loren ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. </p>
        <li>What’s the difference between STELLA 1.1 and STELLA 1.2?</li>
        <p>Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. </p>
      </ul>
      <h2>Uploading Data</h2>
      <ul>
        <li>What file types can I upload?</li>
        <p>Accepted file formats (CSV, JSON, etc.)</p>
        <li>Can I manually enter coordinates if my data doesn’t include GPS?</li>
        <p>Loren ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. </p>
        <li>Manual entry options (if GPS missing)</li>
        <p>Loren ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
          Ut enim ad minim veniam</p>
        <li>Troubleshooting: upload errors, invalid formats</li>
        <p>Loren ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. </p>
      </ul>

      <h2>Map and Visualization</h2>
      <ul>
        <li>What do the colors or markers on the map represent?</li>
        <p>Loren ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. </p>
        <li>Why isn’t my data showing up on the map?</li>
        <p>Loren ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. </p>
        <li>How to navigate, zoom, and toggle data</li>
        <p>Loren ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor</p>
        <li>Hovering for coordinates, timestamps, and notes</li>
        <p>Loren ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex</p>
      </ul>

            { /*graphing & analysing*/ }
      <h2>Graphing and Analyzing: </h2>
      <ul>
        <li>How to select parameters (NDVI, SR, Reflectance)</li>
        <p>Loren ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor</p>
        <li>How NDVI is calculated</li>
        <p>Loren ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore Loren ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        <li>How to download results</li>
        <p>Loren ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore</p>
      </ul>

    </main>
  );
}

