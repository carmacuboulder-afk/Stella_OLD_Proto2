import React, { useState } from "react";

export default function Data() {
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
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Data Page</h2>
      <p>Upload your data here</p>

      <div style={{ marginTop: "40px", borderTop: "1px solid #ccc", paddingTop: "20px" }}>
        <h3>Live USB Monitor</h3>

        <button
          onClick={connectToSerial}
          disabled={isConnected}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: isConnected ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: isConnected ? "default" : "pointer",
            marginBottom: "20px",
          }}
        >
          {isConnected ? "Connected" : "Connect to STELLA"}
        </button>

        {status && (
          <p
            style={{
              marginTop: "10px",
              color: status.includes("Error") || status.includes("failed") ? "red" : "green",
            }}
          >
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
    </div>
  );
}

