import React, { useState, useEffect, useRef } from "react";
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

  const [dataBuffer, setDataBuffer] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [liveSession, setLiveSession] = useState(null); // { sessionId, deviceId }
  const [isRecording, setIsRecording] = useState(false); // Controls whether data is being stored
  const [deviceInfo, setDeviceInfo] = useState(null); // Store device_type and software_version
  const [dataPointCount, setDataPointCount] = useState(0); // Track uploaded points
  const [recordingBuffer, setRecordingBuffer] = useState([]); // Buffer data locally during recording
  
  // Use refs to track recording state and buffer for immediate access in callbacks
  const isRecordingRef = useRef(false);
  const recordingBufferRef = useRef([]);

  // Retry sending buffered data
  useEffect(() => {
    if (dataBuffer.length > 0 && !isSending) {
      setIsSending(true);
      const sendBuffered = async () => {
        const buffer = [...dataBuffer];
        setDataBuffer([]);
        for (const data of buffer) {
          await sendDataToBackend(data);
        }
        setIsSending(false);
      };
      sendBuffered();
    }
  }, [dataBuffer, isSending]);

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
      
      // Sort by timestamp to ensure correct order
      const sorted = data.sort((a, b) => new Date(a.timestamp_iso8601) - new Date(b.timestamp_iso8601));
      
      const formatted = sorted.map((row, index) => {
        const date = new Date(row.timestamp_iso8601);
        return {
          id: index,  // Unique identifier for each data point
          timestamp: row.timestamp_iso8601,
          timeLabel: date.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: '2-digit',
            hour: 'numeric', 
            minute: '2-digit'
          }),
          // Temperature (try both uppercase and lowercase column names from postgres)
          surface_temp: parseFloat(row.surface_temperature_c || row.surface_temperature_C) || 0,
          air_temp: parseFloat(row.air_temperature_c || row.air_temperature_C) || 0,
          humidity: parseFloat(row.relative_humidity_percent) || 0,
          // Irradiance values
          v450: parseFloat(row.irradiance_450nm_blue_irradiance_uw_per_cm_squared) || 0,
          b500: parseFloat(row.irradiance_500nm_cyan_irradiance_uw_per_cm_squared) || 0,
          g550: parseFloat(row.irradiance_550nm_green_irradiance_uw_per_cm_squared) || 0,
          y570: parseFloat(row.irradiance_570nm_yellow_irradiance_uw_per_cm_squared) || 0,
          o600: parseFloat(row.irradiance_600nm_orange_irradiance_uw_per_cm_squared) || 0,
          r650: parseFloat(row.irradiance_650nm_red_irradiance_uw_per_cm_squared) || 0,
        };
      });

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
  const startLiveSession = async (deviceType, softwareVersion) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/uploads/live/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_type: deviceType, software_version: softwareVersion }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLiveSession({ sessionId: data.sessionId, deviceId: data.deviceId });
      console.log('Live session started:', data.sessionId);
      return data;
    } catch (error) {
      console.error('Failed to start live session:', error);
      return null;
    }
  };

  const endLiveSession = async () => {
    if (!liveSession) return;
    try {
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/uploads/live/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: liveSession.sessionId }),
      });
      console.log('Live session ended');
      fetchUploads(); // Refresh uploads list
    } catch (error) {
      console.error('Failed to end live session:', error);
    } finally {
      setLiveSession(null);
    }
  };

  const connectToSerial = async () => {
    if (!("serial" in navigator)) {
      setStatus("Web Serial API not supported in this browser.");
      return;
    }

    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      setIsConnected(true);
      setIsRecording(true);
      isRecordingRef.current = true;
      setStatus("Connected to STELLA - Recording data...");

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
      const wasRecording = isRecordingRef.current;
      setIsRecording(false);
      isRecordingRef.current = false;
      
      if (wasRecording) {
        setStatus('Disconnected - Uploading recorded data...');
        await stopRecording();
      } else {
        setStatus('Disconnected');
      }
    }
    } catch (error) { 
      console.error("Connection error:", error);
      setStatus(`Connection failed: ${error.message}`);
      setIsConnected(false);
    }
  };

  const uploadBatch = async (dataPoints) => {
    if (dataPoints.length === 0) return { uploaded: 0, total: 0 };
    
    try {
      if (!deviceInfo) {
        console.error('No device info for batch upload');
        return { uploaded: 0, total: dataPoints.length };
      }
      
      // Start session
      const session = await startLiveSession(deviceInfo.device_type, deviceInfo.software_version);
      if (!session) {
        console.error('Failed to create session for batch');
        return { uploaded: 0, total: dataPoints.length };
      }
      
      // Upload all data points
      let uploaded = 0;
      for (const data of dataPoints) {
        try {
          const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/uploads/live/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: session.sessionId,
              deviceId: session.deviceId,
              ...data
            }),
          });
          if (res.ok) uploaded++;
        } catch (error) {
          console.error('Failed to upload data point:', error);
        }
      }
      
      // End session
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/uploads/live/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.sessionId }),
      });
      
      console.log(`Batch uploaded: ${uploaded}/${dataPoints.length} points`);
      return { uploaded, total: dataPoints.length };
    } catch (error) {
      console.error('Batch upload error:', error);
      return { uploaded: 0, total: dataPoints.length };
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    isRecordingRef.current = false;
    
    const bufferToUpload = [...recordingBufferRef.current];
    const bufferSize = bufferToUpload.length;
    
    if (bufferSize === 0) {
      setStatus('Recording stopped - No data to upload.');
      setRecordingBuffer([]);
      recordingBufferRef.current = [];
      return;
    }
    
    setStatus(`Uploading ${bufferSize} data points...`);
    
    // Upload remaining buffered data
    const result = await uploadBatch(bufferToUpload);
    
    setStatus(`Recording stopped - ${result.uploaded}/${bufferSize} points uploaded successfully.`);
    fetchUploads(); // Refresh uploads list
    setRecordingBuffer([]);
    recordingBufferRef.current = [];
    setDataPointCount(0);
  };

  const startRecording = async () => {
    setIsRecording(true);
    isRecordingRef.current = true;
    setRecordingBuffer([]);
    recordingBufferRef.current = [];
    setDataPointCount(0);
    setStatus('Recording... (data buffered locally)');
  };

  const sendDataToBackend = async (data, session) => {
    const currentSession = session || liveSession;
    if (!currentSession) {
      console.warn('No active session, buffering data');
      setDataBuffer(prev => [...prev, data]);
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/uploads/live/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.sessionId,
          deviceId: currentSession.deviceId,
          ...data
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      // Successfully uploaded
      setDataPointCount(prev => prev + 1);
      console.log('Data point uploaded, total:', dataPointCount + 1);
    } catch (error) {
      console.error('Failed to send data:', error);
      // Buffer the data for retry
      setDataBuffer(prev => [...prev, data]);
      setStatus(prev => prev.includes('(data buffered)') ? prev : prev + ' (data buffered)');
    }
  };

  const processLine = async (line) => {
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

      // Store device info when we see it
      if (newData.device_type && newData.software_version) {
        setDeviceInfo({
          device_type: newData.device_type,
          software_version: newData.software_version
        });
      }

      // Always update the display
      setSensorData((prev) => ({
        ...prev,
        ...newData,
      }));

      // Only buffer data if recording is enabled (use ref for immediate check)
      if (!isRecordingRef.current) {
        return;
      }

      // Buffer data locally during recording (use ref for immediate updates)
      recordingBufferRef.current.push(newData);
      const bufferLength = recordingBufferRef.current.length;
      setRecordingBuffer([...recordingBufferRef.current]); // Update state for display
      setDataPointCount(bufferLength);
      console.log('Data point buffered, total:', bufferLength);
      
      // Auto-upload every 100 points
      if (bufferLength >= 100) {
        console.log('Auto-uploading batch of 100 points...');
        setStatus(`Auto-uploading batch of ${bufferLength} points...`);
        
        const batchToUpload = [...recordingBufferRef.current];
        const result = await uploadBatch(batchToUpload);
        
        if (result.uploaded > 0) {
          setStatus(`Recording... (${result.uploaded} points uploaded, continuing)`);
          recordingBufferRef.current = []; // Clear ref buffer
          setRecordingBuffer([]); // Clear state buffer
          setDataPointCount(0);
          fetchUploads(); // Refresh uploads list
        } else {
          setStatus('Recording... (upload failed, will retry on stop)');
        }
      }
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
                  {graphMetric === "all" ? "All Metrics" : 
                   graphMetric === "surface_temp" ? "Surface Temp (°C)" : 
                   graphMetric === "air_temp" ? "Air Temp (°C)" :
                   "Irradiance Spectrum (μW/cm²)"}
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
                  <button 
                    onClick={() => setGraphMetric("irradiance")}
                    style={{
                      padding: "5px 15px",
                      marginLeft: "10px",
                      cursor: "pointer",
                      backgroundColor: graphMetric === "irradiance" ? "#ffc658" : "#eee",
                      color: graphMetric === "irradiance" ? "white" : "#333",
                      border: "none", borderRadius: "4px"
                    }}
                  >
                    Irradiance
                  </button>
                </div>
              </div>
              
              {loadingGraph ? <p>Loading data...</p> : (
                <div style={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer>
                    <LineChart data={graphData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="id" 
                        minTickGap={30}
                        tickFormatter={(value) => {
                          const point = graphData[value];
                          return point ? point.timeLabel : '';
                        }}
                      />
                      <YAxis domain={['auto', 'auto']} label={{ value: 'Value', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (typeof value === 'number') {
                            return [value.toFixed(2), name];
                          }
                          return [value, name];
                        }}
                        labelFormatter={(label) => {
                          const point = graphData[label];
                          return point ? `Time: ${point.timeLabel}` : label;
                        }}
                      />
                      <Legend />
                      {graphMetric === "all" ? (
                        <>
                          <Line type="monotone" dataKey="surface_temp" stroke="#8884d8" dot={false} strokeWidth={2} name="Surface Temp" />
                          <Line type="monotone" dataKey="air_temp" stroke="#82ca9d" dot={false} strokeWidth={2} name="Air Temp" />
                          <Line type="monotone" dataKey="humidity" stroke="#ffc658" dot={false} strokeWidth={2} name="Humidity" />
                        </>
                      ) : graphMetric === "irradiance" ? (
                        <>
                          <Line type="monotone" dataKey="v450" stroke="#4169E1" dot={false} strokeWidth={2} name="450nm (Blue)" />
                          <Line type="monotone" dataKey="b500" stroke="#00CED1" dot={false} strokeWidth={2} name="500nm (Cyan)" />
                          <Line type="monotone" dataKey="g550" stroke="#32CD32" dot={false} strokeWidth={2} name="550nm (Green)" />
                          <Line type="monotone" dataKey="y570" stroke="#FFD700" dot={false} strokeWidth={2} name="570nm (Yellow)" />
                          <Line type="monotone" dataKey="o600" stroke="#FF8C00" dot={false} strokeWidth={2} name="600nm (Orange)" />
                          <Line type="monotone" dataKey="r650" stroke="#DC143C" dot={false} strokeWidth={2} name="650nm (Red)" />
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
          <div style={{ display: "flex", justifyContent: "center", gap: "15px", marginBottom: "30px" }}>
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
              }}
            >
              {isConnected ? "Connected" : "Connect to USB Device"}
            </button>

            {isConnected && isRecording && (
              <button
                onClick={stopRecording}
                style={{
                  padding: "15px 30px",
                  fontSize: "18px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                ⏹ Stop Recording
              </button>
            )}

            {isConnected && !isRecording && (
              <button
                onClick={startRecording}
                style={{
                  padding: "15px 30px",
                  fontSize: "18px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                ⏺ Start Recording
              </button>
            )}
          </div>

          {isConnected && (
            <p style={{ 
              marginBottom: "10px", 
              fontSize: "14px", 
              color: isRecording ? "#28a745" : "#666",
              fontWeight: isRecording ? "bold" : "normal"
            }}>
              {isRecording 
                ? `⏺ Recording to Session #${liveSession?.sessionId || '(starting...)'}` 
                : "⏸ Monitoring only (not recording)"}
            </p>
          )}

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

