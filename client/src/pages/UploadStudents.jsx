import { useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import InstitutionTabs from "../components/InstitutionTabs";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import UploadBox from "../components/UploadBox";

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export default function UploadStudents() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleUpload = async (file) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post("/students/upload", form);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const downloadErrors = () => {
    const head = ["line", "apaarId", "type", "severity", "message"];
    const lines = [head.join(",")].concat(
      result.errors.map((e) => head.map((h) => csvCell(e[h])).join(","))
    );
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "upload-errors.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Upload students</h2>
        <InstitutionTabs />
        <UploadBox onUpload={handleUpload} loading={loading} />
        {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 mt-4">{error}</p>}

        {result && (
          <div className="mt-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard label="Rows in file" value={result.total} />
              <StatCard label="Accepted" value={result.accepted} tone="green" />
              <StatCard label="Rejected" value={result.rejected} tone={result.rejected ? "red" : "green"} />
            </div>
            {result.errors?.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-slate-800">Rejected rows</h3>
                  <button onClick={downloadErrors} className="text-sm rounded-md border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5">
                    Download error report
                  </button>
                </div>
                <DataTable
                  columns={[
                    { key: "line", label: "Line" },
                    { key: "apaarId", label: "APAAR ID" },
                    { key: "type", label: "Type" },
                    { key: "severity", label: "Severity" },
                    { key: "message", label: "Reason" },
                  ]}
                  rows={result.errors}
                />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
