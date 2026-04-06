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

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from "./userContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Data from "./pages/Data";
import Map from "./pages/Map";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Docs from "./pages/Docs";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import Footer from "./components/Footer";


function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  // check if the user is logged in via cookies, display certain links on navbar based on this
  const checkLogin = async() => {
    try {
      const response = await fetch("http://localhost:8000/api/users/status", {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        setLoggedIn(false);
        return;
      }
      else if (response.status === 400) {
        return;
      }

      setLoggedIn(true);
    }
    catch (err) {
      console.log(err);
    }
  }

  // only call once per render
  useEffect(() => {
    checkLogin();
  }, []);

  return (
    <UserProvider>
      <Router>
        <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn}/>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/data" element={<Data />} />
          <Route path="/map" element={<Map />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/login" element={<Login setLoggedIn={setLoggedIn}/>} />
          <Route path="/register" element={<Register />} />
          <Route path="/account" element={<Account />} />
        </Routes>
        <Footer></Footer>
      </Router>
    </UserProvider>
  );
}

export default App;
