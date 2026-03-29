import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
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
import CreateOrg from "./pages/CreateOrg";
import OrgManage from "./pages/OrgManage";
import Footer from "./components/Footer";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [ownedOrgId, setOwnedOrgId] = useState(null);

  function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
      window.scrollTo(0, 0);
    }, [pathname]);
    return null;
  }

  const refreshUser = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/users/me", {
        credentials: "include",
      });
      if (!response.ok) {
        setLoggedIn(false);
        setOwnedOrgId(null);
        return;
      }
      const data = await response.json();
      setLoggedIn(true);
      setOwnedOrgId(data.owned_org_id || null);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} ownedOrgId={ownedOrgId} setOwnedOrgId={setOwnedOrgId} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/data" element={<Data />} />
        <Route path="/map" element={<Map />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/login" element={<Login setLoggedIn={setLoggedIn} refreshUser={refreshUser} />} />        
        <Route path="/register" element={<Register />} />
        <Route path="/account" element={<Account />} />
        <Route path="/orgs/create" element={<CreateOrg refreshUser={refreshUser} />} />
        <Route path="/orgs/:id/manage" element={<OrgManage refreshUser={refreshUser} />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;