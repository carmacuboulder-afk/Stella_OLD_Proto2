/*import React, { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // The frontend requests data from the backend
    fetch(`${process.env.REACT_APP_API_URL}/hello`)
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData({ message: "Backend not reachable" }));
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "4rem" }}>
      <h1>STELLA</h1>
      {data ? (
        <>
          <p>{data.message}</p>
          <p>Visits: {data.totalVisits}</p>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
} 

export default App; */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Data from "./pages/Data";
import Map from "./pages/Map";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Docs from "./pages/Docs";
import Register from "./pages/Register";
import Footer from "./components/Footer";



function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/data" element={<Data />} />
        <Route path="/map" element={<Map />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/register" element={<Register />} />
      </Routes>
      <Footer></Footer>
    </Router>
  );
}

export default App;
