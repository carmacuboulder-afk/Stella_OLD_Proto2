import React from "react";
import "../css/map.css";
import "leaflet/dist/leaflet.css";

import { useUser } from "../userContext";
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import { Icon } from "leaflet";

const stellaIcon = new Icon({
  iconUrl: require("../img/stellaPin.png"),
  iconSize: [32, 32]
})

// This is here for when we integrate EVA markers for map rendering.
const evaIcon = new Icon({
  iconUrl: require("../img/evaPin.png"),
  iconSize: [32, 32]
})

// const isValidLat = inputLat >= -90 && inputLat <= 90
// const isValidLng = inputLng >= -180 && inputLng <= 180
const isValidLat = inputLat >= -90 && inputLat <= 90 && !isNaN(inputLat);
const isValidLng = inputLng >= -180 && inputLng <= 180 && !isNaN(inputLng);

let lat = 40.0190; // Boulder Latitude
let long = -105.2747; // Boulder Longitude

function RecenterMap({ lat, lng }) {
    const map = useMap();

    useEffect(() => {
      if (lat && lng) {
        map.setView([lat, lng], 14);
      }
    }, [lat, lng, map]);

    return null;
}

const fetchPublicData = async () => {
  try {
    const res = await fetch(
      "http://localhost:8000/api/uploads/public"
    );
    const uploads = await res.json();

    if (!Array.isArray(uploads)) {
      console.error("Public uploads not array:", uploads);
      return;
    }

    const allData = await Promise.all(
      uploads.map(async (upload) => {
        const resData = await fetch(
          `http://localhost:8000/api/data/upload/${upload.id}`
        );
        return await resData.json();
      })
    );

    const flattenedData= allData.flat();

    const withCoords = flattenedData.filter(
      r => r.latitude != null && r.longitude != null
    );

    setPublicMarkers(withCoords);
  } 
  catch (err) {
    console.error("Error fetching public data:", err);
  }
};

export default function Map() {
  const { user, loading: userLoading } = useUser();
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCoords, setEditingCoords] = useState({});
  const [missingCoords, setMissingCoords] = useState([]);
  const [showMissingWindow, setShowMissingWindow] = useState(false);
  const [showPublic, setShowPublic] = useState(false);
  const [publicMarkers, setPublicMarkers] = useState([]);
  const [showEva, setShowEva] = useState(false);

  // Search Bar additions
  const [inputLat, setInputLat] = useState("");
  const [inputLng, setInputLng] = useState("");
  const [searchLat, setSearchLat] = useState(null);
  const [searchLng, setSearchLng] = useState(null);

  useEffect(() => {
    // Wait until we know if user is logged in.
    if (userLoading) return;

    async function fetchUserData() {
      try {
        let uploads;
        if(user) {
          uploads = await fetch(
              `http://localhost:8000/api/uploads/user/${user.id}`,
              { credentials: "include" }
          );
          if(user.lat != null && user.long != null) {
            lat = user.lat
            long = user.long;
          }
        }
        else {       
          uploads = await fetch(
            `http://localhost:8000/api/uploads/public`,
            { credentials: "include" }
          );
          setShowPublic(!showPublic);
        }
        const uploadData = await uploads.json();

        // Make sure it's an array
        if (!Array.isArray(uploadData)) {
          console.error("Uploads endpoint did not return an array:", uploadData);
          setLoading(false);
          return;
        }

        // Fetch all data readings for each upload
        const allData = await Promise.all(
          uploadData.map(async (upload) => {
            const resData = await fetch(
              `http://localhost:8000/api/data/upload/${upload.id}`,
              { credentials: "include" }
            );
            const data = await resData.json();

            return data.map((reading) => ({
              ...reading,
            }));
          })
        );

        // Flatten the upload data arrays
        const flattenedData = allData.flat();
        const dataMissingCoords = flattenedData.filter(r => r.latitude == null || r.longitude == null);
        const dataWithCoords = flattenedData.filter(r => r.latitude != null && r.longitude != null);

        setMarkers(dataWithCoords);
        setMissingCoords(dataMissingCoords);
      } 
      catch (err) {
        console.error("Error fetching uploads:", err);
      } 
      finally {
          setLoading(false);
      }
    }
    fetchUserData();
  }, [user, userLoading]);

  const cancelEdit = (id) => {
    setEditingCoords(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }

  const saveCoordinates = async (readingId) => {
    const coords = editingCoords[readingId];
    if (!coords || coords.lat === "" || coords.lng === "") {
      alert("Please enter both latitude and longitude");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/data/${readingId}/coordinates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: parseFloat(coords.lat),
          longitude: parseFloat(coords.lng),
        }),
      });

      if (!res.ok) throw new Error("Failed to save coordinates");

      // Update local state
      const reading = missingCoords.find(r => r.id === readingId);
      setMarkers(prev => [
        ...prev,
        {
          ...reading,
          latitude: parseFloat(coords.lat),
          longitude: parseFloat(coords.lng)
        }
      ]);
      setMissingCoords(prev => prev.filter(r => r.id !== readingId));

      cancelEdit(readingId);
    } 
    catch (err) {
      alert("Failed to save coordinates.");
    }
  }

  if (loading) return <p>Loading map data...</p>;

  return (
    /* MAP */
    <div class = "mapContainer">
      <div class = "mapBar">
        <div class = "mapSearchBar">
          <input
            type="number"
            placeholder="Latitude"
            value={inputLat}
            onChange={(e) => setInputLat(e.target.value)}
          />
          <input
            type="number"
            placeholder="Longitude"
            value={inputLng}
            onChange={(e) => setInputLng(e.target.value)}
          />
          <button
            disabled = {!isValidLat || !isValidLng}
            onClick={() => {
                const newLat = parseFloat(inputLat);
                const newLng = parseFloat(inputLng);
                if (isValidLat && isValidLng) {
                    setSearchLat(newLat);
                    setSearchLng(newLng);
                }
            }}
          >
          Go
          </button>
        </div>

        <div class = "mapButtons">

          <button class = "mapButton" id = "EVAButton">EVA</button>

          <button class = "mapButton" 
          id = "publicDataButton" 
          onClick={async () => {
              if (!showPublic) {
                await fetchPublicData();
              }
              setShowPublic(!showPublic);
            }}
          >
            {showPublic ? "Hide Public Data" : "Show Public Data"}
          </button>

          {missingCoords.length != 0 && (
            <button class = "mapButton" id = "missingDataButton" onClick = {() => setShowMissingWindow(!showMissingWindow)}>{showMissingWindow ? "Hide Missing" : "Show Missing"}</button>
          )}
          {showMissingWindow && (
            <div class="mapWindow">
              <h3>Data missing coordinates</h3>
              {missingCoords.length === 0 ? (
                <p>All readings have coordinates.</p>
              ) : (
                missingCoords.map(reading => (
                  <div class="noCoordEntry" key={reading.upload_id}>
                    <strong>Upload Number:</strong> {reading.upload_id}<br/>
                    <strong>Device Number:</strong> {reading.device_id}<br/>
                    <strong>Record Number:</strong> {reading.id}<br/>
                    <strong>Recorded On:</strong> {new Date(reading.timestamp_iso8601).toLocaleString()}<br/>
                    {editingCoords[reading.id] ? (
                      <div class="addCoordsForm">
                        <input
                          type="number"
                          step="any"
                          min="-90"
                          max="90"
                          placeholder="Latitude"
                          value={editingCoords[reading.id].lat}
                          onChange={(e) =>
                            setEditingCoords(prev => ({
                              ...prev,
                              [reading.id]: { ...prev[reading.id], lat: e.target.value }
                            }))
                          }
                        />
                        <input
                          type="number"
                          step="any"
                          min="-180"
                          max="180"
                          placeholder="Longitude"
                          value={editingCoords[reading.id].lng}
                          onChange={(e) =>
                            setEditingCoords(prev => ({
                              ...prev,
                              [reading.id]: { ...prev[reading.id], lng: e.target.value }
                            }))
                          }
                        />
                        <div class="formButtons">
                          <button id="saveButton" onClick={() => saveCoordinates(reading.id)}>Save</button>
                          <button id="cancelButton" onClick={() => cancelEdit(reading.id)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          setEditingCoords(prev => ({
                            ...prev,
                            [reading.id]: { lat: "", lng: "" }
                          }))
                        }
                      >
                      Add Coordinates
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>

      <MapContainer center={[lat, long]} zoom={13}>

        <RecenterMap lat={searchLat} lng={searchLng}/>

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> <a href="https://www.flaticon.com/free-icons/google-maps" title="maps and location icons">Icons: lalawidi</a>'
          url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {Array.isArray(markers) && markers.map((reading, idx) => {
          if (reading.latitude == null || reading.longitude == null) return null;

          return (
            <Marker
              key = {idx}
              position = {[reading.latitude, reading.longitude]}
              icon = {stellaIcon}
              eventHandlers={{
                mouseover: (event) => event.target.openPopup(),
                click: (event) => open('data')
              }}
            >
              <Popup class="mapPopup">
                <strong>Upload Number:</strong> {reading.upload_id}<br />
                <strong>Device Number:</strong> {reading.device_id}<br />
                <strong>Record Number:</strong> {reading.id}<br />
                <strong>Recorded On:</strong> {new Date(reading.timestamp_iso8601).toLocaleString()}<br />
                <strong>Coordinates:</strong> {reading.latitude}, {reading.longitude}<br />
              </Popup>
            </Marker>
          );
        })}

        {showPublic && publicMarkers.map((reading, idx) => {
          if (reading.latitude == null || reading.longitude == null) return null;

          return (
            <Marker
              key={`public-${idx}`}
              position={[reading.latitude, reading.longitude]}
              icon = {stellaIcon}
              eventHandlers={{
                mouseover: (event) => event.target.openPopup(),
                click: (event) => open('data')
              }}
            >
              <Popup>
                <strong>Upload Number:</strong> {reading.upload_id}<br />
                <strong>Device Number:</strong> {reading.device_id}<br />
                <strong>Record Number:</strong> {reading.id}<br />
                <strong>Recorded On:</strong> {new Date(reading.timestamp_iso8601).toLocaleString()}<br />
                <strong>Coordinates:</strong> {reading.latitude}, {reading.longitude}<br />
              </Popup>
            </Marker>
          );
        })}

      </MapContainer>
    </div>
  );
}