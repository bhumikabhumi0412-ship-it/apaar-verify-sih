import { useRef, useState } from "react";

export default function UploadBox({ onUpload, loading }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);

  const pick = (f) => {
    if (f && f.name.toLowerCase().endsWith(".csv")) setFile(f);
    else if (f) alert("Please choose a .csv file");
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition ${
          drag ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:bg-slate-50"
        }`}
      >
        <p className="text-slate-700 font-medium">
          {file ? file.name : "Drag and drop a CSV file here, or click to browse"}
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Columns: apaarId, name, dob, gender, course, academicYear, studentId, category, isSupernumerary, isNRI, ociStatus, isForeignNational
        </p>
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => pick(e.target.files[0])} />
      </div>
      <button
        disabled={!file || loading}
        onClick={() => onUpload(file)}
        className="mt-4 rounded-md bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-medium px-5 py-2"
      >
        {loading ? "Uploading and validating..." : "Upload and validate"}
      </button>
    </div>
  );
}
