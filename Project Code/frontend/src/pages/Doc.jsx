import "../css/Doc.css";
import Demo from "../img/demo_video.mp4";
import placeholder from "../img/placeholder.jpg"




export default function Doc() {
  return (
    <main className="doc">
        <div className="doc-content">
            <h1>Documentation & Help</h1>
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
            { /*upload data*/ }
            <h2 className="title">Uploading Data: </h2>
            <ul>
                <li>Accepted file formats (CSV, JSON, etc.)</li>
                <li>Manual entry options (if GPS missing)</li>
                <li>Troubleshooting: upload errors, invalid formats</li>
            </ul>
            { /*view map and data*/ }
            <h2 className="title">Viewing Data on the Map: </h2>
            <ul>
                <li>How to navigate, zoom, and toggle data</li>
                <li>Hovering for coordinates, timestamps, and notes</li>
                <li>Color meaning</li>
                <li>Example image of a dataset on the map</li>
            </ul>
            { /*graphing & analysing*/ }
            <h2 className="title">Graphing and Analyzing: </h2>
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
