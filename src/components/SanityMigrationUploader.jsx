import React, { useState } from "react";

const PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID;
const DATASET = import.meta.env.VITE_SANITY_DATASET || "production";
const TOKEN = import.meta.env.VITE_SANITY_TOKEN;

export default function SanityMigrationUploader() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFiles = (e) => {
    setFiles(Array.from(e.target.files || []));
    setResults([]);
  };

  const uploadFile = async (file) => {
    const filename = encodeURIComponent(file.name);

    const url =
      `https://${PROJECT_ID}.api.sanity.io/v2021-06-07/assets/images/${DATASET}` +
      `?filename=${filename}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": file.type || "image/jpeg",
      },
      body: file,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Upload failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      filename: file.name,
      url: data.document?.url || data.url,
      assetId: data.document?._id || data._id,
    };
  };

  const startUpload = async () => {
    if (!files.length) {
      alert("Select the old property photos first.");
      return;
    }

    if (!TOKEN) {
      alert("VITE_SANITY_TOKEN is missing from .env");
      return;
    }

    setUploading(true);
    setResults([]);

    const uploaded = [];

    for (const file of files) {
      try {
        const result = await uploadFile(file);

        uploaded.push({
          ...result,
          status: "SUCCESS",
        });

        setResults([...uploaded]);
      } catch (error) {
        uploaded.push({
          filename: file.name,
          status: "FAILED",
          error: error.message,
        });

        setResults([...uploaded]);
      }
    }

    setUploading(false);
  };

  const successCount = results.filter(
    (item) => item.status === "SUCCESS"
  ).length;

  const failedCount = results.filter(
    (item) => item.status === "FAILED"
  ).length;

  const downloadMapping = () => {
    const successful = results.filter(
      (item) => item.status === "SUCCESS"
    );

    const csv = [
      "filename,sanity_url,asset_id",
      ...successful.map(
        (item) =>
          `"${item.filename.replace(/"/g, '""')}","${item.url}","${item.assetId}"`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "rheaspark-sanity-image-mapping.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Rheaspark Image Migration</h1>

      <p>
        Upload the old Supabase property photos directly into Sanity.
      </p>

      <div
        style={{
          padding: "25px",
          border: "2px dashed #999",
          borderRadius: "10px",
          marginBottom: "20px",
        }}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
        />
      </div>

      {files.length > 0 && (
        <p>
          <strong>{files.length}</strong> images selected.
        </p>
      )}

      <button
        onClick={startUpload}
        disabled={uploading || !files.length}
        style={{
          padding: "12px 20px",
          border: "none",
          borderRadius: "6px",
          cursor: uploading ? "not-allowed" : "pointer",
          fontWeight: "bold",
        }}
      >
        {uploading ? "Uploading..." : "UPLOAD ALL TO SANITY"}
      </button>

      {results.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <h2>
            Progress: {results.length} / {files.length}
          </h2>

          <p>
            ✅ Successful: {successCount}
          </p>

          <p>
            ❌ Failed: {failedCount}
          </p>

          <div
            style={{
              maxHeight: "400px",
              overflowY: "auto",
              border: "1px solid #ddd",
              padding: "10px",
            }}
          >
            {results.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: "8px",
                  borderBottom: "1px solid #eee",
                }}
              >
                {item.status === "SUCCESS" ? "✅" : "❌"}{" "}
                {item.filename}

                {item.status === "FAILED" && (
                  <div style={{ fontSize: "12px" }}>
                    {item.error}
                  </div>
                )}
              </div>
            ))}
          </div>

          {!uploading && successCount > 0 && (
            <button
              onClick={downloadMapping}
              style={{
                marginTop: "20px",
                padding: "12px 20px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              DOWNLOAD IMAGE MAPPING CSV
            </button>
          )}
        </div>
      )}
    </div>
  );
}