import "../css/Docs.css";
import Demo from "../img/placeholder-vid.mov";
import placeholder from "../img/placeholder.jpg"



export default function Docs() {
  return (
    <main className="doc">
        <div className="doc-content">
            <h1>Build & Use Your STELLA</h1>
            <p> New to STELLA? Start by assembling your device, collecting your first dataset, and uploading it to the Data Viewer for visualization.</p>
            <p className="overview">Overview: Build → Collect → Upload → Visualize → Analyze</p>
            { /*build*/ }
            <h2 className="title">Build: </h2>
            <h3>What you need:</h3>
            <ul> 
                <li>Loren ipsum dolor sit amet</li>
                <li>Consectetur adipiscing elit</li>
                <li>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua</li>
            </ul>
            <h3>Instruction:</h3>
            <p><a href="https://science.gsfc.nasa.gov/stella/" target="_blank" rel="noopener noreferrer" >STELLA 1.1 Schematic:</a> 
                Visual reference of all circuit connections and components.</p>
            <p><a href="https://drive.google.com/drive/folders/12wz5GZQ3PMFtpqhvHb7AVFFuGYD9Lec8?usp=drive_link" target="_blank" rel="noopener noreferrer" >Build Tutorial Videos:</a> 
                Step-by-step walkthroughs for assembling and testing the device.</p>
            {/* COLLECT */}
            <h2 className="title">Collect Measurements</h2>
            <ul>
                <li>Power on STELLA and wait for the device to finish booting.</li>
                <li>Point the sensor at your target (canopy, soil, calibration panel).</li>
                <li>Trigger a measurement using the button or interface specified in the build guide.</li>
                <li>Data is saved to the SD card (and may include GPS, date, and time).</li>
            </ul>
            { /*upload data*/ }
            <h2 className="title">Uploading Data: </h2>
            <ul>
                <li>Insert the SD card into your computer and select your data file.</li>
                <li>On the Upload page, choose your STELLA version (1.1 or 1.2).</li>
                <li>Upload the file.</li>
                <li>If your dataset doesn’t include GPS, you can manually enter coordinates.</li>
            </ul>
            <p className="note">Troubleshooting: Common issues include unsupported file formats and missing data columns. See the FAQ for help.</p>

            { /*view map and data*/ }
            <h2 className="title">View Data on the Map: </h2>
            <ul>
                <li>How to navigate, zoom, and toggle data</li>
                <li>Hovering for coordinates, timestamps, and notes</li>
                <li>Color meaning</li>
                <li>Example image of a dataset on the map</li>
            </ul>
            { /*graphing & analysing*/ }
            <h2 className="title">Graph & Analyze Your Data: </h2>
            <ul>
                <li>How to select parameters (NDVI, SR, Reflectance)</li>
                <li>How NDVI is calculated</li>
                <li>How to download results</li>
                <li>Example graphs or step-by-step instructions</li>
            </ul>



        </div>
        <div className="doc-image">
            { /*tutorial video*/}
            <video className="video" controls>
            <source src={Demo} type="video/mp4"/>
            Your browser does not support the video tag.
            </video>
            <br></br>
            <p>Build Tutorial Videos: Step-by-step walkthroughs for assembling and testing the device.</p>
            { /*example images*/ }
            <img src={placeholder}/>
            <img src={placeholder}/>
                
        </div>


    </main>
  );
}


