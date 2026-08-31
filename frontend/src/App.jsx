import { useMemo, useRef, useState } from "react";

const API_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const Icon = ({ name, size = 20 }) => {
  const paths = {
    activity: <path d="M3 12h4l2.4-7 4.2 14 2.4-7H21" />,
    upload: (
      <>
        <path d="M12 16V3M7 8l5-5 5 5M5 21h14" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
      </>
    ),
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
    check: <path d="m5 12 4 4L19 6" />,
    alert: (
      <>
        <path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    x: <path d="m18 6-12 12M6 6l12 12" />,
    eye: (
      <>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3 1.912 4.912L19 9.824l-4.088 1.912L13 16.648 11.088 11.736 7 9.824l4.088-1.912L12 3Z" />
        <path d="M5 3v4M3 5h4M19 17v4M17 19h4" />
      </>
    ),
    table: (
      <>
        <path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18" />
      </>
    ),
    filter: <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
};

function GradCamCompareSlider({ originalSrc, gradcamSrc }) {
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <div className="gradcam-slider-wrapper">
      <div className="gradcam-slider-container">
        {/* Base: Original Microscope Smear */}
        {originalSrc ? (
          <img src={originalSrc} alt="Original Smear" className="slider-img" />
        ) : (
          <div className="slider-img placeholder">
            Original smear unavailable
          </div>
        )}

        {/* Top: AI Grad-CAM Heatmap clipped by slider */}
        <div
          className="slider-clipped-layer"
          style={{
            clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
          }}
        >
          <img src={gradcamSrc} alt="AI Heatmap" className="slider-img" />
        </div>

        {/* Divider bar handle */}
        <div className="slider-divider" style={{ left: `${sliderPos}%` }}>
          <div className="slider-handle">
            <span>⇄</span>
          </div>
        </div>

        {/* Range Controller */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPos}
          onChange={(e) => setSliderPos(Number(e.target.value))}
          className="slider-range-input"
          aria-label="Drag to compare original smear with Grad-CAM heatmap"
        />
      </div>

      <div className="slider-labels">
        <span className="label-left">◀ AI Heatmap ({sliderPos}%)</span>
        <span className="label-right">
          Original Smear ({100 - sliderPos}%) ▶
        </span>
      </div>
    </div>
  );
}

function ResultCard({ result, index }) {
  const [showGradcam, setShowGradcam] = useState(false);
  const positive = result.result?.toLowerCase().includes("parasit");
  const rawConfidence = Number(result.confidence) || 0;
  const confidence = Math.round(
    rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence,
  );
  const isReview = result.low_confidence;

  return (
    <article
      className={`result-card ${positive ? "positive" : isReview ? "review" : "negative"}`}
      style={{ "--i": index }}
    >
      <div className="result-top">
        <span className="sample">
          Sample #{String(index + 1).padStart(2, "0")}
        </span>
        <span className="status">
          <Icon
            name={positive ? "alert" : isReview ? "alert" : "check"}
            size={14}
          />
          {positive
            ? "Parasites detected"
            : isReview
              ? "Inconclusive review"
              : "No parasites detected"}
        </span>
      </div>

      <div className="result-body">
        {result.preview && (
          <div className="thumb-wrapper">
            <img
              className="thumb"
              src={result.preview}
              alt="Blood smear microscope capture"
            />
          </div>
        )}
        <div className="result-copy">
          <strong title={result.filename || result.result}>
            {result.filename || result.result}
          </strong>
          <span>{confidence}% diagnostic confidence</span>
          {isReview && <em>Manual review recommended</em>}
        </div>
        <div className="confidence">
          <div
            className="ring"
            style={{ "--progress": `${confidence * 3.6}deg` }}
          >
            <b>{confidence}%</b>
          </div>
        </div>
      </div>

      {result.gradcam_image && (
        <div className="gradcam-container">
          <button
            type="button"
            className={`gradcam-toggle ${showGradcam ? "active" : ""}`}
            onClick={() => setShowGradcam(!showGradcam)}
          >
            <Icon name="eye" size={14} />
            {showGradcam
              ? "Hide Interactive Heatmap"
              : "Inspect AI Attention Heatmap"}
          </button>

          {showGradcam && (
            <div className="gradcam-viewer">
              <GradCamCompareSlider
                originalSrc={result.preview}
                gradcamSrc={`data:image/png;base64,${result.gradcam_image}`}
              />
              <span className="gradcam-hint">
                Slide left/right to compare the original smear against the model
                focus map.
              </span>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function App() {
  const [mode, setMode] = useState("single");
  const [files, setFiles] = useState([]);
  const [patient, setPatient] = useState({
    code: "",
    feverDays: "",
    priority: false,
    vulnerable: false,
  });
  const [results, setResults] = useState([]);
  const [batchId, setBatchId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [filter, setFilter] = useState("all"); // 'all' | 'parasitized' | 'review' | 'clean'
  const inputRef = useRef(null);

  const maximum = mode === "single" ? 1 : 50;
  const inputFiles = useMemo(
    () => files.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    [files],
  );

  function selectFiles(next) {
    const images = Array.from(next).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (!images.length)
      return setError(
        "Please upload a valid microscope image (PNG, JPG, WEBP).",
      );
    setFiles((current) => {
      const combined = mode === "batch" ? [...current, ...images] : images;
      return Array.from(
        new Map(
          combined.map((file) => [
            `${file.name}-${file.size}-${file.lastModified}`,
            file,
          ]),
        ).values(),
      ).slice(0, maximum);
    });
    setResults([]);
    setBatchId(null);
    setError("");
    setFilter("all");
  }

  function switchMode(next) {
    setMode(next);
    setFiles([]);
    setResults([]);
    setBatchId(null);
    setError("");
    setFilter("all");
  }

  async function screen() {
    if (!files.length)
      return setError("Add at least one blood smear image before screening.");
    setLoading(true);
    setError("");
    setResults([]);
    setBatchId(null);
    setFilter("all");

    const form = new FormData();
    files.forEach((file) =>
      form.append(mode === "single" ? "file" : "files", file),
    );

    try {
      // Include gradcam for batch as well so the compare slider works for all inspected samples
      const endpoint =
        mode === "single"
          ? "/predict/single"
          : "/predict/batch?include_gradcam=true";
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.detail ||
            "The screening service could not process this request.",
        );

      const returned = mode === "single" ? [data] : data.results;
      setResults(
        returned.map((item, index) => ({
          ...item,
          filename: files[index]?.name,
          preview: inputFiles[index]?.preview,
        })),
      );
      setBatchId(data.batch_id || null);
    } catch (err) {
      setError(
        err.message ||
          "Unable to reach the API. Check that FastAPI is running.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function downloadReport() {
    if (!batchId) return;
    const response = await fetch(`${API_URL}/report/${batchId}`);
    if (!response.ok)
      return setError(
        "The report is no longer available. Run the batch again.",
      );
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = `ayewo-report-${batchId}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    if (!results.length) return;
    const headers = [
      "Sample Index",
      "Filename",
      "Diagnosis",
      "Confidence Percentage",
      "Needs Manual Review",
      "Patient ID",
      "Fever Duration (Days)",
      "Clinical Concern Flag",
      "Vulnerable Cohort Flag",
      "Screening Date",
    ];

    const rows = results.map((r, i) => {
      const isPos = r.result?.toLowerCase().includes("parasit");
      const rawConf = Number(r.confidence) || 0;
      const confVal = Math.round(rawConf <= 1 ? rawConf * 100 : rawConf);
      return [
        i + 1,
        `"${(r.filename || "Smear_" + (i + 1)).replace(/"/g, '""')}"`,
        `"${isPos ? "Parasitized" : "Uninfected"}"`,
        `"${confVal}%"`,
        `"${r.low_confidence ? "Yes" : "No"}"`,
        `"${(patient.code || "N/A").replace(/"/g, '""')}"`,
        `"${patient.feverDays || "0"}"`,
        `"${patient.priority ? "Yes" : "No"}"`,
        `"${patient.vulnerable ? "Yes" : "No"}"`,
        `"${new Date().toLocaleString()}"`,
      ].join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `ayewo-screening-data-${batchId || "batch"}-${Date.now()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Filter calculation
  const positiveResults = results.filter((row) =>
    row.result?.toLowerCase().includes("parasit"),
  );
  const reviewResults = results.filter((row) => row.low_confidence);
  const cleanResults = results.filter(
    (row) =>
      !row.result?.toLowerCase().includes("parasit") && !row.low_confidence,
  );

  const displayedResults = useMemo(() => {
    if (filter === "parasitized") return positiveResults;
    if (filter === "review") return reviewResults;
    if (filter === "clean") return cleanResults;
    return results;
  }, [filter, results, positiveResults, reviewResults, cleanResults]);

  const positiveCount = positiveResults.length;
  const needsReview = reviewResults.length > 0;
  const safetyFlag = patient.priority || patient.vulnerable;
  const decisionTitle = safetyFlag
    ? "Urgent clinical assessment recommended"
    : positiveCount
      ? "Parasite signal detected"
      : needsReview
        ? "Confirm screening result"
        : "No parasite signal detected";

  const decisionText = safetyFlag
    ? "A higher-risk patient flag was recorded. Do not delay local clinical pathways while this AI-assisted screen is reviewed."
    : positiveCount
      ? "Record the result and confirm through standard laboratory protocol before treatment decisions. Follow national malaria management guidelines."
      : needsReview
        ? "The model marked one or more images as uncertain (<75% threshold). Check smear focus and perform standard microscopic validation."
        : "No parasite signal was detected in these smear images. If symptoms persist, re-evaluate clinical signs and assess differential causes.";

  return (
    <div className="app-shell">
      <div className="ambient-background" />

      <header>
        <a className="brand" href="#top">
          <span className="brand-mark">
            <Icon name="activity" />
          </span>
          <span>
            ayewo
            <small>AI DIAGNOSTICS</small>
          </span>
        </a>
        <div className="secure">
          <span className="pulse-dot" />
          <Icon name="shield" size={15} /> Secure clinical screening
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="eyebrow">
            <Icon name="sparkles" size={13} />
            MALARIA SCREENING, REIMAGINED
          </div>
          <h1>
            Clarity for every
            <br />
            <i>blood smear.</i>
          </h1>
          <p>
            Fast, AI-assisted malaria screening designed for the diagnostic
            realities of Nigerian laboratories and clinics.
          </p>

          <div className="hero-metrics">
            <div className="metric-box">
              <b>&lt; 1 min</b>
              <span>Screening time</span>
            </div>
            <div className="metric-box">
              <b>Up to 50</b>
              <span>Smears per batch</span>
            </div>
            <div className="metric-box">
              <b>75%+</b>
              <span>Review threshold</span>
            </div>
          </div>
        </section>

        <section className="workspace" aria-label="Screening workspace">
          <div className="tabs" role="tablist">
            <button
              className={mode === "single" ? "active" : ""}
              onClick={() => switchMode("single")}
              role="tab"
            >
              <Icon name="file" size={16} /> Single sample
            </button>
            <button
              className={mode === "batch" ? "active" : ""}
              onClick={() => switchMode("batch")}
              role="tab"
            >
              <Icon name="activity" size={16} /> Batch screening
            </button>
          </div>

          <div className="screen-card">
            <div className="card-heading">
              <div>
                <span className="step">STEP 01</span>
                <h2>
                  {mode === "single"
                    ? "Screen a blood smear slide"
                    : "Screen a batch of smear slides"}
                </h2>
                <p>
                  {mode === "single"
                    ? "Upload one microscope image for instant classification & interactive Grad-CAM heatmap."
                    : "Upload up to 50 images for automated high-throughput laboratory screening."}
                </p>
              </div>
              <span className="limit">
                {maximum === 1 ? "1 SLIDE" : "MAX 50 SLIDES"}
              </span>
            </div>

            <section
              className="patient-context"
              aria-labelledby="patient-context-title"
            >
              <div className="context-header">
                <span className="context-label">OPTIONAL CLINICAL CONTEXT</span>
                <h3 id="patient-context-title">
                  Triage metadata for reporting
                </h3>
              </div>

              <div className="patient-fields">
                <label>
                  Patient / Lab Reference
                  <input
                    value={patient.code}
                    onChange={(event) =>
                      setPatient((value) => ({
                        ...value,
                        code: event.target.value,
                      }))
                    }
                    placeholder="e.g. LAB-2026-084"
                  />
                </label>
                <label>
                  Duration of Fever (Days)
                  <input
                    type="number"
                    min="0"
                    value={patient.feverDays}
                    onChange={(event) =>
                      setPatient((value) => ({
                        ...value,
                        feverDays: event.target.value,
                      }))
                    }
                    placeholder="e.g. 3"
                  />
                </label>
              </div>

              <div className="clinical-flags">
                <label className="checkbox-pill">
                  <input
                    type="checkbox"
                    checked={patient.priority}
                    onChange={(event) =>
                      setPatient((value) => ({
                        ...value,
                        priority: event.target.checked,
                      }))
                    }
                  />
                  <span>Severe symptoms / clinician concern</span>
                </label>
                <label className="checkbox-pill">
                  <input
                    type="checkbox"
                    checked={patient.vulnerable}
                    onChange={(event) =>
                      setPatient((value) => ({
                        ...value,
                        vulnerable: event.target.checked,
                      }))
                    }
                  />
                  <span>
                    Higher-risk cohort (Child under 5, Pregnancy,
                    Immunocompromised)
                  </span>
                </label>
              </div>
              <p className="context-note">
                Client-side confidentiality guarantee: Context metadata stays
                strictly within this browser session.
              </p>
            </section>

            {/* Dropzone with active scanning preview if loading */}
            <div
              className={`dropzone ${dragging ? "dragging" : ""} ${loading ? "scanning-active" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                selectFiles(event.dataTransfer.files);
              }}
              onClick={() => !loading && inputRef.current.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple={mode === "batch"}
                onChange={(event) => selectFiles(event.target.files)}
              />

              {loading ? (
                <div className="scanner-overlay">
                  <div className="laser-beam" />
                  <div className="scanner-reticle" />
                  <span className="scanner-text">
                    <Icon name="activity" size={18} />
                    NEURAL NETWORK INFERENCE IN PROGRESS...
                  </span>
                </div>
              ) : (
                <>
                  <span className="upload-icon">
                    <Icon name="upload" size={22} />
                  </span>
                  <strong>
                    Drop digital blood-smear microscopy images here
                  </strong>
                  <p>
                    or click to browse from your microscope camera / storage
                  </p>
                  <small>PNG, JPG, WEBP • Max 10 MB per image</small>
                </>
              )}
            </div>

            {files.length > 0 && !loading && (
              <div className="file-strip">
                {files.map((file, idx) => (
                  <span
                    key={`${file.name}-${file.lastModified}`}
                    className="file-chip"
                  >
                    {inputFiles[idx]?.preview ? (
                      <img
                        src={inputFiles[idx].preview}
                        alt=""
                        className="mini-thumb"
                      />
                    ) : (
                      <Icon name="file" size={14} />
                    )}
                    <span className="file-name">{file.name}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFiles((items) =>
                          items.filter((item) => item !== file),
                        );
                      }}
                    >
                      <Icon name="x" size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {error && (
              <div className="error" role="alert">
                <Icon name="alert" size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              className="screen-button"
              onClick={screen}
              disabled={loading || !files.length}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Analyzing {files.length} smear{files.length > 1 ? "s" : ""}{" "}
                  with MobileNetV2...
                </>
              ) : (
                <>
                  <Icon name="activity" size={17} />
                  Start AI Diagnostic Screening
                </>
              )}
            </button>
          </div>
        </section>

        {results.length > 0 && (
          <section className="outcome">
            <div className="outcome-heading">
              <div>
                <span className="step">STEP 02</span>
                <h2>Diagnostic Results & Attention Maps</h2>
                <p>
                  {positiveCount
                    ? `${positiveCount} of ${results.length} sample${results.length > 1 ? "s" : ""} flagged with parasite detections.`
                    : "All screened samples show negative parasite detections."}
                </p>
              </div>

              {/* Action Buttons: PDF and CSV */}
              <div className="export-actions">
                <button
                  className="csv-button"
                  onClick={exportCsv}
                  title="Download spreadsheet log"
                >
                  <Icon name="table" size={16} />
                  Export CSV
                </button>
                {batchId && (
                  <button className="report-button" onClick={downloadReport}>
                    <Icon name="download" size={16} />
                    PDF Report
                  </button>
                )}
              </div>
            </div>

            <aside
              className={`decision-brief ${safetyFlag || positiveCount ? "attention" : needsReview ? "review" : "clear"}`}
            >
              <div className="decision-icon">
                <Icon
                  name={
                    safetyFlag || positiveCount
                      ? "alert"
                      : needsReview
                        ? "shield"
                        : "check"
                  }
                  size={20}
                />
              </div>
              <div className="decision-content">
                <span className="context-label">
                  CLINICAL TRIAGE RECOMMENDATION
                </span>
                <h3>
                  {decisionTitle}
                  {patient.code && <small> • ID: {patient.code}</small>}
                </h3>
                <p>{decisionText}</p>
                <div className="decision-tags">
                  {patient.feverDays && (
                    <span>
                      Fever: {patient.feverDays} day
                      {patient.feverDays === "1" ? "" : "s"}
                    </span>
                  )}
                  {patient.priority && (
                    <span className="flag-urgent">
                      Clinical Concern Flagged
                    </span>
                  )}
                  {patient.vulnerable && (
                    <span className="flag-risk">Vulnerable Group</span>
                  )}
                  {needsReview && (
                    <span className="flag-amber">
                      Manual Microscopic Review Needed
                    </span>
                  )}
                </div>
              </div>
            </aside>

            {/* Results Filter Toolbar for Batch Mode */}
            {results.length > 1 && (
              <div className="filter-toolbar">
                <span className="filter-label">
                  <Icon name="filter" size={14} />
                  Filter Smears:
                </span>
                <div className="filter-pills">
                  <button
                    type="button"
                    className={`filter-pill ${filter === "all" ? "active" : ""}`}
                    onClick={() => setFilter("all")}
                  >
                    All Samples <b>{results.length}</b>
                  </button>
                  <button
                    type="button"
                    className={`filter-pill pill-pos ${filter === "parasitized" ? "active" : ""}`}
                    onClick={() => setFilter("parasitized")}
                  >
                    Parasitized <b>{positiveResults.length}</b>
                  </button>
                  <button
                    type="button"
                    className={`filter-pill pill-rev ${filter === "review" ? "active" : ""}`}
                    onClick={() => setFilter("review")}
                  >
                    Needs Review <b>{reviewResults.length}</b>
                  </button>
                  <button
                    type="button"
                    className={`filter-pill pill-neg ${filter === "clean" ? "active" : ""}`}
                    onClick={() => setFilter("clean")}
                  >
                    Uninfected <b>{cleanResults.length}</b>
                  </button>
                </div>
              </div>
            )}

            {/* Results Grid */}
            <div className="results-grid">
              {displayedResults.map((result, index) => (
                <ResultCard
                  key={`${result.filename}-${index}`}
                  result={result}
                  index={index}
                />
              ))}
            </div>

            {displayedResults.length === 0 && (
              <div className="empty-filter-state">
                <p>No samples match the selected filter.</p>
                <button type="button" onClick={() => setFilter("all")}>
                  View all {results.length} samples
                </button>
              </div>
            )}

            <div className="validation-note">
              <Icon name="shield" size={15} />
              <span>
                Ayewo is an AI-driven clinical decision-support tool. It assists
                smear triage and does not replace certified laboratory
                microscopy or clinician diagnosis.
              </span>
            </div>
          </section>
        )}
      </main>

      <footer>
        <span>Ayewo AI Diagnostics • Laboratory Smear Assistant</span>
        <span>
          Decision-support platform for healthcare facilities. Adhere to
          national malaria clinical guidelines.
        </span>
      </footer>
    </div>
  );
}
