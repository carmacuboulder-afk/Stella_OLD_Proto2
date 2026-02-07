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

const boulderLat = 40.0190
const boulderLong = -105.2747

export default function Map() {
  const [uploads, setUploads] = useState([]);
  const [dataRows, setDataRows] = useState([]);
  const [loading, setLoading] = useState(true);

  //TODO: When user registration/login/authentication finished, need to implement functionality.
  const TEMP_USER_ID = 1;

  useEffect(() => {
  async function fetchUserData() {
    try {
      const resUploads = await fetch(`http://localhost:8000/api/uploads/user/${TEMP_USER_ID}`);
      const uploadsData = await resUploads.json();
      setUploads(uploadsData);

      // Make sure it's an array
      if (!Array.isArray(uploadsData)) {
        console.error("Uploads endpoint did not return an array:", uploadsData);
        setLoading(false);
        return;
      }

      // Fetch all data rows for each upload
      const allDataRows = await Promise.all(
        uploadsData.map(async (upload) => {
          const resData = await fetch(
            `http://localhost:8000/api/data/upload/${upload.id}`
          );
          const data = await resData.json();

          return data.map((row) => ({
            ...row,
          }));
        })
      );

      // Flatten the array upload data arrays
      const flattenedData = allDataRows.flat();
      setDataRows(flattenedData);
  
    } catch (err) {
      console.error("Error fetching uploads:", err);
    } finally {
        setLoading(false);
      }
  }
    fetchUserData();
  }, []);

  if (loading) return <p>Loading map data...</p>;

  return (
    <MapContainer center={[boulderLat, boulderLong]} zoom={13}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> <a href="https://www.flaticon.com/free-icons/location" title="location icons">Location Icons - Ilham Fitrotul Hayat</a> contributors '
        url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {Array.isArray(dataRows) && dataRows.map((row, idx) => {
        // TODO: uploads / stella data does not have latitude and longitude recordings. Need to ask CARMA about this.
        // For now, mocking these.
        const lat = boulderLat + Math.random() * 0.03;
        const lng = boulderLong + Math.random() * 0.03;

        return (
          <Marker
            key = {idx}
            position = {[lat, lng]}
            icon = {stellaIcon}
          >
            <Popup>
              <strong>Upload ID:</strong> {row.upload_id}<br />
              <strong>Recording ID:</strong> {row.id}<br />
              <strong>Device:</strong> {row.device_id}<br />
              <strong>Time of Recording:</strong> {Date(row.timestamp_iso8601)}<br />
              <strong>Coordinates:</strong> {lat.toPrecision(7)}, {lng.toPrecision(7)}<br />
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}