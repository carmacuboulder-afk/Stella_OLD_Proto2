import React, { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Link } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://stella-backend-qg81.onrender.com';

export default function Data() {
  const [activeTab, setActiveTab] = useState("history");
  const [selectedReferenceBatchKey, setSelectedReferenceBatchKey] = useState(""); //for white reference

  const [uploads, setUploads] = useState([]);
  const [accessibleOrgs, setAccessibleOrgs] = useState([]);
  const [selectedUploadId, setSelectedUploadId] = useState(null);
  const [rawUploadRows, setRawUploadRows] = useState([]);
  const [graphData, setGraphData] = useState([]);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadPublic, setIsUploadPublic] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadActionState, setUploadActionState] = useState({ uploadId: null, action: null });
  const [isHistoryEditMode, setIsHistoryEditMode] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [batchNoteDrafts, setBatchNoteDrafts] = useState({});
  const [batchNoteSaveStatus, setBatchNoteSaveStatus] = useState({});
  const [savingBatchKey, setSavingBatchKey] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState("user");
  const [selectedHistoryScope, setSelectedHistoryScope] = useState("user");

  const [selectedBatchKey, setSelectedBatchKey] = useState("");
  const [selectedTimestampIndex, setSelectedTimestampIndex] = useState(0);
  const [isTimestampPlaying, setIsTimestampPlaying] = useState(false);
  const [selectedRedWavelength, setSelectedRedWavelength] = useState("680");
  const [selectedNirWavelength, setSelectedNirWavelength] = useState("810");

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
  const chartCardRefs = useRef({});

  const pointDotStyle = { r: 1.5, fill: "#c7c7c7", stroke: "#c7c7c7", strokeWidth: 1 };
  const activePointDotStyle = { r: 2.5, fill: "#aaaaaa", stroke: "#aaaaaa", strokeWidth: 1 };
  const uiAccentGreen = "#a0bc98";
  const formatNumberWithCommas = (value, maximumFractionDigits = 4) =>
    Number(value).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits,
    });
  const parseOptionalNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const toFiniteNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const safeDivide = (numerator, denominator) => (denominator ? numerator / denominator : 0);
  const wavelengthBands = [
    { nm: "450", wavelengthKey: "w450", rawKey: "v450", reflectanceKey: "refl450", label: "450nm", color: "#6A5ACD" },
    { nm: "500", wavelengthKey: "w500", rawKey: "b500", reflectanceKey: "refl500", label: "500nm", color: "#00CED1" },
    { nm: "550", wavelengthKey: "w550", rawKey: "g550", reflectanceKey: "refl550", label: "550nm", color: "#32CD32" },
    { nm: "570", wavelengthKey: "w570", rawKey: "y570", reflectanceKey: "refl570", label: "570nm", color: "#FFD700" },
    { nm: "600", wavelengthKey: "w600", rawKey: "o600", reflectanceKey: "refl600", label: "600nm", color: "#FF8C00" },
    { nm: "610", wavelengthKey: "w610", rawKey: "n610", reflectanceKey: "refl610", label: "610nm", color: "#CD853F" },
    { nm: "650", wavelengthKey: "w650", rawKey: "r650", reflectanceKey: "refl650", label: "650nm", color: "#DC143C" },
    { nm: "680", wavelengthKey: "w680", rawKey: "n680", reflectanceKey: "refl680", label: "680nm", color: "#B22222" },
    { nm: "730", wavelengthKey: "w730", rawKey: "n730", reflectanceKey: "refl730", label: "730nm", color: "#946565" },
    { nm: "760", wavelengthKey: "w760", rawKey: "n760", reflectanceKey: "refl760", label: "760nm", color: "#856C6C" },
    { nm: "810", wavelengthKey: "w810", rawKey: "n810", reflectanceKey: "refl810", label: "810nm", color: "#757272" },
    { nm: "860", wavelengthKey: "w860", rawKey: "n860", reflectanceKey: "refl860", label: "860nm", color: "#666666" },
  ];
  const wavelengthLookup = Object.fromEntries(wavelengthBands.map((band) => [band.nm, band]));
  const reflectanceMetadataLabel = "Estimated reflectance";
  const clearSelectedUploadState = () => {
    setSelectedUploadId(null);
    setSelectedBatchKey("");
    setSelectedReferenceBatchKey("");
    setRawUploadRows([]);
    setGraphData([]);
    setBatchNoteDrafts({});
    setBatchNoteSaveStatus({});
    setSavingBatchKey(null);
  };
  const handleAuthRequired = (message = "Please log in to view and upload data.") => {
    setAuthRequired(true);
    setUploads([]);
    setAccessibleOrgs([]);
    setUploadActionState({ uploadId: null, action: null });
    clearSelectedUploadState();
    setUploadStatus(message);
  };
  const normalizeIdentifier = (value) => (value === null || value === undefined ? null : `${value}`);
  const normalizeUploadRecord = (upload) => ({
    ...upload,
    id: normalizeIdentifier(upload.id),
    org_id: normalizeIdentifier(upload.org_id),
    can_delete: Boolean(upload.can_delete),
    can_remove_from_org: Boolean(upload.can_remove_from_org),
  });
  const selectedDestinationOrgId = selectedDestination.startsWith("org:")
    ? selectedDestination.slice(4)
    : null;
  const resolveSelectedDestination = () => {
    if (selectedDestinationOrgId === null) {
      return { orgId: null, label: "My Uploads" };
    }

    const organization = accessibleOrgs.find((org) => normalizeIdentifier(org.id) === selectedDestinationOrgId);
    return {
      orgId: organization?.id ?? null,
      label: organization?.name ?? "Organization",
    };
  };
  const isUploadInSelectedDestination = (upload) => {
    if (selectedDestinationOrgId === null) {
      return upload.scope_type === "user" && (upload.org_id === null || upload.org_id === undefined);
    }

    return upload.scope_type === "organization" && normalizeIdentifier(upload.org_id) === selectedDestinationOrgId;
  };
  const buildScopeKey = ({ scope_type, org_id }) => (
    scope_type === "organization" ? `org:${normalizeIdentifier(org_id)}` : "user"
  );
  const formatTimeLabel = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };
  const formatDecimalHourLabel = (decimalHour, fallbackDate = null) => {
    const parsedDecimalHour = Number(decimalHour);

    if (Number.isFinite(parsedDecimalHour)) {
      const totalSeconds = Math.round(parsedDecimalHour * 60 * 60);
      const normalizedSeconds = ((totalSeconds % 86400) + 86400) % 86400;
      const hours = Math.floor(normalizedSeconds / 3600);
      const minutes = Math.floor((normalizedSeconds % 3600) / 60);
      const seconds = normalizedSeconds % 60;
      const meridiem = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 || 12;

      return `${displayHour}:${`${minutes}`.padStart(2, '0')}:${`${seconds}`.padStart(2, '0')} ${meridiem}`;
    }

    return fallbackDate ? formatTimeLabel(fallbackDate) : "--";
  };
  const normalizeBatchDate = (rawBatchDate, fallbackDate) => {
    const normalizedFallback = fallbackDate.toISOString().slice(0, 10);
    const trimmedValue = `${rawBatchDate ?? ""}`.trim();

    if (!trimmedValue) return normalizedFallback;

    const isoDateMatch = trimmedValue.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoDateMatch) return isoDateMatch[1];

    return trimmedValue;
  };
  const buildBatchKey = (batchNumber, batchDate) => `${batchNumber}::${batchDate}`;
  const buildBatchLabel = (batchNumber, batchDate) => (
    batchNumber === "Unspecified"
      ? `Unspecified - ${batchDate}`
      : `Batch ${batchNumber} - ${batchDate}`
  );
  const buildEvenlySpacedTicks = (pointCount, maxTicks = 6) => {
    if (pointCount <= 0) return [];
    if (pointCount === 1) return [0];

    const desiredTickCount = Math.min(maxTicks, pointCount);
    const lastIndex = pointCount - 1;
    const step = lastIndex / (desiredTickCount - 1);

    return Array.from({ length: desiredTickCount }, (_, index) =>
      index === desiredTickCount - 1 ? lastIndex : index * step
    );
  };
  const formatMetricValue = (value, digits = 4, suffix = "") => {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return "--";
    return `${Number(value).toFixed(digits)}${suffix}`;
  };
  const getSpectrumRegionLabel = (wavelength) => (Number(wavelength) >= 680 ? "Infrared" : "Visible");
  const renderSpectrumTooltip = ({ active, payload, measurementUnit = "" }) => {
    if (!active || !payload?.length) return null;

    const point = payload[0]?.payload;
    if (!point) return null;

    const xValue = Number(point.wavelength);
    const yValue = Number(point.magnitude);

    return (
      <div style={{
        backgroundColor: "white",
        border: "1px solid #d0d7de",
        borderRadius: "8px",
        padding: "10px 12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
        textAlign: "left"
      }}>
        <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>
          {formatNumberWithCommas(yValue)}{measurementUnit ? ` ${measurementUnit}` : ""}
        </div>
        <div style={{ fontSize: "13px", color: "#555" }}>
          {getSpectrumRegionLabel(xValue)}
        </div>
      </div>
    );
  };
  const buildSpectrumPoints = (row, measurementKey) => {
    if (!row) return [];

    return wavelengthBands
      .map((band) => ({
        wavelength: toFiniteNumber(row[band.wavelengthKey], Number(band.nm)),
        magnitude: toFiniteNumber(row[band[measurementKey]], 0),
        nominalBand: band.label,
        axisLabel: `${band.label}`,
        stroke: band.color,
      }))
      .sort((a, b) => a.wavelength - b.wavelength);
  };
  const resolveFlatNonNegativeDomain = (values) => {
    const finiteValues = values
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));

    if (finiteValues.length === 0) return ['auto', 'auto'];

    const minValue = Math.min(...finiteValues);
    const maxValue = Math.max(...finiteValues);

    if (minValue < 0 || Math.abs(maxValue - minValue) > 1e-9) {
      return ['auto', 'auto'];
    }

    const padding = maxValue === 0 ? 1 : Math.max(Math.abs(maxValue) * 0.1, 0.1);
    return [Math.max(0, minValue - padding), maxValue + padding];
  };
  const setChartCardRef = (chartKey, element) => {
    if (element) {
      chartCardRefs.current[chartKey] = element;
      return;
    }

    delete chartCardRefs.current[chartKey];
  };
  const sanitizeDownloadFileName = (value) => (
    `${value || "chart"}`
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      || "chart"
  );
  const downloadChartAsPng = async (chartKey, chartTitle, fileLabel = chartTitle) => {
    const chartCard = chartCardRefs.current[chartKey];
    const chartSvg = chartCard?.querySelector("svg");

    if (!chartSvg) {
      window.alert("The graph is not ready to download yet.");
      return;
    }

    const viewBox = chartSvg.viewBox?.baseVal;
    const svgWidth = Number(chartSvg.getAttribute("width"));
    const svgHeight = Number(chartSvg.getAttribute("height"));
    const exportWidth = Math.max(
      Math.round(
        (viewBox?.width && Number.isFinite(viewBox.width) ? viewBox.width : 0)
        || (Number.isFinite(svgWidth) ? svgWidth : 0)
        || chartSvg.clientWidth
        || 0
      ),
      800
    );
    const exportHeight = Math.max(
      Math.round(
        (viewBox?.height && Number.isFinite(viewBox.height) ? viewBox.height : 0)
        || (Number.isFinite(svgHeight) ? svgHeight : 0)
        || chartSvg.clientHeight
        || 0
      ),
      500
    );
    const titleFontSize = 28;
    const titlePaddingTop = 28;
    const titleSpacing = 18;
    const canvasWidth = exportWidth;
    const canvasHeight = exportHeight + titleFontSize + titlePaddingTop + titleSpacing;
    const serializedSvg = new XMLSerializer().serializeToString(chartSvg);
    const svgMarkupWithNamespace = serializedSvg.includes("xmlns=")
      ? serializedSvg
      : serializedSvg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    const svgMarkup = svgMarkupWithNamespace
      .replace(/width="[^"]*"/, `width="${exportWidth}"`)
      .replace(/height="[^"]*"/, `height="${exportHeight}"`);
    const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const image = new Image();

    try {
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = svgUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvasWidth, canvasHeight);
      context.fillStyle = "#111827";
      context.font = `700 ${titleFontSize}px Arial, sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "top";
      context.fillText(chartTitle, canvasWidth / 2, titlePaddingTop, canvasWidth - 40);
      context.drawImage(image, 0, titleFontSize + titlePaddingTop + titleSpacing, exportWidth, exportHeight);

      const downloadLink = document.createElement("a");
      downloadLink.href = canvas.toDataURL("image/png");
      downloadLink.download = `${sanitizeDownloadFileName(fileLabel)}.png`;
      downloadLink.click();
    } catch (error) {
      console.error("Failed to download chart", error);
      window.alert("Couldn't download that graph. Please try again.");
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  };
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const downloadAllChartsAsPng = async () => {
    const allChartConfigs = [
      ...graphConfigurations,
      ...timeSeriesGraphConfigurations,
      ...vegetationIndexTimeSeriesConfigurations,
    ];

    for (const chartConfig of allChartConfigs) {
      const fileLabel = selectedBatchLabel
        ? `${chartConfig.title} ${selectedBatchLabel}`
        : chartConfig.title;
      await downloadChartAsPng(chartConfig.key, chartConfig.title, fileLabel);
      await wait(150);
    }
  };

  const availableBatches = Array.from(
    rawUploadRows.reduce((batches, row) => {
      if (!row.batchKey || batches.has(row.batchKey)) return batches;

      batches.set(row.batchKey, {
        key: row.batchKey,
        batchNumber: row.batchNumber,
        batchDate: row.batchDate,
        label: row.batchLabel,
      });

      return batches;
    }, new Map()).values()
  ).sort((a, b) => {
    if (a.batchNumber === "Unspecified") return 1;
    if (b.batchNumber === "Unspecified") return -1;

    const aNum = Number(a.batchNumber);
    const bNum = Number(b.batchNumber);
    const aIsNumeric = Number.isFinite(aNum);
    const bIsNumeric = Number.isFinite(bNum);

    if (aIsNumeric && bIsNumeric && aNum !== bNum) return aNum - bNum;
    if (aIsNumeric && !bIsNumeric) return -1;
    if (!aIsNumeric && bIsNumeric) return 1;

    const batchCompare = a.batchNumber.localeCompare(b.batchNumber, undefined, {
      numeric: true,
      sensitivity: "base",
    });
    if (batchCompare !== 0) return batchCompare;

    return a.batchDate.localeCompare(b.batchDate);
  });

  const selectedBatchOption = availableBatches.find((batch) => batch.key === selectedBatchKey) ?? null;
  const selectedBatchLabel = selectedBatchOption?.label ?? "";
  const selectedBatchGraphData = graphData.filter((row) => row.batchKey === selectedBatchKey);
  const selectedBatchTimeSeriesData = selectedBatchGraphData.map((row, index) => ({
    ...row,
    chartIndex: index,
  }));
  const canPlayTimestamps = selectedBatchGraphData.length > 1;
  const clampedTimestampIndex = selectedBatchGraphData.length === 0
    ? 0
    : Math.min(selectedTimestampIndex, selectedBatchGraphData.length - 1);
  const selectedGraphRow = selectedBatchGraphData[clampedTimestampIndex] ?? null;
  const timeAxisTicks = buildEvenlySpacedTicks(selectedBatchTimeSeriesData.length, 4);
  const firstTimeAxisTick = timeAxisTicks[0];
  const lastTimeAxisTick = timeAxisTicks[timeAxisTicks.length - 1];
  const rawSpectrumData = buildSpectrumPoints(selectedGraphRow, "rawKey");
  const reflectanceSpectrumData = buildSpectrumPoints(selectedGraphRow, "reflectanceKey");
  const reflectanceSpectrumDomain = resolveFlatNonNegativeDomain(
    reflectanceSpectrumData.map((point) => point.magnitude)
  );
  const graphConfigurations = [
    {
      key: "raw_spectrum",
      title: "Raw Irradiance Spectrum",
      subtitle: "Selected timestamp plotted as measurement magnitude versus wavelength.",
      yAxisLabel: "Measurement Magnitude (uW/cm²)",
      lineName: "Irradiance",
      measurementUnit: "uW/cm²",
      data: rawSpectrumData,
      stroke: "#1f6feb",
      chartType: "bar",
    },
    {
      key: "reflectance_spectrum",
      title: "Reflectance Spectrum",
      subtitle: "Reflectance values derived from the selected timestamp across all wavelengths.",
      yAxisLabel: "Measurement Magnitude",
      lineName: "Reflectance",
      measurementUnit: "",
      data: reflectanceSpectrumData,
      stroke: "#2E8B57",
      chartType: "bar",
    },
  ];
  const reflectanceOverTimeDomain = resolveFlatNonNegativeDomain(
    selectedBatchTimeSeriesData.flatMap((row) =>
      wavelengthBands.map((band) => row[band.reflectanceKey])
    )
  );
  const selectedSnapshotCards = selectedGraphRow ? [
    { label: "Surface Temp", value: formatMetricValue(selectedGraphRow.surface_temp, 2, " °C") },
    { label: "Air Temp", value: formatMetricValue(selectedGraphRow.air_temp, 2, " °C") },
    { label: "Humidity", value: formatMetricValue(selectedGraphRow.humidity, 2, " %") },
    { label: "NDVI", value: formatMetricValue(selectedGraphRow.ndvi) },
    { label: "SR", value: formatMetricValue(selectedGraphRow.sr) },
    { label: "DSWI 4", value: formatMetricValue(selectedGraphRow.dswi4) },
    { label: "NIRv", value: formatMetricValue(selectedGraphRow.nirv) },
    { label: "RED / NIR", value: `${selectedRedWavelength}nm / ${selectedNirWavelength}nm` },
  ] : [];
  const timeSeriesGraphConfigurations = [
    {
      key: "raw_visible_over_time",
      title: "Raw Visible Spectrum",
      subtitle: "Batch measurements across visible wavelengths over time.",
      yAxisLabel: "Measurement Magnitude (uW/cm²)",
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
      key: "raw_infrared_over_time",
      title: "Raw Infrared Spectrum",
      subtitle: "Batch measurements across infrared wavelengths over time.",
      yAxisLabel: "Measurement Magnitude (uW/cm²)",
      lines: [
        { dataKey: "n680", stroke: "#B22222", name: "680nm" },
        { dataKey: "n730", stroke: "#946565", name: "730nm" },
        { dataKey: "n760", stroke: "#856C6C", name: "760nm" },
        { dataKey: "n810", stroke: "#757272", name: "810nm" },
        { dataKey: "n860", stroke: "#666666", name: "860nm" },
      ],
    },
    {
      key: "reflectance_over_time",
      title: "Reflectance",
      subtitle: "Batch reflectance values across all wavelengths over time.",
      yAxisLabel: "Measurement Magnitude",
      lines: wavelengthBands.map((band) => ({
        dataKey: band.reflectanceKey,
        stroke: band.color,
        name: band.label,
      })),
    },
    {
      key: "temperature_over_time",
      title: "Temperature",
      subtitle: "Air and surface temperature for the selected batch over time.",
      yAxisLabel: "Temperature (°C)",
      lines: [
        { dataKey: "surface_temp", stroke: "#DC143C", name: "Surface Temp" },
        { dataKey: "air_temp", stroke: "#1E90FF", name: "Air Temp" },
      ],
    },
  ];
  const vegetationIndexTimeSeriesConfigurations = [
    {
      key: "ndvi_over_time",
      title: "NDVI",
      yAxisLabel: "NDVI",
      lines: [{ dataKey: "ndvi", stroke: "#2E8B57", name: "NDVI" }],
    },
    {
      key: "sr_over_time",
      title: "SR",
      yAxisLabel: "SR",
      lines: [{ dataKey: "sr", stroke: "#1E90FF", name: "SR" }],
    },
    {
      key: "dswi4_over_time",
      title: "DSWI 4",
      yAxisLabel: "DSWI 4",
      lines: [{ dataKey: "dswi4", stroke: "#A0522D", name: "DSWI 4" }],
    },
    {
      key: "nirv_over_time",
      title: "NIRv",
      yAxisLabel: "NIRv",
      lines: [{ dataKey: "nirv", stroke: "#800080", name: "NIRv" }],
    },
  ];
  const groupedUploads = Array.from(
    uploads.reduce((groups, upload) => {
      const key = buildScopeKey(upload);

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label: upload.scope_label,
          uploads: [],
        });
      }

      groups.get(key).uploads.push(upload);
      return groups;
    }, new Map()).values()
  );
  const scopeCards = [
    {
      key: "user",
      title: "Personal",
      subtitle: "Your own uploads",
      accent: uiAccentGreen,
      count: uploads.filter((upload) => buildScopeKey(upload) === "user").length,
    },
    ...accessibleOrgs.map((org, index) => {
      const key = `org:${normalizeIdentifier(org.id)}`;
      return {
        key,
        title: org.name,
        subtitle: "Organization data",
        accent: uiAccentGreen,
        count: uploads.filter((upload) => buildScopeKey(upload) === key).length,
      };
    }),
  ];
  const selectedHistoryUploads = groupedUploads.find((group) => group.key === selectedHistoryScope)?.uploads ?? [];
  const selectedHistoryScopeCard = scopeCards.find((scope) => scope.key === selectedHistoryScope) ?? scopeCards[0];
  const selectedUploadRecord = uploads.find(
    (upload) => normalizeIdentifier(upload.id) === normalizeIdentifier(selectedUploadId)
  ) ?? null;
  const isUploadActionPending = (uploadId) => (
    normalizeIdentifier(uploadActionState.uploadId) === normalizeIdentifier(uploadId)
  );

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

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([fetchUserContext(), fetchUploads()]);
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedDestination === "user") return;

    const destinationStillAvailable = accessibleOrgs.some(
      (org) => `org:${normalizeIdentifier(org.id)}` === selectedDestination
    );

    if (!destinationStillAvailable) {
      setSelectedDestination("user");
    }
  }, [accessibleOrgs, selectedDestination]);

  useEffect(() => {
    const historyScopeStillAvailable = scopeCards.some((scope) => scope.key === selectedHistoryScope);

    if (!historyScopeStillAvailable) {
      setSelectedHistoryScope("user");
    }
  }, [scopeCards, selectedHistoryScope]);

  useEffect(() => {
    if (selectedUploadId === null) return;

    const selectedUploadStillVisible = uploads.some(
      (upload) => normalizeIdentifier(upload.id) === normalizeIdentifier(selectedUploadId)
    );
    if (!selectedUploadStillVisible) {
      clearSelectedUploadState();
      return;
    }

    const selectedUpload = uploads.find(
      (upload) => normalizeIdentifier(upload.id) === normalizeIdentifier(selectedUploadId)
    );
    if (selectedUpload) {
      const scopeKey = buildScopeKey(selectedUpload);
      if (scopeKey !== selectedHistoryScope) {
        setSelectedHistoryScope(scopeKey);
      }
    }
  }, [uploads, selectedUploadId, selectedHistoryScope]);

  useEffect(() => {
    if (availableBatches.length === 0) {
      if (selectedBatchKey !== "") setSelectedBatchKey("");
      return;
    }

    if (!availableBatches.some((batch) => batch.key === selectedBatchKey)) {
      setSelectedBatchKey(availableBatches[0].key);
    }
  }, [availableBatches, selectedBatchKey]);

  useEffect(() => {
  if (availableBatches.length === 0) {
    if (selectedReferenceBatchKey !== "") setSelectedReferenceBatchKey("");
    return;
  }

  if (!availableBatches.some((batch) => batch.key === selectedReferenceBatchKey)) {
    setSelectedReferenceBatchKey(availableBatches[0].key);
  }
}, [availableBatches, selectedReferenceBatchKey]);

  useEffect(() => {
    setSelectedTimestampIndex(0);
    setIsTimestampPlaying(false);
  }, [selectedBatchKey, selectedUploadId]);

  useEffect(() => {
    if (selectedBatchGraphData.length === 0) {
      if (selectedTimestampIndex !== 0) setSelectedTimestampIndex(0);
      return;
    }

    if (selectedTimestampIndex > selectedBatchGraphData.length - 1) {
      setSelectedTimestampIndex(0);
    }
  }, [selectedBatchGraphData.length, selectedTimestampIndex]);

  useEffect(() => {
    if (canPlayTimestamps || !isTimestampPlaying) return;
    setIsTimestampPlaying(false);
  }, [canPlayTimestamps, isTimestampPlaying]);

  useEffect(() => {
    if (!isTimestampPlaying || !canPlayTimestamps) return;

    const intervalId = window.setInterval(() => {
      setSelectedTimestampIndex((prev) => (
        prev >= selectedBatchGraphData.length - 1 ? 0 : prev + 1
      ));
    }, 1500);

    return () => window.clearInterval(intervalId);
  }, [isTimestampPlaying, canPlayTimestamps, selectedBatchGraphData.length]);

  useEffect(() => {
    if (rawUploadRows.length === 0) {
      setGraphData([]);
      return;
    }

    const referenceBatchRows = rawUploadRows.filter(
      (row) => row.batchKey === selectedReferenceBatchKey
    );

    const referenceRow = referenceBatchRows.reduce((bestRow, currentRow) => {
      if (!bestRow) return currentRow;

      const bestValue = toFiniteNumber(bestRow.n860, -Infinity);
      const currentValue = toFiniteNumber(currentRow.n860, -Infinity);

      return currentValue > bestValue ? currentRow : bestRow;
    }, null);

    const referenceBandValues = wavelengthBands.reduce((accumulator, band) => {
      accumulator[band.nm] = referenceRow
        ? toFiniteNumber(referenceRow[band.rawKey], 0)
        : 0;
      return accumulator;
    }, {});

    const selectedRedBand = wavelengthLookup[selectedRedWavelength];
    const selectedNirBand = wavelengthLookup[selectedNirWavelength];
    const dswiRedBand = wavelengthLookup["680"];
    const greenBand = wavelengthLookup["550"];
    const referenceBatchOption =
      availableBatches.find((batch) => batch.key === selectedReferenceBatchKey) ?? null;

    const formatted = rawUploadRows.map((row, index) => {
      const reflectanceValues = wavelengthBands.reduce((accumulator, band) => {
        accumulator[band.reflectanceKey] = safeDivide(
          Number(row[band.rawKey]) || 0,
          referenceBandValues[band.nm]
        );
        return accumulator;
      }, {});

      const selectedRedReflectance = reflectanceValues[selectedRedBand.reflectanceKey];
      const selectedNirReflectance = reflectanceValues[selectedNirBand.reflectanceKey];
      const dswiGreenReflectance = reflectanceValues[greenBand.reflectanceKey];
      const dswiRedReflectance = reflectanceValues[dswiRedBand.reflectanceKey];

      const ndvi = safeDivide(
        selectedNirReflectance - selectedRedReflectance,
        selectedNirReflectance + selectedRedReflectance
      );
      const sr = safeDivide(selectedNirReflectance, selectedRedReflectance);
      const dswi4 = safeDivide(
        selectedNirReflectance - dswiGreenReflectance,
        dswiRedReflectance + dswiGreenReflectance
      );
      const nirv = ndvi * selectedNirReflectance;

      return {
        ...row,
        id: index,
        ...reflectanceValues,
        ndvi,
        sr,
        dswi4,
        nirv,
        calculationMetadata: {
          redWavelength: selectedRedWavelength,
          nirWavelength: selectedNirWavelength,
          greenWavelength: "550",
          dswiRedWavelength: "680",
          reflectanceMode: "Reference batch white-sheet normalization",
          referenceBatchKey: selectedReferenceBatchKey,
          referenceBatchLabel: referenceBatchOption?.label ?? "",
          referenceTimestamp: referenceRow?.timeLabel ?? null,
          referenceRule: "highest_860nm_in_reference_batch",
        },
      };
    });

    setGraphData(formatted);

    setBatchNoteDrafts((previous) => {
      const nextDrafts = { ...previous };
      formatted.forEach((row) => {
        if (!(row.batchKey in nextDrafts)) {
          nextDrafts[row.batchKey] = previous[row.batchKey] ?? row.note ?? "";
        } else if (!nextDrafts[row.batchKey] && row.note) {
          nextDrafts[row.batchKey] = row.note;
        }
      });
      return nextDrafts;
    });
    }, [
      rawUploadRows,
      selectedReferenceBatchKey,
      selectedRedWavelength,
      selectedNirWavelength,
    ]);

  const fetchUploads = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/uploads`, {
        credentials: "include",
      });
      if (res.status === 401) {
        handleAuthRequired();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch uploads");
      }
      setAuthRequired(false);
      setUploads(data.map(normalizeUploadRecord));
    } catch (err) {
      console.error("Failed to fetch uploads", err);
    }
  };

  const fetchUserContext = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
        credentials: "include",
      });
      if (res.status === 401) {
        handleAuthRequired();
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch user context");
      }

      setAuthRequired(false);
      setAccessibleOrgs(
        Array.isArray(data.orgs)
          ? data.orgs.map((org) => ({ ...org, id: normalizeIdentifier(org.id) }))
          : []
      );
    } catch (err) {
      console.error("Failed to fetch user context", err);
    }
  };

  const handleSelectUpload = async (uploadId) => {
    setSelectedUploadId(uploadId);
    setSelectedBatchKey("");
    setSelectedReferenceBatchKey(""); //reset selected reference
    setRawUploadRows([]);
    setBatchNoteDrafts({});
    setBatchNoteSaveStatus({});
    setSavingBatchKey(null);
    setLoadingGraph(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/uploads/${uploadId}/data`, {
        credentials: "include",
      });
      if (res.status === 401) {
        handleAuthRequired();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch graph data");
      }
      
      // Sort by timestamp to ensure correct order
      const sorted = data.sort((a, b) => {
        const aDecimalHour = parseOptionalNumber(a.decimal_hour ?? a.dec_hour);
        const bDecimalHour = parseOptionalNumber(b.decimal_hour ?? b.dec_hour);

        if (aDecimalHour !== null && bDecimalHour !== null && aDecimalHour !== bDecimalHour) {
          return aDecimalHour - bDecimalHour;
        }

        return new Date(a.timestamp_iso8601) - new Date(b.timestamp_iso8601);
      });
      
      const formatted = sorted.map((row, index) => {
        const date = new Date(row.timestamp_iso8601);
        const rawBatchNumber = row.batch_number ?? row.batch ?? row.batchNumber ?? "";
        const batchNumber = `${rawBatchNumber}`.trim() || "Unspecified";
        const batchDate = normalizeBatchDate(row.batch_date, date);
        const batchKey = buildBatchKey(batchNumber, batchDate);
        const v450 = parseOptionalNumber(row.irradiance_450nm_blue_irradiance_uw_per_cm_squared);
        const b500 = parseOptionalNumber(row.irradiance_500nm_cyan_irradiance_uw_per_cm_squared);
        const g550 = parseOptionalNumber(row.irradiance_550nm_green_irradiance_uw_per_cm_squared);
        const y570 = parseOptionalNumber(row.irradiance_570nm_yellow_irradiance_uw_per_cm_squared);
        const o600 = parseOptionalNumber(row.irradiance_600nm_orange_irradiance_uw_per_cm_squared);
        const n610 = parseOptionalNumber(row.irradiance_610nm_orange_irradiance_uw_per_cm_squared);
        const r650 = parseOptionalNumber(row.irradiance_650nm_red_irradiance_uw_per_cm_squared);
        const n680 = parseOptionalNumber(row.irradiance_680nm_near_infrared_irradiance_uw_per_cm_squared);
        const n730 = parseOptionalNumber(row.irradiance_730nm_near_infrared_irradiance_uw_per_cm_squared);
        const n760 = parseOptionalNumber(row.irradiance_760nm_near_infrared_irradiance_uw_per_cm_squared);
        const n810 = parseOptionalNumber(row.irradiance_810nm_near_infrared_irradiance_uw_per_cm_squared);
        const n860 = parseOptionalNumber(row.irradiance_860nm_near_infrared_irradiance_uw_per_cm_squared);

        return {
          id: index,
          dataPointId: row.id,
          timestamp: row.timestamp_iso8601,
          decimalHour: parseOptionalNumber(row.decimal_hour ?? row.dec_hour),
          batchNumber,
          batchDate,
          batchKey,
          batchLabel: buildBatchLabel(batchNumber, batchDate),
          note: row.note || "",
          timeLabel: formatDecimalHourLabel(row.decimal_hour ?? row.dec_hour, date),
          // Temperature (try both uppercase and lowercase column names from postgres)
          surface_temp: parseOptionalNumber(row.surface_temperature_c ?? row.surface_temperature_C),
          air_temp: parseOptionalNumber(row.air_temperature_c ?? row.air_temperature_C),
          humidity: parseOptionalNumber(row.relative_humidity_percent),
          // Calibrated wavelength per band
          w450: parseOptionalNumber(row.irradiance_450nm_blue_wavelength_nm),
          w500: parseOptionalNumber(row.irradiance_500nm_cyan_wavelength_nm),
          w550: parseOptionalNumber(row.irradiance_550nm_green_wavelength_nm),
          w570: parseOptionalNumber(row.irradiance_570nm_yellow_wavelength_nm),
          w600: parseOptionalNumber(row.irradiance_600nm_orange_wavelength_nm),
          w610: parseOptionalNumber(row.irradiance_610nm_orange_wavelength_nm),
          w650: parseOptionalNumber(row.irradiance_650nm_red_wavelength_nm),
          w680: parseOptionalNumber(row.irradiance_680nm_near_infrared_wavelength_nm),
          w730: parseOptionalNumber(row.irradiance_730nm_near_infrared_wavelength_nm),
          w760: parseOptionalNumber(row.irradiance_760nm_near_infrared_wavelength_nm),
          w810: parseOptionalNumber(row.irradiance_810nm_near_infrared_wavelength_nm),
          w860: parseOptionalNumber(row.irradiance_860nm_near_infrared_wavelength_nm),
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
        };
      });

      setRawUploadRows(formatted);
    } catch (err) {
      console.error("Failed to fetch graph data", err);
    } finally {
      setLoadingGraph(false);
    }
  };

  const handleBatchNoteDraftChange = (batchKey, value) => {
    setBatchNoteDrafts((prev) => ({
      ...prev,
      [batchKey]: value,
    }));
  };

  const handleDeleteUpload = async (upload) => {
    if (!upload?.can_delete || isUploadActionPending(upload.id)) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${upload.upload_name}?`
    );
    if (!confirmed) return;

    setUploadActionState({ uploadId: upload.id, action: "delete" });

    try {
      const res = await fetch(`${API_BASE_URL}/api/uploads/${upload.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 401) {
        handleAuthRequired();
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete upload");
      }

      setUploads((prev) => prev.filter((item) => normalizeIdentifier(item.id) !== normalizeIdentifier(upload.id)));
      if (normalizeIdentifier(selectedUploadId) === normalizeIdentifier(upload.id)) {
        clearSelectedUploadState();
      }
      setIsHistoryEditMode((prev) => {
        const remainingUploads = uploads.filter((item) => normalizeIdentifier(item.id) !== normalizeIdentifier(upload.id));
        const hasRemainingDeletableUploads = remainingUploads.some((item) => item.can_delete);
        return hasRemainingDeletableUploads ? prev : false;
      });
      setUploadStatus(`Deleted "${upload.upload_name}".`);
    } catch (error) {
      setUploadStatus(`Error: ${error.message}`);
    } finally {
      setUploadActionState({ uploadId: null, action: null });
    }
  };

  const handleRemoveFromOrg = async (upload) => {
    if (!upload?.can_remove_from_org || isUploadActionPending(upload.id)) return;

    const confirmed = window.confirm(
      `Remove "${upload.upload_name}" from this organization? The upload will stay with the original uploader and move back to personal uploads.`
    );
    if (!confirmed) return;

    setUploadActionState({ uploadId: upload.id, action: "remove" });

    try {
      const res = await fetch(`${API_BASE_URL}/api/uploads/${upload.id}/remove-from-org`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.status === 401) {
        handleAuthRequired();
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove upload from organization");
      }

      const normalizedUpload = normalizeUploadRecord(data.upload);
      const currentUserOwnsUpload = Boolean(normalizedUpload.can_delete);

      setUploads((prev) => {
        if (!currentUserOwnsUpload) {
          return prev.filter((item) => normalizeIdentifier(item.id) !== normalizeIdentifier(upload.id));
        }

        return prev.map((item) =>
          normalizeIdentifier(item.id) === normalizeIdentifier(upload.id) ? normalizedUpload : item
        );
      });

      if (normalizeIdentifier(selectedUploadId) === normalizeIdentifier(upload.id)) {
        if (currentUserOwnsUpload) {
          setSelectedHistoryScope("user");
        } else {
          clearSelectedUploadState();
        }
      }

      setUploadStatus(`Removed "${upload.upload_name}" from the organization.`);
    } catch (error) {
      setUploadStatus(`Error: ${error.message}`);
    } finally {
      setUploadActionState({ uploadId: null, action: null });
    }
  };

  const handleSaveBatchNote = async () => {
    if (!selectedUploadId || !selectedBatchKey || !selectedBatchOption) return;
    const note = batchNoteDrafts[selectedBatchKey] ?? "";
    setSavingBatchKey(selectedBatchKey);
    setBatchNoteSaveStatus((prev) => ({ ...prev, [selectedBatchKey]: "" }));

    try {
      const res = await fetch(`${API_BASE_URL}/api/data/batch-note`, {
        method: 'PUT',
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId: selectedUploadId,
          batchNumber: selectedBatchOption.batchNumber,
          batchDate: selectedBatchOption.batchDate,
          note,
        }),
      });
      if (res.status === 401) {
        handleAuthRequired();
        return;
      }

      const responseBody = await res.json();
      if (!res.ok) {
        throw new Error(responseBody.error || 'Failed to save note');
      }

      setBatchNoteDrafts((prev) => ({
        ...prev,
        [selectedBatchKey]: responseBody.note ?? '',
      }));
      setGraphData((prev) =>
        prev.map((row) =>
          row.batchKey === selectedBatchKey ? { ...row, note: responseBody.note ?? "" } : row
        )
      );
      setRawUploadRows((prev) =>
        prev.map((row) =>
          row.batchKey === selectedBatchKey ? { ...row, note: responseBody.note ?? "" } : row
        )
      );
      setBatchNoteSaveStatus((prev) => ({ ...prev, [selectedBatchKey]: "Saved" }));
    } catch (error) {
      setBatchNoteSaveStatus((prev) => ({ ...prev, [selectedBatchKey]: "Save failed" }));
    } finally {
      setSavingBatchKey(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    const destination = resolveSelectedDestination();
    const isDuplicate = uploads.some((upload) =>
      isUploadInSelectedDestination(upload) && upload.upload_name === selectedFile.name
    );
    
    if (isDuplicate) {
      setUploadStatus(`Error: "${destination.label}" already has an upload named "${selectedFile.name}".`);
      return;
    }
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("is_public", isUploadPublic ? "true" : "false");
    if (destination.orgId !== null) {
      formData.append("org_id", `${destination.orgId}`);
    }

    try {
      setUploadStatus("Uploading...");
      const res = await fetch(`${API_BASE_URL}/api/uploads/csv`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (res.status === 401) {
        handleAuthRequired();
        return;
      }
      const data = await res.json();
      if (res.ok) {
        const hasBatchWarnings = Array.isArray(data.batchWarnings) && data.batchWarnings.length > 0;
        setUploadStatus(
          `Success! Processed ${data.rows || 0} rows.${hasBatchWarnings ? ' Duplicate batch numbers were split by date in the viewer.' : ''}`
        );
        setSelectedFile(null);
        setIsUploadPublic(false);
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
      const destination = resolveSelectedDestination();
      const res = await fetch(`${API_BASE_URL}/api/uploads/live/start`, {
        method: 'POST',
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_type: deviceType,
          software_version: softwareVersion,
          org_id: destination.orgId,
        }),
      });
      if (res.status === 401) {
        handleAuthRequired();
        return null;
      }
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
      const res = await fetch(`${API_BASE_URL}/api/uploads/live/end`, {
        method: 'POST',
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: liveSession.sessionId }),
      });
      if (res.status === 401) {
        handleAuthRequired();
        return;
      }
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
          const res = await fetch(`${API_BASE_URL}/api/uploads/live/data`, {
            method: 'POST',
            credentials: "include",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: session.sessionId,
              deviceId: session.deviceId,
              ...data
            }),
          });
          if (res.status === 401) {
            handleAuthRequired();
            return { uploaded, total: dataPoints.length };
          }
          if (res.ok) uploaded++;
        } catch (error) {
          console.error('Failed to upload data point:', error);
        }
      }
      
      // End session
      const endRes = await fetch(`${API_BASE_URL}/api/uploads/live/end`, {
        method: 'POST',
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.sessionId }),
      });
      if (endRes.status === 401) {
        handleAuthRequired();
      }
      
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
      const res = await fetch(`${API_BASE_URL}/api/uploads/live/data`, {
        method: 'POST',
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.sessionId,
          deviceId: currentSession.deviceId,
          ...data
        }),
      });
      if (res.status === 401) {
        handleAuthRequired();
        return;
      }
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

      if ((newData.dec_hour === undefined || newData.dec_hour === "") && newData.decimal_hour !== undefined) {
        newData.dec_hour = newData.decimal_hour;
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
  const renderTimeSeriesChartCard = (config, containerStyle = {}) => (
    <div
      key={config.key}
      ref={(element) => setChartCardRef(config.key, element)}
      style={{ border: "1px solid #d0d7de", borderRadius: "10px", padding: "14px", backgroundColor: "#fff", ...containerStyle }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <h5 style={{ margin: 0, fontWeight: 700, fontSize: "24px", textAlign: "center", flex: "1 1 auto" }}>{config.title}</h5>
        <button
          type="button"
          onClick={() => downloadChartAsPng(
            config.key,
            config.title,
            selectedBatchLabel ? `${config.title} ${selectedBatchLabel}` : config.title
          )}
          style={{
            padding: "7px 12px",
            borderRadius: "4px",
            border: "1px solid #d0d7de",
            backgroundColor: "#ffffff",
            cursor: "pointer",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          Download PNG
        </button>
      </div>
      {config.lines.length > 1 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
          {config.lines.map((line) => (
            <div key={`${config.key}-${line.dataKey}-legend`} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
              <span style={{ width: "16px", height: "2px", backgroundColor: line.stroke, display: "inline-block" }} />
              <span>{line.name}</span>
            </div>
          ))}
        </div>
      ) : null}
      <div style={{ width: "100%", height: 340 }}>
        <ResponsiveContainer>
          <LineChart data={selectedBatchTimeSeriesData} margin={{ top: 10, right: 30, left: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="chartIndex"
              type="number"
              domain={[0, Math.max(selectedBatchTimeSeriesData.length - 1, 0)]}
              ticks={timeAxisTicks}
              allowDecimals={false}
              interval={0}
              tickMargin={12}
              tick={({ x, y, payload }) => {
                const pointIndex = Math.round(Number(payload.value));
                const timeLabel = selectedBatchTimeSeriesData[pointIndex]?.timeLabel || "";
                const isFirstTick = payload.value === firstTimeAxisTick;
                const isLastTick = payload.value === lastTimeAxisTick;

                return (
                  <text
                    x={x + (isFirstTick ? 12 : isLastTick ? -12 : 0)}
                    y={y}
                    dy={16}
                    textAnchor={isFirstTick ? "start" : isLastTick ? "end" : "middle"}
                    fill="#000"
                    fontWeight={700}
                    fontSize={13}
                  >
                    {timeLabel}
                  </text>
                );
              }}
              axisLine={{ stroke: '#000' }}
              tickLine={{ stroke: '#000' }}
            />
            <YAxis
              domain={config.key === "reflectance_over_time" ? reflectanceOverTimeDomain : ['auto', 'auto']}
              width={95}
              tickFormatter={(value) => formatNumberWithCommas(value, 2)}
              tick={{ fontWeight: 700, fill: '#000' }}
              axisLine={{ stroke: '#000' }}
              tickLine={{ stroke: '#000' }}
              label={{
                value: config.yAxisLabel,
                angle: -90,
                position: 'left',
                offset: 10,
                style: { textAnchor: 'middle', fontWeight: 700, fill: '#000' }
              }}
            />
            <Tooltip
              formatter={(value, name) => [formatNumberWithCommas(value), name]}
              labelFormatter={(value) => {
                const pointIndex = Math.round(Number(value));
                const point = selectedBatchTimeSeriesData[pointIndex];
                return point ? `Time: ${point.timeLabel}` : `Time: ${value}`;
              }}
            />
            {config.lines.map((line) => (
              <Line
                key={`${config.key}-${line.dataKey}`}
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
  );

  return (
    <div style={{ textAlign: "center", padding: "20px", maxWidth: "1680px", margin: "0 auto" }}>


      {/* tab toggle */}
      <div style={{ display: "flex", justifyContent: "center", width: "100%", marginBottom: "30px", zoom: "67%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", width: "100%", maxWidth: "480px" }}>
        <button 
          onClick={() => setActiveTab("history")}
          style={{
            width: "100%",
            padding: "10px 30px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            border: "none",
            borderRadius: "5px",
            backgroundColor: activeTab === "history" ? uiAccentGreen : "#e0e0e0",
            color: activeTab === "history" ? "white" : "#333"
          }}
        >
          Upload & History
        </button>

        <button 
          onClick={() => setActiveTab("live")}
          style={{
            width: "100%",
            padding: "10px 30px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            border: "none",
            borderRadius: "5px",
            backgroundColor: activeTab === "live" ? uiAccentGreen : "#e0e0e0",
            color: activeTab === "live" ? "white" : "#333"
          }}
        >
          Live Monitor
        </button>
        </div>
      </div>

      {/* history*/}
      {activeTab === "history" && (
        <div className="fade-in">
          {authRequired && (
            <div style={{ marginBottom: "24px", padding: "16px 18px", border: "1px solid #f5c2c7", borderRadius: "8px", backgroundColor: "#fff5f5", color: "#842029", zoom: "67%" }}>
              Please log in to view personal and organization uploads.
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "40px", zoom: "67%" }}>
            
            {/* upload box */}
            <div style={{ 
              padding: "24px", 
              border: "1px solid #d6dee8", 
              borderRadius: "18px", 
              background: "linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)",
              boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
              minHeight: "350px", 
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start"
            }}>
              <h3 style={{ marginTop: 0, marginBottom: "18px", fontSize: "28px", textAlign: "center", fontWeight: 800 }}>Upload New Data</h3>

              <div style={{ marginBottom: "16px", textAlign: "left" }}>
                <div style={{ fontWeight: "bold", marginBottom: "10px", fontSize: "14px", color: "#102a43" }}>
                  Upload Destination
                </div>
                <div style={{ display: "grid", gap: "10px", maxHeight: "250px", overflowY: "auto", paddingRight: "4px" }}>
                  {scopeCards.map((scope) => {
                    const isSelected = selectedDestination === scope.key;
                    return (
                      <button
                        key={`destination-${scope.key}`}
                        type="button"
                        onClick={() => setSelectedDestination(scope.key)}
                        disabled={authRequired}
                        style={{
                          textAlign: "left",
                          padding: "14px 16px",
                          borderRadius: "14px",
                          border: isSelected ? `2px solid ${scope.accent}` : "1px solid #d7e0ea",
                          background: "#ffffff",
                          color: "#102a43",
                          cursor: authRequired ? "default" : "pointer",
                          boxShadow: "none",
                          transition: "all 150ms ease",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "15px" }}>{scope.title}</div>
                          <div style={{ marginTop: "4px", fontSize: "12px", color: "#526071" }}>{scope.subtitle}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <input 
                type="file" 
                accept=".csv" 
                onChange={(e) => setSelectedFile(e.target.files[0])} 
                disabled={authRequired}
                style={{ 
                   marginBottom: "15px", 
                   border: "1px solid #d7e0ea",
                   padding: "10px 12px",
                   borderRadius: "12px",
                   backgroundColor: "#ffffff",
                   width: "100%",
                   boxSizing: "border-box",
                   cursor: "pointer"
                }}
              />

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "15px",
                  color: "#102a43",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: authRequired ? "default" : "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={isUploadPublic}
                  onChange={(e) => setIsUploadPublic(e.target.checked)}
                  disabled={authRequired}
                  style={{ width: "16px", height: "16px", margin: 0 }}
                />
                Mark this upload as public
              </label>
              
              <button 
                onClick={handleFileUpload} 
                disabled={!selectedFile || authRequired} 
                style={{ 
                  marginLeft: "0",
                  width: "100%",
                  padding: "12px 14px", 
                  cursor: !selectedFile || authRequired ? "default" : "pointer",
                  backgroundColor: !selectedFile || authRequired ? "#b8c2cc" : uiAccentGreen,
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: 700,
                  boxShadow: !selectedFile || authRequired ? "none" : "0 14px 28px rgba(15, 157, 88, 0.18)",
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
            <div style={{ padding: "24px", border: "1px solid #d6dee8", borderRadius: "18px", background: "linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%)", boxShadow: "0 18px 40px rgba(15, 23, 42, 0.06)", textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <h3 style={{ margin: 0, fontSize: "28px", textAlign: "center", fontWeight: 800, flex: 1 }}>Select Past Upload</h3>
                {!authRequired && uploads.some((upload) => upload.can_delete) ? (
                  <button
                    type="button"
                    onClick={() => setIsHistoryEditMode((prev) => !prev)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "999px",
                      border: "1px solid #d7e0ea",
                      backgroundColor: isHistoryEditMode ? "#fff1f2" : "#ffffff",
                      color: isHistoryEditMode ? "#b91c1c" : "#102a43",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isHistoryEditMode ? "Done" : "Edit"}
                  </button>
                ) : null}
              </div>
              {authRequired ? (
                <p>Log in to load your uploads.</p>
              ) : uploads.length === 0 ? (
                <p>No uploads found for your account or organizations.</p>
              ) : (
                <>
                  <div style={{ fontWeight: "bold", marginTop: "18px", marginBottom: "10px", fontSize: "14px", color: "#102a43" }}>
                    Upload Destination
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 220px) 1fr", gap: "18px", alignItems: "start" }}>
                    <div style={{ display: "grid", gap: "10px", maxHeight: "255px", overflowY: "auto", paddingRight: "4px" }}>
                      {scopeCards.map((scope) => {
                        const isActive = selectedHistoryScope === scope.key;
                        return (
                          <button
                            key={`history-scope-${scope.key}`}
                            type="button"
                            onClick={() => {
                              const nextScopeUploads = groupedUploads.find((group) => group.key === scope.key)?.uploads ?? [];
                              setSelectedHistoryScope(scope.key);
                              const currentUploadInScope = nextScopeUploads.some(
                                (upload) => normalizeIdentifier(upload.id) === normalizeIdentifier(selectedUploadId)
                              );
                              if (!currentUploadInScope) {
                                clearSelectedUploadState();
                              }
                            }}
                            style={{
                              textAlign: "left",
                              padding: "14px 15px",
                              borderRadius: "14px",
                              border: isActive ? `2px solid ${scope.accent}` : "1px solid #d7e0ea",
                              background: "#ffffff",
                              cursor: "pointer",
                              color: "#102a43",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: "15px" }}>{scope.title}</div>
                                <div style={{ marginTop: "4px", fontSize: "12px", color: "#526071" }}>{scope.subtitle}</div>
                              </div>
                              <div style={{
                                minWidth: "30px",
                                height: "30px",
                                borderRadius: "999px",
                                backgroundColor: "#edf2f7",
                                color: scope.accent,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: 700,
                              }}>
                                {scope.count}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ border: "1px solid #e2e8f0", borderRadius: "16px", backgroundColor: "#ffffff", minHeight: "260px", overflow: "hidden" }}>
                      {selectedHistoryUploads.length === 0 ? (
                        <div style={{ padding: "22px 18px", color: "#526071", fontSize: "14px" }}>
                          No uploads in this scope yet.
                        </div>
                      ) : (
                        <div style={{ maxHeight: "255px", overflowY: "auto", padding: "10px" }}>
                          {selectedHistoryUploads.map((upload) => {
                            const isSelected = normalizeIdentifier(upload.id) === normalizeIdentifier(selectedUploadId);
                            const isActionPending = isUploadActionPending(upload.id);
                            const createdLabel = upload.created_at
                              ? new Date(upload.created_at).toLocaleDateString()
                              : "";

                            return (
                              <div
                                key={upload.id}
                                onClick={() => handleSelectUpload(upload.id)}
                                style={{
                                  width: "100%",
                                  textAlign: "left",
                                  padding: "14px 16px",
                                  borderRadius: "14px",
                                  border: isSelected ? `2px solid ${selectedHistoryScopeCard?.accent || "#1f6feb"}` : "1px solid #edf2f7",
                                  background: "#ffffff",
                                  marginBottom: "10px",
                                  boxShadow: "none",
                                  cursor: "pointer",
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "12px" }}>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                      <div style={{ fontWeight: 700, fontSize: "15px", color: "#102a43", wordBreak: "break-word" }}>
                                        {upload.upload_name}
                                      </div>
                                      {isHistoryEditMode && upload.can_delete ? (
                                        <button
                                          type="button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            handleDeleteUpload(upload);
                                          }}
                                          disabled={isActionPending}
                                          style={{
                                            padding: "3px 8px",
                                            borderRadius: "999px",
                                            border: "1px solid #fecaca",
                                            backgroundColor: isActionPending ? "#f1f5f9" : "#fff1f2",
                                            color: "#b91c1c",
                                            fontSize: "10px",
                                            fontWeight: 700,
                                            cursor: isActionPending ? "default" : "pointer",
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          {uploadActionState.action === "delete" && isActionPending ? "Deleting..." : "Delete"}
                                        </button>
                                      ) : null}
                                    </div>
                                    <div style={{ marginTop: "6px", fontSize: "12px", color: "#526071" }}>
                                      {createdLabel ? `Added ${createdLabel}` : "Recently uploaded"}
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                    {isHistoryEditMode && upload.can_remove_from_org ? (
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleRemoveFromOrg(upload);
                                        }}
                                        disabled={isActionPending}
                                        style={{
                                          padding: "6px 10px",
                                          borderRadius: "999px",
                                          border: "1px solid #d0d7de",
                                          backgroundColor: isActionPending ? "#f1f5f9" : "#fff7ed",
                                          color: "#9a3412",
                                          fontSize: "11px",
                                          fontWeight: 700,
                                          cursor: isActionPending ? "default" : "pointer",
                                        }}
                                      >
                                        {uploadActionState.action === "remove" && isActionPending ? "Removing..." : "Remove from org"}
                                      </button>
                                    ) : null}
                                    <div style={{
                                      padding: "5px 8px",
                                      borderRadius: "999px",
                                      backgroundColor: isSelected ? (selectedHistoryScopeCard?.accent || "#1f6feb") : "#edf2f7",
                                      color: isSelected ? "#fff" : "#526071",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      whiteSpace: "nowrap",
                                    }}>
                                      {isSelected ? "Viewing" : "Open"}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* graph */}
          {selectedUploadId && (
            <div style={{ marginBottom: "50px", padding: "20px", border: "2px solid #000", borderRadius: "10px", zoom: "67%" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
                  <h3 style={{ margin: 0, fontWeight: 700, fontSize: "30px" }}>Data Graphs</h3>
                  <Link
                    to="/docs"
                    style={{
                      fontSize: "13px",
                      color: "#1f6feb",
                      textDecoration: "underline"
                    }}
                  >
                    More info on graph formulas and interpretation
                  </Link>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={downloadAllChartsAsPng}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "4px",
                        border: "1px solid #d0d7de",
                        backgroundColor: "#ffffff",
                        cursor: "pointer",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Download All PNGs
                    </button>
                    <label htmlFor="batch-filter" style={{ fontWeight: "bold", fontSize: "14px" }}>
                      Batch
                    </label>
                    <select
                      id="batch-filter"
                      value={selectedBatchKey}
                      onChange={(e) => setSelectedBatchKey(e.target.value)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        backgroundColor: "white",
                        cursor: "pointer"
                      }}
                    >
                      {availableBatches.length === 0 ? (
                        <option value="" disabled>No batches available</option>
                      ) : (
                        availableBatches.map((batch) => (
                          <option key={batch.key} value={batch.key}>
                            {batch.label}
                          </option>
                        ))
                      )}
                    </select>
                    <label htmlFor="reference-batch-filter" style={{ fontWeight: "bold", fontSize: "14px" }}>
                      Reference Sheet
                    </label>
                    <select
                      id="reference-batch-filter"
                      value={selectedReferenceBatchKey}
                      onChange={(e) => setSelectedReferenceBatchKey(e.target.value)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        backgroundColor: "white",
                        cursor: "pointer"
                      }}
                    >
                      {availableBatches.length === 0 ? (
                        <option value="" disabled>No batches available</option>
                      ) : (
                        availableBatches.map((batch) => (
                          <option key={`reference-${batch.key}`} value={batch.key}>
                            {batch.label}
                          </option>
                        ))
                      )}
                    </select>

                    <label htmlFor="nir-band-filter" style={{ fontWeight: "bold", fontSize: "14px" }}>
                      NIR
                    </label>
                    <select
                      id="nir-band-filter"
                      value={selectedNirWavelength}
                      onChange={(e) => setSelectedNirWavelength(e.target.value)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        backgroundColor: "white",
                        cursor: "pointer"
                      }}
                    >
                      {wavelengthBands.map((band) => (
                        <option key={`nir-${band.nm}`} value={band.nm}>
                          {band.label}
                        </option>
                      ))}
                    </select>

                    <label htmlFor="red-band-filter" style={{ fontWeight: "bold", fontSize: "14px" }}>
                      RED
                    </label>
                    <select
                      id="red-band-filter"
                      value={selectedRedWavelength}
                      onChange={(e) => setSelectedRedWavelength(e.target.value)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        backgroundColor: "white",
                        cursor: "pointer"
                      }}
                    >
                      {wavelengthBands.map((band) => (
                        <option key={`red-${band.nm}`} value={band.nm}>
                          {band.label}
                        </option>
                      ))}
                    </select>

                </div>
              </div>

              {loadingGraph ? <p>Loading data...</p> : (
                selectedBatchGraphData.length === 0 ? <p>No data points found for this batch.</p> : (
                  <>
                    <div style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "14px",
                      marginBottom: "22px",
                      padding: "14px",
                      border: "1px solid #d0d7de",
                      borderRadius: "10px",
                      backgroundColor: "#f8fafc"
                    }}>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: "20px", fontWeight: 700 }}>{selectedGraphRow?.timeLabel || "--"}</div>
                        <div style={{ fontSize: "13px", color: "#555", marginTop: "4px" }}>
                          Snapshot {clampedTimestampIndex + 1} of {selectedBatchGraphData.length}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setSelectedTimestampIndex((prev) => Math.max(prev - 1, 0))}
                          disabled={clampedTimestampIndex === 0}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            cursor: clampedTimestampIndex === 0 ? "default" : "pointer",
                            backgroundColor: clampedTimestampIndex === 0 ? "#f3f4f6" : "white"
                          }}
                        >
                          Previous
                        </button>

                        <label htmlFor="timestamp-filter" style={{ fontWeight: "bold", fontSize: "14px" }}>
                          Timestamp
                        </label>
                        <select
                          id="timestamp-filter"
                          value={clampedTimestampIndex}
                          onChange={(e) => setSelectedTimestampIndex(Number(e.target.value))}
                          style={{
                            minWidth: "220px",
                            padding: "6px 10px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            backgroundColor: "white",
                            cursor: "pointer"
                          }}
                        >
                          {selectedBatchGraphData.map((row, index) => (
                            <option key={`${row.dataPointId}-${row.timestamp}`} value={index}>
                              {`${index + 1}. ${row.timeLabel}`}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => setIsTimestampPlaying((prev) => !prev)}
                          disabled={!canPlayTimestamps}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            cursor: !canPlayTimestamps ? "default" : "pointer",
                            backgroundColor: !canPlayTimestamps
                              ? "#f3f4f6"
                              : (isTimestampPlaying ? "#e8f0fe" : "white"),
                            fontWeight: 600,
                          }}
                        >
                          {isTimestampPlaying ? "Pause" : "Play"}
                        </button>

                        <button
                          onClick={() => setSelectedTimestampIndex((prev) => Math.min(prev + 1, selectedBatchGraphData.length - 1))}
                          disabled={clampedTimestampIndex === selectedBatchGraphData.length - 1}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            cursor: clampedTimestampIndex === selectedBatchGraphData.length - 1 ? "default" : "pointer",
                            backgroundColor: clampedTimestampIndex === selectedBatchGraphData.length - 1 ? "#f3f4f6" : "white"
                          }}
                        >
                          Next
                        </button>
                      </div>
                    </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "30px" }}>
                      {graphConfigurations.map((config) => (
                        <div
                          key={config.key}
                          ref={(element) => setChartCardRef(config.key, element)}
                          style={{ border: "1px solid #222", borderRadius: "12px", padding: "14px" }}
                        >
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                            <h4 style={{ margin: 0, fontWeight: 700, fontSize: "24px", textAlign: "center", flex: "1 1 auto" }}>{config.title}</h4>
                            <button
                              type="button"
                              onClick={() => downloadChartAsPng(
                                config.key,
                                config.title,
                                selectedBatchLabel ? `${config.title} ${selectedBatchLabel}` : config.title
                              )}
                              style={{
                                padding: "7px 12px",
                                borderRadius: "4px",
                                border: "1px solid #d0d7de",
                                backgroundColor: "#ffffff",
                                cursor: "pointer",
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                              }}
                            >
                              Download PNG
                            </button>
                          </div>
                          <div style={{ width: '100%', height: 430 }}>
                            <ResponsiveContainer>
                              {config.chartType === "bar" ? (
                                <BarChart data={config.data} margin={{ top: 10, right: 30, left: 20, bottom: 30 }} barSize={36}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis
                                    dataKey="axisLabel"
                                    type="category"
                                    interval={0}
                                    tick={{ fontWeight: 700, fill: '#000', fontSize: 12 }}
                                    axisLine={{ stroke: '#000' }}
                                    tickLine={{ stroke: '#000' }}
                                    label={{
                                      value: 'Wavelength (nm)',
                                      position: 'insideBottom',
                                      offset: -14,
                                      style: { fontWeight: 700, fill: '#000' }
                                    }}
                                  />
                                  <YAxis
                                    domain={config.key === "reflectance_spectrum" ? reflectanceSpectrumDomain : ['auto', 'auto']}
                                    width={95}
                                    tickFormatter={(value) => formatNumberWithCommas(value, 2)}
                                    tick={{ fontWeight: 700, fill: '#000' }}
                                    axisLine={{ stroke: '#000' }}
                                    tickLine={{ stroke: '#000' }}
                                    label={{
                                      value: config.yAxisLabel,
                                      angle: -90,
                                      position: 'left',
                                      offset: 10,
                                      style: { textAnchor: 'middle', fontWeight: 700, fill: '#000' }
                                    }}
                                  />
                                  <Tooltip content={(tooltipProps) => renderSpectrumTooltip({ ...tooltipProps, measurementUnit: config.measurementUnit })} />
                                  <Bar dataKey="magnitude" name={config.lineName} radius={[0, 0, 0, 0]}>
                                    {config.data.map((entry) => (
                                      <Cell key={`${config.key}-${entry.nominalBand}`} fill={entry.stroke} stroke={entry.stroke} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              ) : (
                                <LineChart data={config.data} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis
                                    dataKey="wavelength"
                                    type="number"
                                    domain={['auto', 'auto']}
                                    tickFormatter={(value) => `${Math.round(value)}`}
                                    tick={{ fontWeight: 700, fill: '#000', fontSize: 12 }}
                                    axisLine={{ stroke: '#000' }}
                                    tickLine={{ stroke: '#000' }}
                                    label={{
                                      value: 'Wavelength (nm)',
                                      position: 'insideBottom',
                                      offset: -14,
                                      style: { fontWeight: 700, fill: '#000' }
                                    }}
                                  />
                                  <YAxis
                                    domain={['auto', 'auto']}
                                    width={95}
                                    tickFormatter={(value) => formatNumberWithCommas(value, 2)}
                                    tick={{ fontWeight: 700, fill: '#000' }}
                                    axisLine={{ stroke: '#000' }}
                                    tickLine={{ stroke: '#000' }}
                                    label={{
                                      value: config.yAxisLabel,
                                      angle: -90,
                                      position: 'left',
                                      offset: 10,
                                      style: { textAnchor: 'middle', fontWeight: 700, fill: '#000' }
                                    }}
                                  />
                                  <Tooltip content={(tooltipProps) => renderSpectrumTooltip({ ...tooltipProps, measurementUnit: config.measurementUnit })} />
                                  <Line
                                    type="monotone"
                                    dataKey="magnitude"
                                    stroke={config.stroke}
                                    dot={{ ...pointDotStyle, fill: config.stroke, stroke: config.stroke }}
                                    activeDot={{ ...activePointDotStyle, fill: config.stroke, stroke: config.stroke }}
                                    strokeWidth={2.5}
                                    name={config.lineName}
                                  />
                                </LineChart>
                              )}
                            </ResponsiveContainer>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: "24px", textAlign: "left", border: "1px solid #222", borderRadius: "8px", padding: "14px" }}>
                      <h4 style={{ margin: "0 0 12px 0", fontWeight: 700, fontSize: "24px" }}>Selected Timestamp Summary</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
                        {selectedSnapshotCards.map((card) => (
                          <div
                            key={card.label}
                            style={{
                              border: "1px solid #d0d7de",
                              borderRadius: "8px",
                              padding: "12px",
                              backgroundColor: "#f8fafc"
                            }}
                          >
                            <div style={{ fontSize: "12px", color: "#555", marginBottom: "6px" }}>{card.label}</div>
                            <div style={{ fontSize: "18px", fontWeight: 700 }}>{card.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginTop: "24px", textAlign: "left", border: "1px solid #222", borderRadius: "8px", padding: "14px" }}>
                      <h4 style={{ margin: "0 0 12px 0", fontWeight: 700, fontSize: "24px" }}>Selected Batch Over Time</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
                        {timeSeriesGraphConfigurations.map((config) => renderTimeSeriesChartCard(config))}
                        <div style={{ border: "1px solid #d0d7de", borderRadius: "10px", padding: "14px", backgroundColor: "#fff" }}>
                          <h5 style={{ margin: "0 0 14px 0", fontWeight: 700, fontSize: "24px", textAlign: "center" }}>Vegetation Indices Over Time</h5>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                            {vegetationIndexTimeSeriesConfigurations.map((config) => (
                              renderTimeSeriesChartCard(config, {
                                flex: "1 1 calc(50% - 8px)",
                                minWidth: "320px",
                              })
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: "24px", textAlign: "left", border: "1px solid #222", borderRadius: "8px", padding: "14px" }}>
                      <h4 style={{ margin: "0 0 12px 0", fontWeight: 700, fontSize: "24px" }}>Batch Note</h4>
                      <div style={{ fontSize: "13px", marginBottom: "8px", color: "#333" }}>
                        Selected batch: {selectedBatchLabel || "No batch selected"}
                      </div>
                      <textarea
                        value={batchNoteDrafts[selectedBatchKey] ?? ""}
                        onChange={(e) => handleBatchNoteDraftChange(selectedBatchKey, e.target.value)}
                        placeholder="Add note for this batch"
                        rows={3}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "4px",
                          border: "1px solid #bbb",
                          resize: "vertical",
                          boxSizing: "border-box"
                        }}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
                        <button
                          onClick={handleSaveBatchNote}
                          disabled={!selectedBatchKey || savingBatchKey === selectedBatchKey}
                          style={{
                            padding: "7px 12px",
                            borderRadius: "4px",
                            border: "none",
                            cursor: "pointer",
                            backgroundColor: savingBatchKey === selectedBatchKey ? "#ccc" : uiAccentGreen,
                            color: "white"
                          }}
                        >
                          {savingBatchKey === selectedBatchKey ? "Saving..." : "Save"}
                        </button>
                        <span
                          style={{
                            minWidth: "70px",
                            fontSize: "12px",
                            color: batchNoteSaveStatus[selectedBatchKey]
                              ? (batchNoteSaveStatus[selectedBatchKey] === "Saved" ? "green" : "red")
                              : "#555"
                          }}
                        >
                          {batchNoteSaveStatus[selectedBatchKey] || ""}
                        </span>
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
        <div className="fade-in" style={{ zoom: "67%" }}>
          {authRequired && (
            <div style={{ marginBottom: "24px", padding: "16px 18px", border: "1px solid #f5c2c7", borderRadius: "8px", backgroundColor: "#fff5f5", color: "#842029" }}>
              Please log in to save live sessions to your account or organizations.
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            <div style={{ width: "100%", maxWidth: "880px", textAlign: "left", border: "1px solid #d6dee8", borderRadius: "18px", background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)", boxShadow: "0 18px 40px rgba(15, 23, 42, 0.06)", padding: "22px" }}>
              <div style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: uiAccentGreen, marginBottom: "8px", textAlign: "center" }}>
                Live Session Destination
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px", maxHeight: "250px", overflowY: "auto", paddingRight: "4px" }}>
                {scopeCards.map((scope) => {
                  const isSelected = selectedDestination === scope.key;
                  return (
                    <button
                      key={`live-destination-${scope.key}`}
                      type="button"
                      onClick={() => setSelectedDestination(scope.key)}
                      disabled={authRequired || isRecording}
                      style={{
                        textAlign: "left",
                        padding: "15px 16px",
                        borderRadius: "14px",
                        border: isSelected ? `2px solid ${scope.accent}` : "1px solid #d7e0ea",
                        background: "#ffffff",
                        cursor: authRequired || isRecording ? "default" : "pointer",
                        color: "#102a43",
                        opacity: authRequired || isRecording ? 0.72 : 1,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "15px" }}>{scope.title}</div>
                        <div style={{ marginTop: "4px", fontSize: "12px", color: "#526071" }}>{scope.subtitle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "15px", marginBottom: "30px" }}>
            <button
              onClick={connectToSerial}
              disabled={isConnected || authRequired}
              style={{
                padding: "15px 30px",
                fontSize: "18px",
                backgroundColor: isConnected || authRequired ? "#ccc" : uiAccentGreen,
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: isConnected || authRequired ? "default" : "pointer",
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
                disabled={authRequired}
                style={{
                  padding: "15px 30px",
                  fontSize: "18px",
                  backgroundColor: authRequired ? "#ccc" : uiAccentGreen,
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: authRequired ? "default" : "pointer",
                }}
              >
                Start Recording
              </button>
            )}
          </div>

          {isConnected && isRecording && (
            <p style={{ 
              marginBottom: "10px", 
              fontSize: "14px", 
              color: uiAccentGreen,
              fontWeight: "bold"
            }}>
              {`⏺ Recording to Session #${liveSession?.sessionId || '(starting...)'}`}
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
