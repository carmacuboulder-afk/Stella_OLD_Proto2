import React from "react";
import "../css/map.css";
import "leaflet/dist/leaflet.css";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import { Icon } from "leaflet";

import { useMap } from "react-leaflet";
// import { useEffect } from "react";

function RecenterMap({ lat, lng }) {
    const map = useMap();

    useEffect(() => {
      if (lat && lng) {
        map.setView([lat, lng], 14);
      }
    }, [lat, lng, map]);

    return null;
}

const stellaIcon = new Icon({
  iconUrl: require("../img/pin.png"),
  iconSize: [30, 30]
})

export default function Map() {
  const [dataUploads, setDataUploads] = useState([]);
  const [missingUploads, setMissingUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMissingWindow, setShowMissingWindow] = useState(false);
  const [editingCoords, setEditingCoords] = useState({});

  //Search Bar additions
  const [inputLat, setInputLat] = useState("");
  const [inputLng, setInputLng] = useState("");
  const [searchLat, setSearchLat] = useState(null);
  const [searchLng, setSearchLng] = useState(null);


  //TODO: When user registration/login/authentication finished, need to implement functionality.
  const TEMP_USER_ID = 1;

  useEffect(() => {
  async function fetchUserData() {
    try {
      const uploads = await fetch(`http://localhost:8000/api/uploads/user/${TEMP_USER_ID}`);
      const uploadData = await uploads.json();

      // Make sure it's an array
      if (!Array.isArray(uploadData)) {
        console.error("Uploads endpoint did not return an array:", uploadData);
        setLoading(false);
        return;
      }

      // Fetch all data rows for each upload
      const allData = await Promise.all(
        uploadData.map(async (upload) => {
          const resData = await fetch(
            `http://localhost:8000/api/data/upload/${upload.id}`
          );
          const data = await resData.json();

          return data.map((row) => ({
            ...row,
          }));
        })
      );

      const dataMissingCoords = allData.filter(r => !r.latitude || !r.longitude).flat();
      const dataWithCoords = allData.filter(r => r.latitude && r.longitude).flat();

      // Flatten the upload data arrays
      setDataUploads(dataMissingCoords);
      setMissingUploads(dataMissingCoords);
  
    } catch (err) {
      console.error("Error fetching uploads:", err);
    } finally {
        setLoading(false);
      }
  }
    fetchUserData();
  }, []);

  const cancelEdit = (id) => {
    setEditingCoords(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }

  const saveCoordinates = async (rowId) => {
    const coords = editingCoords[rowId];
    if (!coords || coords.lat === "" || coords.lng === "") {
      alert("Please enter both latitude and longitude");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/data/${rowId}/coordinates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: parseFloat(coords.lat),
          longitude: parseFloat(coords.lng),
        }),
      });

      if (!res.ok) throw new Error("Failed to save coordinates");

      // Update local state
      setMissingUploads(prev => prev.filter(row => row.id !== rowId));
      setMarkers(prev => [
        ...prev,
        {
          ...markers.find(m => m.id === rowId) || {},
          latitude: parseFloat(coords.lat),
          longitude: parseFloat(coords.lng)
        }
      ]);

      cancelEdit(rowId);
    } catch (err) {
      console.error("Error saving coordinates:", err);
      alert("Failed to save coordinates. Check console.");
    }
  }

  if (loading) return <p>Loading map data...</p>;

  const boulderLat = 40.0190
  const boulderLong = -105.2747

  return (
    /* MAP */
    <div class="mapDiv">
      <div style={{ position: "relative" }}>
      <div
        style={{
            position: "absolute",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            background: "#a0bc98",
            padding: "10px 14px",
            borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            gap: "8px",
            alignItems: "center"
        }}
      >
        <input
            type="number"
            placeholder="Latitude"
            value={inputLat}
            onChange={(e) => setInputLat(e.target.value)}
            style={{
                padding: "6px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                width: "120px",
                background: "white",
            }}
        />


        <input
            type="number"
            placeholder="Longitude"
            value={inputLng}
            onChange={(e) => setInputLng(e.target.value)}
            style={{
                padding: "6px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                width: "120px",
                background: "white",
            }}
        />


        <button
            onClick={() => {
                setSearchLat(parseFloat(inputLat));
                setSearchLng(parseFloat(inputLng));
            }}
            style={{
                backgroundColor: "white",
                color: "#a0bc98",
                border: "none",
                padding: "6px 14px",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer"
            }}
        >
           Go
        </button>
      </div>


      <MapContainer center={[boulderLat, boulderLong]} zoom={13}>
        <RecenterMap lat={searchLat} lng={searchLng} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> <a href="https://www.flaticon.com/free-icons/maps-and-location" title="maps and location icons">Icons by Iconpro86</a>'
          url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {Array.isArray(dataUploads) && dataUploads.map((row, idx) => {
          // TODO: uploads / stella data does not have latitude and longitude recordings. Need to ask CARMA about this.
          // For now, mocking these.
          const lat = boulderLat + Math.random() * 0.03;
          const lng = boulderLong + Math.random() * 0.03;

          return (
            <Marker
              key = {idx}
              position = {[lat, lng]}
              icon = {stellaIcon}
              eventHandlers={{
                mouseover: (event) => event.target.openPopup(),
                click: (event) => open('data')
              }}
            >
              <Popup class="mapPopup">
                <strong>Upload:</strong> {row.upload_id}<br />
                <strong>Recording:</strong> {row.id}<br />
                <strong>Device:</strong> {row.device_id}<br />
                <strong>Date:</strong> {Date(row.timestamp_iso8601)}<br />
                <strong>Coordinates:</strong> {lat.toPrecision(7)}, {lng.toPrecision(7)}<br />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      </div>

      {missingUploads.length != 0 && (
        <button class = "mapButton" id="missingDataButton" onClick={() => setShowMissingWindow(!showMissingWindow)}>{showMissingWindow ? "Hide Missing" : "Show Missing"}</button>
      )}
      {showMissingWindow && (
        <div class="mapWindow">
          <h3>Data Missing Coordinates</h3>
          {missingUploads.length === 0 ? (
            <p>All rows have coordinates</p>
          ) : (
            missingUploads.map(row => (
              <div class="noCoordEntry" key={row.upload_id}>
                <strong>Upload ID:</strong> {row.upload_id}<br />
                <strong>Device ID:</strong> {row.device_id}<br />
                <strong>Recording ID:</strong> {row.id}<br />
                <strong>Date:</strong> {Date(row.timestamp_iso8601)}<br />
                {editingCoords[row.id] ? (
                  <div class="addCoordsForm">
                    <input
                      type="number"
                      step="any"
                      min="-90"
                      max="90"
                      placeholder="Latitude"
                      value={editingCoords[row.id].lat}
                      onChange={(e) =>
                        setEditingCoords(prev => ({
                          ...prev,
                          [row.id]: { ...prev[row.id], lat: e.target.value }
                        }))
                      }
                    />
                    <input
                      type="number"
                      step="any"
                      min="-180"
                      max="180"
                      placeholder="Longitude"
                      value={editingCoords[row.id].lng}
                      onChange={(e) =>
                        setEditingCoords(prev => ({
                          ...prev,
                          [row.id]: { ...prev[row.id], lng: e.target.value }
                        }))
                      }
                    />
                    <div class="formButtons">
                      <button id="saveButton" onClick={() => saveCoordinates(row.id)}>Save</button>
                      <button id="cancelButton" onClick={() => cancelEdit(row.id)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      setEditingCoords(prev => ({
                        ...prev,
                        [row.id]: { lat: "", lng: "" }
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
  );
}
