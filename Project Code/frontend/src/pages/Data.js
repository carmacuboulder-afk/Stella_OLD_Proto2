import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Data() {
  const [activeTab, setActiveTab] = useState("history");

  const [uploads, setUploads] = useState([]);
  const [selectedUploadId, setSelectedUploadId] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

  const [graphMetric, setGraphMetric] = useState("surface_temp");

  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState("");
  const [sensorData, setSensorData] = useState({
    device_type: "--",
    software_version: "--",
    uid: "--",
    batch: "--",
    dec_hour: "--",
    surface_temp: "--",
    air_temp: "--",
    rel_humidity: "--",
    range: "--",
    main_battery_voltage: "--",
    v450: "--",
    b500: "--",
    g550: "--",
    y570: "--",
    o600: "--",
    r650: "--",
    "610": "--",
    "680": "--",
    "730": "--",
    "760": "--",
    "810": "--",
    "860": "--",
  });

  // history tab
  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/uploads`);
      const data = await res.json();
      setUploads(data);
    } catch (err) {
      console.error("Failed to fetch uploads", err);
    }
  };

  const handleSelectUpload = async (uploadId) => {
    setSelectedUploadId(uploadId);
    setLoadingGraph(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/uploads/${uploadId}/data`);
      const data = await res.json();
      
      const formatted = data.map(row => ({
        ...row,
        timeLabel: new Date(row.timestamp_iso8601).toLocaleTimeString(),
        surface_temp: parseFloat(row.surface_temperature_c),
        air_temp: parseFloat(row.air_temperature_c),
        humidity: parseFloat(row.relative_humidity_percent),
      }));

      setGraphData(formatted);
    } catch (err) {
      console.error("Failed to fetch graph data", err);
    } finally {
      setLoadingGraph(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    const isDuplicate = uploads.some(u => u.upload_name === selectedFile.name);
    
    if (isDuplicate) {
      setUploadStatus(`Error: "No duplicate file names. Please rename your file.`);
      return;
    }
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setUploadStatus("Uploading...");
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/uploads/csv`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadStatus(`Success! Processed ${data.rows || 0} rows.`);
        setSelectedFile(null);
        fetchUploads();
      } else {
        setUploadStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      setUploadStatus("Network error.");
    }
  };
  // live tab
  const connectToSerial = async () => {
    if (!("serial" in navigator)) {
      setStatus("Web Serial API not supported in this browser.");
      return;
    }

    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      setIsConnected(true);
      setStatus("Connected to STELLA");

      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();

      let buffer = "";

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) { 
            reader.releaseLock();
             break;
            }
          if (value) {
            buffer += value;
            const lines = buffer.split("\n");
            buffer = lines.pop(); // Keep the last partial line

            for (const line of lines) {
               processLine(line);
          }
        }
      }
    } catch (error) { 
      console.error("Error reading stream:", error);
      setStatus(`Error: ${error.message}`);
    } finally { 
      reader.releaseLock();
      setIsConnected(false);
    }
    } catch (error) { 
      console.error("Connection error:", error);
      setStatus(`Connection failed: ${error.message}`);
      setIsConnected(false);
    }
  };

  const processLine = (line) => {
    if (!line.includes("mirror_data")) return;

    try {
      const parts = line.split(",").map((s) => s.trim());
      // Example: mirror_data, device_type, STELLA-1.1, uid, 3343...
      // We assume index 0 is 'mirror_data' or a marker, and pairs follow.
      // If parts[0] is 'mirror_data', we start pairs from index 1.
      
      const newData = {};
      let startIndex = 0;

      // If the line starts with the marker, skip it for key-value pairing
      if (parts[0] === "mirror_data") {
        startIndex = 1;
      }

      for (let i = startIndex; i < parts.length; i += 2) {
        const key = parts[i];
        const value = parts[i + 1];
        if (key && value !== undefined) {
          newData[key] = value;
        }
      }

      setSensorData((prev) => ({
        ...prev,
        ...newData,
      }));
    } catch (err) { 
      console.error("Error parsing line:", line, err);
    }
  };

  const sections = [
    {
      title: "Metadata",
      cards: [
        { key: "device_type", label: "Device" },
        { key: "software_version", label: "Version" },
        { key: "uid", label: "UID" },
        { key: "batch", label: "Batch #" },
        { key: "dec_hour", label: "Dec Hour" },
      ],
    },
    {
      title: "Environmental Sensors",
      cards: [
        { key: "surface_temp", label: "Surface Temp °C" },
        { key: "air_temp", label: "Air Temp °C" },
        { key: "rel_humidity", label: "Humidity %" },
        { key: "range", label: "Range m" },
        { key: "main_battery_voltage", label: "Battery V" },
      ],
    },
    {
      title: "Visible Light Spectrum (uW/cm²)",
      cards: [
        { key: "v450", label: "450nm Violet" },
        { key: "b500", label: "500nm Blue" },
        { key: "g550", label: "550nm Green" },
        { key: "y570", label: "570nm Yellow" },
        { key: "o600", label: "600nm Orange" },
        { key: "r650", label: "650nm Red" },
      ],
    },
    {
      title: "Near-Infrared Spectrum (uW/cm²)",
      cards: [
        { key: "610", label: "610nm NIR" },
        { key: "680", label: "680nm NIR" },
        { key: "730", label: "730nm NIR" },
        { key: "760", label: "760nm NIR" },
        { key: "810", label: "810nm NIR" },
        { key: "860", label: "860nm NIR" },
      ],
    },
  ];

  return (
    <div style={{ textAlign: "center", padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>


      {/* tab toggle */}
      <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "30px" }}>
        <button 
          onClick={() => setActiveTab("history")}
          style={{
            padding: "10px 30px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            border: "none",
            borderRadius: "5px",
            backgroundColor: activeTab === "history" ? "#28a745" : "#e0e0e0",
            color: activeTab === "history" ? "white" : "#333"
          }}
        >
          Upload & History
        </button>

        <button 
          onClick={() => setActiveTab("live")}
          style={{
            padding: "10px 30px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            border: "none",
            borderRadius: "5px",
            backgroundColor: activeTab === "live" ? "#28a745" : "#e0e0e0",
            color: activeTab === "live" ? "white" : "#333"
          }}
        >
          Live Monitor
        </button>
      </div>

      {/* history*/}
      {activeTab === "history" && (
        <div className="fade-in">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "40px" }}>
            
            {/* upload box */}
            <div style={{ 
              padding: "20px", 
              border: "1px solid #ccc", 
              borderRadius: "8px", 
              width: "350px",
              height: "350", 
              overflow: "hidden",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center"
            }}>
              <h3 style={{ marginTop: 0 }}>Upload New Data</h3>
              
              <input 
                type="file" 
                accept=".csv" 
                onChange={(e) => setSelectedFile(e.target.files[0])} 
                style={{ 
                   marginBottom: "15px", 
                   border: "1px solid #ccc",
                   padding: "5px",
                   borderRadius: "5px",
                   backgroundColor: "#f9f9f9",
                   width: "68%",
                   boxSizing: "border-box",
                   cursor: "pointer"
                }}
              />
              
              <button 
                onClick={handleFileUpload} 
                disabled={!selectedFile} 
                style={{ 
                  marginLeft: "0",
                  width: "100%",
                  padding: "8px 10px", 
                  cursor: "pointer",
                  backgroundColor: !selectedFile ? "#ccc" : "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px"
                }}
              >
                Upload
              </button>
              
              <p style={{ 
                color: uploadStatus.includes("Error") ? "red" : "green", 
                marginTop: "10px",
                fontSize: "14px",
                whiteSpace: "nowrap",
                overflow: "hidden", 
                textOverflow: "ellipsis"
              }}>
                {uploadStatus}
              </p>
            </div>

            {/* history list */}
            <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px", maxHeight: "200px", overflowY: "auto", textAlign: "left" }}>
              <h3 style={{ marginTop: 0 }}>Select Past Upload</h3>
              {uploads.length === 0 ? <p>No uploads found.</p> : (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {uploads.map(u => (
                    <li 
                      key={u.id} 
                      onClick={() => handleSelectUpload(u.id)}
                      style={{ 
                        padding: "8px", 
                        cursor: "pointer", 
                        borderBottom: "1px solid #eee",
                        backgroundColor: selectedUploadId === u.id ? "#edf5f9ff" : "transparent", 
                        wordWrap: "break-all"
                      }}
                    >
                    {u.upload_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* graph */}
          {selectedUploadId && (
            <div style={{ marginBottom: "50px", padding: "20px", border: "1px solid #007bff", borderRadius: "10px" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0 }}>
                  {graphMetric === "all" ? "All Metrics" : (graphMetric === "surface_temp" ? "Surface Temp (°C)" : "Air Temp (°C)")}
                </h3>

                {/* surface/air/all toggle*/}
                <div>
                  <button 
                    onClick={() => setGraphMetric("all")}
                    style={{
                      padding: "5px 15px",
                      marginRight: "10px",
                      cursor: "pointer",
                      backgroundColor: graphMetric === "all" ? "#A0B79E" : "#eee",
                      color: graphMetric === "all" ? "white" : "#333",
                      border: "none", borderRadius: "4px"
                    }}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setGraphMetric("surface_temp")}
                    style={{
                      padding: "5px 15px",
                      marginRight: "10px",
                      cursor: "pointer",
                      backgroundColor: graphMetric === "surface_temp" ? "#8884d8" : "#eee",
                      color: graphMetric === "surface_temp" ? "white" : "#333",
                      border: "none", borderRadius: "4px"
                    }}
                  >
                    Surface Temp
                  </button>
                  <button 
                    onClick={() => setGraphMetric("air_temp")}
                    style={{
                      padding: "5px 15px",
                      cursor: "pointer",
                      backgroundColor: graphMetric === "air_temp" ? "#82ca9d" : "#eee",
                      color: graphMetric === "air_temp" ? "white" : "#333",
                      border: "none", borderRadius: "4px"
                    }}
                  >
                    Air Temp
                  </button>
                </div>
              </div>
              
              {loadingGraph ? <p>Loading data...</p> : (
                <div style={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer>
                    <LineChart data={graphData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timeLabel" minTickGap={30} />
                      <YAxis domain={['auto', 'auto']} label={{ value: 'Value', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      {graphMetric === "all" ? (
                        <>
                          <Line type="monotone" dataKey="surface_temp" stroke="#8884d8" dot={false} strokeWidth={2} name="Surface Temp" />
                          <Line type="monotone" dataKey="air_temp" stroke="#82ca9d" dot={false} strokeWidth={2} name="Air Temp" />
                          <Line type="monotone" dataKey="humidity" stroke="#ffc658" dot={false} strokeWidth={2} name="Humidity" />
                        </>
                      ) : (
                        <Line 
                          type="monotone" 
                          dataKey={graphMetric} 
                          stroke={graphMetric === "surface_temp" ? "#8884d8" : "#82ca9d"} 
                          dot={false} 
                          strokeWidth={2} 
                          name={graphMetric === "surface_temp" ? "Surface Temp" : "Air Temp"} 
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* live */}
      {activeTab === "live" && (
        <div className="fade-in">
          <button
            onClick={connectToSerial}
            disabled={isConnected}
            style={{
              padding: "15px 30px",
              fontSize: "18px",
              backgroundColor: isConnected ? "#ccc" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: isConnected ? "default" : "pointer",
              marginBottom: "30px",
            }}
          >
            {isConnected ? "Connected" : "Connect to USB Device"}
          </button>

          {status && (
            <p style={{ marginBottom: "20px", fontWeight: "bold", color: status.includes("Error") ? "red" : "green" }}>
              {status}
            </p>
          )}

          {sections.map((section, index) => (
            <div key={index} style={{ marginBottom: "30px" }}>
              <h4 style={{ textAlign: "left", marginLeft: "20px", color: "#333", borderBottom: "2px solid #eee", paddingBottom: "10px" }}>
                {section.title}
              </h4>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "20px",
                  marginTop: "15px", 
                  }}
                >
                {section.cards.map((card) => (
                  <div
                    key={card.key}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "15px",
                      width: "140px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      backgroundColor: "#f9f9f9",
                    }}
                  >
                    <h5 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#555" }}>
                      {card.label}
                      </h5>
                    <div style={{ fontSize: "18px", fontWeight: "bold", color: "#333" }}>
                      {sensorData[card.key] || "--"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

