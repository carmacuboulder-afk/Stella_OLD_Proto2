import "../css/Docs.css";
import "katex/dist/katex.min.css";
import Demo from "../img/placeholder-vid.mov";
import placeholder from "../img/placeholder.jpg";
import { BlockMath } from "react-katex";



export default function Docs() {
  const formulas = [
    {
      title: "Reflectance",
      expression: "R_{\\lambda} = \\left(\\frac{I_{subject}}{I_{reference}}\\right) \\cdot C",
      description: "Reflectance tracks how much incoming light a surface reflects compared with a reference material. Higher values mean the surface is reflecting more of that wavelength; lower values mean it is absorbing more."
    },
    {
      title: "NDVI",
      expression: "NDVI = \\frac{R_{NIR} - R_{RED}}{R_{NIR} + R_{RED}}",
      description: "Normalized Difference Vegetation Index tracks vegetation density and health. Values near 1 usually indicate dense, healthy vegetation, values around 0 often indicate soil or non-living surfaces, and negative values often point to water."
    },
    {
      title: "SR",
      expression: "SR = \\frac{R_{NIR}}{R_{RED}}",
      description: "Simple Ratio tracks vegetation vigor by comparing near-infrared reflectance to red reflectance. Higher values generally suggest healthier or denser vegetation, while lower values suggest sparse or stressed cover."
    },
    {
      title: "DSWI 4",
      expression: "DSWI_4 = \\frac{R_{NIR} - R_{GREEN}}{R_{RED} + R_{GREEN}}",
      description: "Disease-Water Stress Index 4 tracks plant water stress. Lower or shifting values can indicate reduced water content or plant stress, while steadier values generally suggest less water stress."
    },
    {
      title: "NIRv",
      expression: "NIRv = NDVI \\cdot R_{NIR}",
      description: "Near-Infrared Reflectance of Vegetation tracks the portion of the near-infrared signal linked to vegetation. Higher values usually indicate stronger vegetation presence or productivity, especially in areas with patchy plant cover."
    },
  ];

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
            <ul style={{ marginBottom: "6px" }}>
                <li>Raw Data uses irradiance measured directly by STELLA, reported in uW/cm².</li>
                <li>Reflectance and vegetation-index formulas are rendered below so they stay sharp and readable at any size.</li>
                <li>You can manually choose which wavelengths are treated as RED and NIR in the Data Viewer. STELLA defaults are RED = 680nm and NIR = 810nm; a common research pairing is RED = 650nm and NIR = 860nm.</li>
                <li>The Data Viewer now focuses on the charts themselves, while the interpretation guide for each formula lives here in the docs.</li>
            </ul>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "0" }}>
                {formulas.map((formula) => (
                    <div
                        key={formula.title}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px"
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                maxWidth: "520px",
                                padding: "4px 0",
                                display: "flex",
                                justifyContent: "flex-start"
                            }}
                        >
                            <BlockMath math={formula.expression} />
                        </div>
                        <p style={{ margin: 0, maxWidth: "760px", lineHeight: 1.45 }}>{formula.description}</p>
                    </div>
                ))}
            </div>



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
