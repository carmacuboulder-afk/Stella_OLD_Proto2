import React from "react";
import "../css/map.css";
import "leaflet/dist/leaflet.css";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import { Icon } from "leaflet";

const stellaIcon = new Icon({
  iconUrl: require("../img/pin.png"),
  iconSize: [30, 30]
})

export default function Map() {
  const [dataUploads, setDataUploads] = useState([]);
  const [missingUploads, setMissingUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMissingWindow, setShowMissingWindow] = useState(false);

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

  if (loading) return <p>Loading map data...</p>;

  const boulderLat = 40.0190
  const boulderLong = -105.2747

  return (
    /* MAP */
    <div>
      <buttom id="dataNoCoordsButton" onClick={() => setShowMissingWindow(!showMissingWindow)}>{showMissingWindow ? "Hide Missing" : "Show Missing"}</buttom>
      {showMissingWindow && (
        <div id="dataNoCoordsWindow">
          <h3>Data Missing Coordinates</h3>
          {missingUploads.length === 0 ? (
            <p>All rows have coordinates</p>
          ) : (
            missingUploads.map(row => (
              <div id="noCoordEntry" key={row.upload_id}>
                <strong>Upload ID:</strong> {row.upload_id}<br />
                <strong>Device ID:</strong> {row.device_id}<br />
                <strong>Recording ID:</strong> {row.id}<br />
                <strong>Date:</strong> {Date(row.timestamp_iso8601)}<br />
                <button>Add Coordinates</button>
              </div>
            ))
          )}
        </div>
      )}
      <MapContainer center={[boulderLat, boulderLong]} zoom={13}>
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
              <Popup>
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
  );
}