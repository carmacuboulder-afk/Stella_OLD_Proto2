import React, { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Data() {
  const [activeTab, setActiveTab] = useState("history");

  const [uploads, setUploads] = useState([]);
  const [selectedUploadId, setSelectedUploadId] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [noteDrafts, setNoteDrafts] = useState({});
  const [noteSaveStatus, setNoteSaveStatus] = useState({});
  const [savingNoteId, setSavingNoteId] = useState(null);

  const [selectedBatchNumber, setSelectedBatchNumber] = useState("");

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

  const pointDotStyle = { r: 1.5, fill: "#c7c7c7", stroke: "#c7c7c7", strokeWidth: 1 };
  const activePointDotStyle = { r: 2.5, fill: "#aaaaaa", stroke: "#aaaaaa", strokeWidth: 1 };
  const safeDivide = (numerator, denominator) => (denominator ? numerator / denominator : 0);
  const formatTimeLabel = (date) => {
    const datePart = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timePart = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${datePart}, ${timePart}`;
  };
  const buildEvenlySpacedTicks = (pointCount, maxTicks = 6) => {
    if (pointCount <= 0) return [];
    if (pointCount === 1) return [0];

    const desiredTickCount = Math.min(maxTicks, pointCount);
    const lastIndex = pointCount - 1;
    const step = lastIndex / (desiredTickCount - 1);
    return Array.from({ length: desiredTickCount }, (_, i) =>
      i === desiredTickCount - 1 ? lastIndex : i * step
    );
  };

  const availableBatchNumbers = Array.from(
    new Set(graphData.map((row) => row.batchNumber).filter(Boolean))
  ).sort((a, b) => {
    if (a === "Unspecified") return 1;
    if (b === "Unspecified") return -1;

    const aNum = Number(a);
    const bNum = Number(b);
    const aIsNumeric = Number.isFinite(aNum);
    const bIsNumeric = Number.isFinite(bNum);

    if (aIsNumeric && bIsNumeric) return aNum - bNum;
    if (aIsNumeric) return -1;
    if (bIsNumeric) return 1;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  });

  const filteredGraphData = graphData.filter((row) => row.batchNumber === selectedBatchNumber).map((row, index) => ({
    ...row,
    chartIndex: index,
  }));
  const xAxisTicks = buildEvenlySpacedTicks(filteredGraphData.length, 3);
  const formatXAxisTick = (value) => {
    const pointIndex = Math.min(filteredGraphData.length - 1, Math.max(0, Math.round(value)));
    const point = filteredGraphData[pointIndex];
    return point ? point.timeLabel : "";
  };

  const graphConfigurations = [
    {
      key: "raw_visible",
      title: "Raw Visible Spectrum",
      yAxisLabel: "Irradiance (uW/cm²)",
      lines: [
        { dataKey: "v450", stroke: "#6A5ACD", name: "450nm" },
        { dataKey: "b500", stroke: "#00CED1", name: "500nm" },
        { dataKey: "g550", stroke: "#32CD32", name: "550nm" },
        { dataKey: "y570", stroke: "#FFD700", name: "570nm" },
        { dataKey: "o600", stroke: "#FF8C00", name: "600nm" },
        { dataKey: "n610", stroke: "#CD853F", name: "610nm" },
        { dataKey: "r650", stroke: "#DC143C", name: "650nm" },
      ],
    },
    {
      key: "raw_invisible",
      title: "Raw Invisible (Near-Infrared) Spectrum",
      yAxisLabel: "Irradiance (uW/cm²)",
      lines: [
        { dataKey: "n680", stroke: "#8B0000", name: "680nm" },
        { dataKey: "n730", stroke: "#8A2BE2", name: "730nm" },
        { dataKey: "n760", stroke: "#4B0082", name: "760nm" },
        { dataKey: "n810", stroke: "#191970", name: "810nm" },
        { dataKey: "n860", stroke: "#000000", name: "860nm" },
      ],
    },
    {
      key: "temp",
      title: "Air and Surface Temperature",
      yAxisLabel: "Temperature (°C)",
      lines: [
        { dataKey: "surface_temp", stroke: "#DC143C", name: "Surface Temp" },
        { dataKey: "air_temp", stroke: "#1E90FF", name: "Air Temp" },
      ],
    },
    {
      key: "reflectance",
      title: "Reflectance",
      yAxisLabel: "Relative Reflectance",
      lines: [
        { dataKey: "refl450", stroke: "#6A5ACD", name: "450nm" },
        { dataKey: "refl500", stroke: "#00CED1", name: "500nm" },
        { dataKey: "refl550", stroke: "#32CD32", name: "550nm" },
        { dataKey: "refl570", stroke: "#FFD700", name: "570nm" },
        { dataKey: "refl600", stroke: "#FF8C00", name: "600nm" },
        { dataKey: "refl610", stroke: "#CD853F", name: "610nm" },
        { dataKey: "refl650", stroke: "#DC143C", name: "650nm" },
        { dataKey: "refl680", stroke: "#8B0000", name: "680nm" },
        { dataKey: "refl730", stroke: "#8A2BE2", name: "730nm" },
        { dataKey: "refl760", stroke: "#4B0082", name: "760nm" },
        { dataKey: "refl810", stroke: "#191970", name: "810nm" },
        { dataKey: "refl860", stroke: "#000000", name: "860nm" },
      ],
    },
    {
      key: "ndvi",
      title: "NDVI",
      yAxisLabel: "Index (unitless)",
      lines: [
        { dataKey: "ndvi", stroke: "#2E8B57", name: "NDVI" },
      ],
    },
    {
      key: "sr",
      title: "SR",
      yAxisLabel: "Ratio",
      lines: [
        { dataKey: "sr", stroke: "#1E90FF", name: "SR" },
      ],
    },
    {
      key: "dswi4",
      title: "DSWI 4",
      yAxisLabel: "Index (unitless)",
      lines: [
        { dataKey: "dswi4", stroke: "#A0522D", name: "DSWI 4" },
      ],
    },
    {
      key: "nirv",
      title: "NIRv",
      yAxisLabel: "Index (unitless)",
      lines: [
        { dataKey: "nirv", stroke: "#800080", name: "NIRv" },
      ],
    },
  ];

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

  useEffect(() => {
    if (availableBatchNumbers.length === 0) {
      if (selectedBatchNumber !== "") setSelectedBatchNumber("");
      return;
    }

    if (!availableBatchNumbers.includes(selectedBatchNumber)) {
      setSelectedBatchNumber(availableBatchNumbers[0]);
    }
  }, [availableBatchNumbers, selectedBatchNumber]);

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
    setSelectedBatchNumber("");
    setLoadingGraph(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/uploads/${uploadId}/data`);
      const data = await res.json();
      
      // Sort by timestamp to ensure correct order
      const sorted = data.sort((a, b) => new Date(a.timestamp_iso8601) - new Date(b.timestamp_iso8601));
      
      const formatted = sorted.map((row, index) => {
        const date = new Date(row.timestamp_iso8601);
        const rawBatchNumber = row.batch_number ?? row.batch ?? row.batchNumber ?? "";
        const batchNumber = `${rawBatchNumber}`.trim() || "Unspecified";
        const v450 = parseFloat(row.irradiance_450nm_blue_irradiance_uw_per_cm_squared) || 0;
        const b500 = parseFloat(row.irradiance_500nm_cyan_irradiance_uw_per_cm_squared) || 0;
        const g550 = parseFloat(row.irradiance_550nm_green_irradiance_uw_per_cm_squared) || 0;
        const y570 = parseFloat(row.irradiance_570nm_yellow_irradiance_uw_per_cm_squared) || 0;
        const o600 = parseFloat(row.irradiance_600nm_orange_irradiance_uw_per_cm_squared) || 0;
        const n610 = parseFloat(row.irradiance_610nm_orange_irradiance_uw_per_cm_squared) || 0;
        const r650 = parseFloat(row.irradiance_650nm_red_irradiance_uw_per_cm_squared) || 0;
        const n680 = parseFloat(row.irradiance_680nm_near_infrared_irradiance_uw_per_cm_squared) || 0;
        const n730 = parseFloat(row.irradiance_730nm_near_infrared_irradiance_uw_per_cm_squared) || 0;
        const n760 = parseFloat(row.irradiance_760nm_near_infrared_irradiance_uw_per_cm_squared) || 0;
        const n810 = parseFloat(row.irradiance_810nm_near_infrared_irradiance_uw_per_cm_squared) || 0;
        const n860 = parseFloat(row.irradiance_860nm_near_infrared_irradiance_uw_per_cm_squared) || 0;
        const totalIrradiance = v450 + b500 + g550 + y570 + o600 + n610 + r650 + n680 + n730 + n760 + n810 + n860;
        const refl450 = safeDivide(v450, totalIrradiance);
        const refl500 = safeDivide(b500, totalIrradiance);
        const refl550 = safeDivide(g550, totalIrradiance);
        const refl570 = safeDivide(y570, totalIrradiance);
        const refl600 = safeDivide(o600, totalIrradiance);
        const refl610 = safeDivide(n610, totalIrradiance);
        const refl650 = safeDivide(r650, totalIrradiance);
        const refl680 = safeDivide(n680, totalIrradiance);
        const refl730 = safeDivide(n730, totalIrradiance);
        const refl760 = safeDivide(n760, totalIrradiance);
        const refl810 = safeDivide(n810, totalIrradiance);
        const refl860 = safeDivide(n860, totalIrradiance);
        const ndvi = safeDivide(n860 - r650, n860 + r650);
        const sr = safeDivide(n860, r650);
        // DSWI 4 approximation based on available STELLA bands.
        const dswi4 = safeDivide(n860 + g550, n680 + r650);
        const nirv = ndvi * refl860;

        return {
          id: index,  // Unique identifier for each data point
          dataPointId: row.id,
          timestamp: row.timestamp_iso8601,
          batchNumber,
          note: row.note || "",
          timeLabel: formatTimeLabel(date),
          // Temperature (try both uppercase and lowercase column names from postgres)
          surface_temp: parseFloat(row.surface_temperature_c || row.surface_temperature_C) || 0,
          air_temp: parseFloat(row.air_temperature_c || row.air_temperature_C) || 0,
          humidity: parseFloat(row.relative_humidity_percent) || 0,
          // Raw irradiance
          v450,
          b500,
          g550,
          y570,
          o600,
          n610,
          r650,
          n680,
          n730,
          n760,
          n810,
          n860,
          // Reflectance and vegetation indices
          refl450,
          refl500,
          refl550,
          refl570,
          refl600,
          refl610,
          refl650,
          refl680,
          refl730,
          refl760,
          refl810,
          refl860,
          ndvi,
          sr,
          dswi4,
          nirv,
        };
      });

      setGraphData(formatted);
      setNoteDrafts(
        Object.fromEntries(formatted.map((row) => [row.dataPointId, row.note || ""]))
      );
    } catch (err) {
      console.error("Failed to fetch graph data", err);
    } finally {
      setLoadingGraph(false);
    }
  };

  const handleNoteDraftChange = (dataPointId, value) => {
    setNoteDrafts((prev) => ({
      ...prev,
      [dataPointId]: value,
    }));
  };

  const handleSaveNote = async (dataPointId) => {
    if (!dataPointId) return;
    const note = noteDrafts[dataPointId] ?? "";
    setSavingNoteId(dataPointId);
    setNoteSaveStatus((prev) => ({ ...prev, [dataPointId]: "" }));

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/data/${dataPointId}/note`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });

      const responseBody = await res.json();
      if (!res.ok) {
        throw new Error(responseBody.error || 'Failed to save note');
      }

      setGraphData((prev) =>
        prev.map((row) =>
          row.dataPointId === dataPointId ? { ...row, note: responseBody.note ?? "" } : row
        )
      );
      setNoteSaveStatus((prev) => ({ ...prev, [dataPointId]: "Saved" }));
    } catch (error) {
      setNoteSaveStatus((prev) => ({ ...prev, [dataPointId]: "Save failed" }));
    } finally {
      setSavingNoteId(null);
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
    <div style={{ textAlign: "center", padding: "20px", maxWidth: "1680px", margin: "0 auto" }}>


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
            <div style={{ marginBottom: "50px", padding: "20px", border: "2px solid #000", borderRadius: "10px" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0, fontWeight: 700 }}>Data Graphs</h3>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <label htmlFor="batch-filter" style={{ fontWeight: "bold", fontSize: "14px" }}>
                    Batch
                  </label>
                  <select
                    id="batch-filter"
                    value={selectedBatchNumber}
                    onChange={(e) => setSelectedBatchNumber(e.target.value)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      backgroundColor: "white",
                      cursor: "pointer"
                    }}
                  >
                    {availableBatchNumbers.length === 0 ? (
                      <option value="" disabled>No batches available</option>
                    ) : (
                      availableBatchNumbers.map((batch) => (
                        <option key={batch} value={batch}>
                          {batch === "Unspecified" ? "Unspecified" : `Batch ${batch}`}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
              
              {loadingGraph ? <p>Loading data...</p> : (
                filteredGraphData.length === 0 ? <p>No data points found for this batch.</p> : (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(640px, 2.5fr))", gap: "30px" }}>
                      {graphConfigurations.map((config) => (
                        <div key={config.key} style={{ border: "1px solid #222", borderRadius: "12px", padding: "14px" }}>
                          <h4 style={{ margin: "0 0 16px 0", fontWeight: 700 }}>{config.title}</h4>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "center", marginBottom: "10px" }}>
                            {config.lines.map((line) => (
                              <div key={`${config.key}-${line.dataKey}-legend`} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                                <span style={{ width: "16px", height: "2px", backgroundColor: line.stroke, display: "inline-block" }} />
                                <span>{line.name}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ width: '100%', height: 605 }}>
                            <ResponsiveContainer>
                              <LineChart data={filteredGraphData} margin={{ top: 10, right: 55, left: 30, bottom: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                  dataKey="chartIndex"
                                  type="number"
                                  domain={[0, Math.max(filteredGraphData.length - 1, 0)]}
                                  ticks={xAxisTicks}
                                  tickFormatter={formatXAxisTick}
                                  allowDecimals={false}
                                  interval={0}
                                  height={65}
                                  tickMargin={14}
                                  padding={{ left: 0, right: 0 }}
                                  tick={{ fontWeight: 700, fill: '#000', fontSize: 12 }}
                                  axisLine={{ stroke: '#000' }}
                                  tickLine={{ stroke: '#000' }}
                                />
                                <YAxis
                                  domain={['auto', 'auto']}
                                  width={90}
                                  tick={{ fontWeight: 700, fill: '#000' }}
                                  axisLine={{ stroke: '#000' }}
                                  tickLine={{ stroke: '#000' }}
                                  label={{
                                    value: config.yAxisLabel,
                                    angle: -90,
                                    position: 'left',
                                    offset: 18,
                                    style: { textAnchor: 'middle', fontWeight: 700, fill: '#000' }
                                  }}
                                />
                                <Tooltip 
                                  formatter={(value, name) => {
                                    if (typeof value === 'number') {
                                      return [value.toFixed(4), name];
                                    }
                                    return [value, name];
                                  }}
                                  labelFormatter={(label) => {
                                    if (typeof label === 'string') return `Time: ${label}`;
                                    const pointIndex = Math.round(Number(label));
                                    const point = filteredGraphData[pointIndex];
                                    return point ? `Time: ${point.timeLabel}` : `Time: ${label}`;
                                  }}
                                />
                                {config.lines.map((line) => (
                                  <Line
                                    key={line.dataKey}
                                    type="monotone"
                                    dataKey={line.dataKey}
                                    stroke={line.stroke}
                                    dot={pointDotStyle}
                                    activeDot={activePointDotStyle}
                                    strokeWidth={2}
                                    name={line.name}
                                  />
                                ))}
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: "24px", textAlign: "left", border: "1px solid #222", borderRadius: "8px", padding: "14px" }}>
                      <h4 style={{ margin: "0 0 12px 0", fontWeight: 700 }}>Data Point Notes</h4>
                      <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#555" }}>
                        Add or update notes for any point in the selected batch.
                      </p>
                      <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                        {filteredGraphData.map((point) => (
                          <div
                            key={`note-${point.dataPointId}`}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "170px 1fr auto auto",
                              gap: "8px",
                              alignItems: "center",
                              padding: "8px 0",
                              borderBottom: "1px solid #eee"
                            }}
                          >
                            <div style={{ fontSize: "12px", color: "#333" }}>{point.timeLabel}</div>
                            <input
                              type="text"
                              value={noteDrafts[point.dataPointId] ?? ""}
                              onChange={(e) => handleNoteDraftChange(point.dataPointId, e.target.value)}
                              placeholder="Add note for this data point"
                              style={{
                                width: "100%",
                                padding: "7px 9px",
                                borderRadius: "4px",
                                border: "1px solid #bbb"
                              }}
                            />
                            <button
                              onClick={() => handleSaveNote(point.dataPointId)}
                              disabled={savingNoteId === point.dataPointId}
                              style={{
                                padding: "7px 12px",
                                borderRadius: "4px",
                                border: "none",
                                cursor: "pointer",
                                backgroundColor: savingNoteId === point.dataPointId ? "#ccc" : "#1f6feb",
                                color: "white"
                              }}
                            >
                              {savingNoteId === point.dataPointId ? "Saving..." : "Save"}
                            </button>
                            <span
                              style={{
                                minWidth: "70px",
                                fontSize: "12px",
                                color: noteSaveStatus[point.dataPointId]
                                  ? (noteSaveStatus[point.dataPointId] === "Saved" ? "green" : "red")
                                  : "#555"
                              }}
                            >
                              {noteSaveStatus[point.dataPointId] || ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )
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
