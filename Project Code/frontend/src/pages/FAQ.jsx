import "../css/FAQ.css"
import show_missing from "../img/show_missing_btn.png";


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
        <li className="question">What’s the difference between STELLA 1.1 and STELLA 1.2?</li>
        <p>STELLA-1.1 and STELLA-1.2 differ primarily in functionality and overall usability. STELLA-1.1 does not include built-in GPS capabilities, 
          requiring users to manually input latitude and longitude when location data is not available. In contrast, STELLA-1.2 integrates GPS positioning, 
          enabling automatic capture of geographic coordinates with each data point.
        </p>
      </ul>
      <h2>Uploading Data</h2>
      <ul>
        <li className="question">What file types can I upload?*</li>
        <p>Make sure your file is in CSV format before uploading.</p>
        <li className="question">Can I manually enter coordinates if my data doesn’t include GPS?</li>
        <p>Yes. After uploading your data, readings with coordinates will automatically appear on the map. 
          If a reading does not include coordinates, you can still access it on the Map page and manually entering the coordinates.
        </p>
        <li className="question">Manual entry options (if GPS missing)</li>
        <p>On the map page, use the <img src={show_missing} alt="Show Missing button" className="inline-btn"/> button to view readings without coordinates. Then, select a reading, enter the coordinates, and save it to display it on the map.</p>
        <li className="question">Troubleshooting: upload errors, invalid formats</li>
        <p>Make sure your file is in CSV format and follows the required structure. Check for missing or incorrectly formatted values, and ensure you are logged into your account before uploading.</p>
      </ul>

      <h2>Map and Visualization</h2>
      <ul>
        <li className="question">Why isn’t my data showing up on the map?</li>
        <p>Data will only appear on the map if coordinates are included. If your data does not have GPS coordinates, you can add them manually using the <img src={show_missing} alt="Show Missing button" className="inline-btn"/> button located in the top-right corner of the Map page. </p>
        
        <li className="question"> How to read data on Map page</li>
        <p>Click and drag to move around the map. Use the zoom controls or scroll to zoom in and out. You can also toggle datasets on or off to focus on specific readings.</p>
        
        <li className="question">What information is shown when hovering over a marker?</li>
        <p>Hover over markers to view key details such as coordinates, timestamps, device ID, and notes. This provides a quick overview of each data point directly on the map.</p>
      </ul>

            { /*graphing & analysing*/ }
      <h2>Graphing and Analyzing: </h2>
      <ul>
        <li className="question">Why do I get an error when uploading a data file?</li>
        <p>Please make sure you are logged into your account to upload data files.</p>
        <li className="question">How is NDVI calculated?</li>
        <p>Refer to the documentation page for detailed information.</p>
        

      </ul>

    </main>
  );
}

