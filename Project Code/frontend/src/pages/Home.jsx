import "../css/Home.css";
import heroImg from "../img/background_hero.png";
import backgroundImg from "../img/background.jpg";
import StellaDevice from "../img/stellaSpin.gif";
import placeholder from "../img/placeholder.jpg";


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
              <a href="./Doc"><button>Learn More</button></a>
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
            from <a href="./Data.js">Data Page</a>, revealing details about the environment 
            that go beyond human sight.
          </h3>
          <h2>Step by Step Tutorial on How to Import Data</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut 
            labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
            nisi ut aliquip ex ea commodo consequat. <br></br><br></br>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </p>
        </div>
        <div className="importData-image">
          <img src={placeholder} />
          <img src={placeholder} />
        </div>
      </section>

      <section className="home-cards">
        <a href="./Map" className="flex flex-col items-center bg-white p-6 border border-gray-300 rounded-lg shadow md:flex-row md:max-w-xl">
        <img className="object-cover w-full rounded-lg h-64 md:h-auto md:w-48 mb-4 md:mb-0" src={placeholder}/>
        <div className="flex flex-col justify-between md:p-4 leading-normal">
          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900"> Visualize your STELLA data directly on an interactive map. </h5>
          <p className="mb-6 text-gray-700">
            Each data point shows its GPS location, date, and time — with options to zoom, toggle, 
            and explore where measurements were taken
          </p>
          <div>
            <button type="button" className="inline-flex items-center w-auto text-gray-800 bg-gray-200 border border-gray-300 hover:bg-gray-300 hover:text-gray-900 focus:ring-4 focus:ring-gray-200 shadow font-medium leading-5 rounded-full text-sm px-4 py-2.5 focus:outline-none"> Read more
              <svg className="w-4 h-4 ms-1.5 rtl:rotate-180 -me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m14 0-4 4m4-4-4-4"/>
              </svg>
            </button>
          </div>
        </div>
        </a>

        <a href="./Documentation.jsx" className="flex flex-col items-center bg-white p-6 border border-gray-300 rounded-lg shadow md:flex-row md:max-w-xl">
        <img className="object-cover w-full rounded-lg h-64 md:h-auto md:w-48 mb-4 md:mb-0" src={placeholder}/>
        <div className="flex flex-col justify-between md:p-4 leading-normal">
          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900"> Build your STELLA device </h5>
          <p className="mb-6 text-gray-700">
            Learn how to assemble your own STELLA spectrometer with step-by-step build guides, parts lists, and setup instructions.
          </p>
          <div>
            <button type="button" className="inline-flex items-center w-auto text-gray-800 bg-gray-200 border border-gray-300 hover:bg-gray-300 hover:text-gray-900 focus:ring-4 focus:ring-gray-200 shadow font-medium leading-5 rounded-full text-sm px-4 py-2.5 focus:outline-none"> Read more
              <svg className="w-4 h-4 ms-1.5 rtl:rotate-180 -me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m14 0-4 4m4-4-4-4"/>
              </svg>
            </button>
          </div>
        </div>
        </a>

        <a href="./FAQ.jsx" className="flex flex-col items-center bg-white p-6 border border-gray-300 rounded-lg shadow md:flex-row md:max-w-xl">
        <img className="object-cover w-full rounded-lg h-64 md:h-auto md:w-48 mb-4 md:mb-0" src={placeholder}/>
        <div className="flex flex-col justify-between md:p-4 leading-normal">
          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900"> FAQ </h5>
          <p className="mb-6 text-gray-700">
            Have questions about building, uploading, or visualizing your STELLA data? Explore our FAQ to find quick answers, 
            troubleshooting tips, and setup guidance.
          </p>
          <div>
            <button type="button" className="inline-flex items-center w-auto text-gray-800 bg-gray-200 border border-gray-300 hover:bg-gray-300 hover:text-gray-900 focus:ring-4 focus:ring-gray-200 shadow font-medium leading-5 rounded-full text-sm px-4 py-2.5 focus:outline-none"> Read more
              <svg className="w-4 h-4 ms-1.5 rtl:rotate-180 -me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m14 0-4 4m4-4-4-4"/>
              </svg>
            </button>
          </div>
        </div>
        </a>

      {/*<div className="bg-slate-50 block max-w-sm border border-gray-200 rounded-lg shadow-sm vertical">
        <a href="#"><img className="rounded-t-lg" src={placeholder}/></a>
        <div className="p-6 text-center">
          <a href="#"> <h5 className="mt-3 mb-6 text-2xl font-semibold tracking-tight text-gray-900">Streamlining your design process today.</h5></a>
          <a href="#" className="inline-flex items-center text-white bg-blue-600 box-border border border-transparent hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 shadow-sm font-medium leading-5 rounded-lg text-sm px-4 py-2.5 focus:outline-none">
            Read more
            <svg className="w-4 h-4 ms-1.5 rtl:rotate-180 -me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m14 0-4 4m4-4-4-4"/>
            </svg>
          </a>
        </div>
      </div>
      
      <div className="bg-slate-50 block max-w-sm border border-gray-200 rounded-lg shadow-sm vertical">
        <a href="#"><img className="rounded-t-lg" src={placeholder}/></a>
        <div className="p-6 text-center">
          <a href="#"> <h5 className="mt-3 mb-6 text-2xl font-semibold tracking-tight text-gray-900">Streamlining your design process today.</h5></a>
          <a href="#" className="inline-flex items-center text-white bg-blue-600 box-border border border-transparent hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 shadow-sm font-medium leading-5 rounded-lg text-sm px-4 py-2.5 focus:outline-none">
            Read more
            <svg className="w-4 h-4 ms-1.5 rtl:rotate-180 -me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m14 0-4 4m4-4-4-4"/>
            </svg>
          </a>
        </div>
      </div>

      <div className="bg-slate-50 block max-w-sm border border-gray-200 rounded-lg shadow-sm vertical">
        <a href="#"><img className="rounded-t-lg" src={placeholder}/></a>
        <div className="p-6 text-center">
          <a href="#"> <h5 className="mt-3 mb-6 text-2xl font-semibold tracking-tight text-gray-900">Streamlining your design process today.</h5></a>
          <a href="#" className="inline-flex items-center text-white bg-blue-600 box-border border border-transparent hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 shadow-sm font-medium leading-5 rounded-lg text-sm px-4 py-2.5 focus:outline-none">
            Read more
            <svg className="w-4 h-4 ms-1.5 rtl:rotate-180 -me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m14 0-4 4m4-4-4-4"/>
            </svg>
          </a>
        </div>
      </div>*/}

        
      </section>


    </main>
  );
}

export default Home;
