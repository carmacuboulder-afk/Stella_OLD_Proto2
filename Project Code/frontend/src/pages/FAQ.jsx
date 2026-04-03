import React from "react";
import "../css/FAQ.css"

export default function FAQ() {
  return (
    <main className="faq">
      <h1>Frequently Asked Questions</h1>
      <p className="faq-intro">Find quick solutions and helpful tips for building your STELLA device, uploading data, and exploring your measurements on the map.</p>
      <h2>General</h2>
      <ul>
        <li className="question">What is STELLA, and what does it do?</li>
        <p>
          STELLA (Science and Technology Education for Land/Life Assessment) is a portable environmental sensing system developed by NASA to collect real-time data about the Earth’s surface.
          It uses advanced sensors to measure properties such as light reflectance, temperature, and other environmental conditions. 
          This data helps scientists, students, and researchers better understand ecosystems, monitor environmental changes, and support climate research.

        </p>
        <li className="question">What’s the difference between STELLA 1.1 and STELLA 1.2?*</li>
        <p>Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. </p>
      </ul>
      <h2>Uploading Data</h2>
      <ul>
        <li className="question">What file types can I upload?*</li>
        <p>Accepted file formats (CSV, JSON, etc.)</p>
        <li className="question">Can I manually enter coordinates if my data doesn’t include GPS?</li>
        <p>Yes. After uploading your data, readings with coordinates will automatically appear on the map. 
          If a reading does not include coordinates, you can still access it on the map page and add coordinates manually.</p>
        <li className="question">Manual entry options (if GPS missing)</li>
        <p>On the map page, use the “Missing Data” option to view readings without coordinates. From there, select a reading, enter the coordinates, and save to display it on the map.</p>
        <li className="question">Troubleshooting: upload errors, invalid formats</li>
        <p>Loren ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. </p>
      </ul>

      <h2>Map and Visualization</h2>
      <ul>
        <li className="question">What do the colors or markers on the map represent?</li>
        <p>Markers represent individual data readings. Each marker is placed based on the coordinates assigned to that reading.</p>
        
        <li className="question">Why isn’t my data showing up on the map?</li>
        <p>Data will only appear on the map if coordinates are included. If your data does not have GPS coordinates, you can add them manually using the “Missing Data” option on the map page. </p>
        
        <li className="question"> How to navigate, zoom, and toggle data</li>
        <p>Loren ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor</p>
        
        <li className="question">Hovering for coordinates, timestamps, and notes</li>
        <p>Loren ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
          Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex</p>
      </ul>

            { /*graphing & analysing*/ }
      <h2>Graphing and Analyzing: </h2>
      <ul>
        <li className="question">How to select parameters (NDVI, SR, Reflectance)</li>
        <p>Loren ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor</p>
        <li className="question">How NDVI is calculated</li>
        <p>NDVI (Normalized Difference Vegetation Index) is a value between -1 and 1 used to measure vegetation health.
          <ul>
            <li>Values close to 1 indicate dense, healthy vegetation</li>
            <li>Values near 0 indicate little or no vegetation</li>
            <li>Values near -1 typically represent water</li>
          </ul>

          NDVI is calculated using reflectance values from two wavelengths:

          <ul>
            <li>NIR (Near-Infrared)</li>
            <li>RED (Red light)</li>
          </ul>

          Reflectance represents how much light a surface reflects compared to a reference material. To improve accuracy, the reference can be adjusted if it does not reflect 100% of light.</p>
        <li className="question">What wavelengths does STELLA use?</li>
        <p>There is no single standard for NIR and RED wavelengths. Different systems use slightly different values:

          <ul>
            <li>STELLA Data Viewer: 680 nm (RED), 810 nm (NIR)</li>
            <li>Our implementation: 650 nm (RED), 860 nm (NIR)</li>
          </ul>

          These values are chosen to better align with common research practices.</p>
        <li>How to download results</li>
        <p>Loren ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore</p>
      </ul>

    </main>
  );
}

