import "../css/Home.css";
import backgroundImg from "../img/background.jpg";
import StellaDevice from "../img/stellaSpin.gif";
import importData from "../img/import_data.png";
import MaunalUpload from "../img/ManualUploadFile.png";



function Home() {
  return (
    <main className="home">

      {/* hero */}
      <div className="hero-container">
        <section
          className="hero"
          style={{ backgroundImage: `url(${backgroundImg})` }}
        >
          <div className="hero-overlay">
            <h2 className="hero-title">Explore Your World Through Data.</h2>
            <p className="hero-text">
              Upload your measurements, view real-time visualizations, and explore
              how light reveals the story of our Earth.
            </p>

            <div className="hero-buttons">
              <a href="./Data"><button>Upload Your Data</button></a>
              <a href="./Map"><button>View Live Map</button></a>
              <a href="./FAQ"><button>Learn More</button></a>
            </div>
          </div>
        </section>
      </div>

      {/* about */}
      <section className="home-about">
        <div className="home-about-text">
          <h2> What is <a href="https://science.gsfc.nasa.gov/stella/" target="_blank" rel="noopener noreferrer" >STELLA</a>? </h2>
          <p>
            STELLA (Science and Technology Education for Land/Life Assessment) is
            a compact, low-cost, open-source sensor device developed by NASA to
            help monitor plant health and environmental conditions. By measuring reflected light, 
            STELLA can detect signs of plant stress
            before they're visible to the human eye.
          </p>
          <br></br>

          <a href ="./Docs" style={{ fontWeight: "200", fontFamily: "Times New Romace" }}>How to build a STELLA device </a>
        </div>

        <div className="home-about-image">
          <img src={StellaDevice} />
          <p>STELLA 1.1 device.</p>
        </div> 
      </section>

      <hr className="divider"></hr>

      {/* instruction of how to import data */}
      <section className="home-importData">
        <div className="importData-content">
          <h3>Data gathered by STELLA spectrometers can be visualized and analyzed 
            from <a href="./Data">Data Page</a>, revealing details about the environment 
            that go beyond human sight.
          </h3>
          <h2>Data Import Options</h2>
          <ul>
            <li>1. Live USB Connection</li>
            <p>One data page, click <i>"Connect to STELLA"</i> and select the device from the browser’s serial dialog. Once connected, sensor readings will stream 
              in real time, and the page will fill in the metadata, environmental values, and spectral bands automatically.
            </p>
            <li>2. Manual File Upload</li>
            <p>If you have data saved from an SD card or another source, you can upload the file manually. The viewer will process 
              the file and populate the same fields you would see during a live session. If your browser does not support the 
              Web Serial API, try using Google Chrome, Microsoft Edge, or the manual upload option.
            </p>
          </ul>
        </div>
        <div className="importData-image">
          <img src={importData} />
          <p style={{padding: "8px 65px", fontFamily: "Times New Roman"}}>Browser dialog showing STELLA selected as a USB serial device.</p>
          <img src={MaunalUpload} />
          <p style={{padding: "8px 65px", fontFamily: "Times New Roman"}}>File upload interface for importing STELLA data from a local file.</p>
        </div>
      </section>

      <section className="home-cards">
        <a href="./Map" className="flex flex-col items-center bg-white p-6 border border-gray-300 rounded-lg shadow md:flex-row md:max-w-xl">
        <div className="flex flex-col justify-between md:p-4 leading-normal">
          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900"> Visualize your STELLA data on a map. </h5>
          <p className="mb-6 text-gray-700">
            Each data point shows its GPS location, date, and time — with options to zoom, toggle, 
            and explore where measurements were taken
          </p>
          <div>
            <button type="button" className="inline-flex items-center w-auto text-gray-800 bg-green-100 border border-gray-300 hover:bg-green-300 hover:text-gray-900 focus:ring-4 focus:ring-gray-200 shadow font-medium leading-5 rounded-full text-sm px-4 py-2.5 focus:outline-none"> View Map
              <svg className="w-4 h-4 ms-1.5 rtl:rotate-180 -me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m14 0-4 4m4-4-4-4"/>
              </svg>
            </button>
          </div>
        </div>
        </a>

        <a href="./Docs" className="flex flex-col items-center bg-white p-6 border border-gray-300 rounded-lg shadow md:flex-row md:max-w-xl">
        <div className="flex flex-col justify-between md:p-4 leading-normal">
          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900"> Build your STELLA device </h5>
          <p className="mb-6 text-gray-700">
            Learn how to assemble your own STELLA spectrometer with step-by-step build guides, parts lists, and setup instructions.
          </p>
          <div>
            <button type="button" className="inline-flex items-center w-auto text-gray-800 bg-green-100 border border-gray-300 hover:bg-green-300 hover:text-gray-900 focus:ring-4 focus:ring-gray-200 shadow font-medium leading-5 rounded-full text-sm px-4 py-2.5 focus:outline-none"> Read more
              <svg className="w-4 h-4 ms-1.5 rtl:rotate-180 -me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m14 0-4 4m4-4-4-4"/>
              </svg>
            </button>
          </div>
        </div>
        </a>

        <a href="./faq" className="flex flex-col items-center bg-white p-6 border border-gray-300 rounded-lg shadow md:flex-row md:max-w-xl">
        <div className="flex flex-col justify-between md:p-4 leading-normal">
          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900"> FAQ </h5>
          <p className="mb-6 text-gray-700">
            Have questions about building, uploading, or visualizing your STELLA data? Explore our FAQ to find quick answers, 
            troubleshooting tips, and setup guidance.
          </p>
          <div>
            <button type="button" className="inline-flex items-center w-auto text-gray-800 bg-green-100 border border-gray-300 hover:bg-green-300 hover:text-gray-900 focus:ring-4 focus:ring-gray-200 shadow font-medium leading-5 rounded-full text-sm px-4 py-2.5 focus:outline-none"> Read more
              <svg className="w-4 h-4 ms-1.5 rtl:rotate-180 -me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m14 0-4 4m4-4-4-4"/>
              </svg>
            </button>
          </div>
        </div>
        </a>

        
      </section>


    </main>
  );
}

export default Home;
