import { useEffect, useState } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import InstitutionTabs from "../components/InstitutionTabs";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";

const columns = [
  { key: "apaarId", label: "APAAR ID" },
  { key: "name", label: "Name" },
  { key: "course", label: "Course" },
  { key: "academicYear", label: "Year" },
  { key: "studentId", label: "Student ID" },
  { key: "category", label: "Category" },
  { key: "status", label: "Status" },
];

export default function InstitutionDashboard() {
  const [students, setStudents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [s, a] = await Promise.all([api.get("/students"), api.get("/dashboard/alerts")]);
        setStudents(s.data.students || []);
        setAlerts(Array.isArray(a.data) ? a.data : a.data.alerts || []);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load dashboard data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openAlerts = alerts.filter((a) => !a.resolved);
  const courses = new Set(students.map((s) => s.course)).size;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Institution Dashboard</h2>
        <InstitutionTabs />
        {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">{error}</p>}
        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard label="Verified students" value={students.length} tone="green" />
              <StatCard label="Courses" value={courses} />
              <StatCard label="Open alerts" value={openAlerts.length} tone={openAlerts.length ? "red" : "green"} />
            </div>

            <h3 className="text-lg font-semibold text-slate-800 mb-2">Recent alerts</h3>
            <div className="mb-8">
              <DataTable
                columns={[
                  { key: "type", label: "Type" },
                  { key: "severity", label: "Severity" },
                  { key: "apaarId", label: "APAAR ID" },
                  { key: "message", label: "Message" },
                ]}
                rows={openAlerts.slice(0, 5)}
                empty="No open alerts."
              />
            </div>

            <h3 className="text-lg font-semibold text-slate-800 mb-2">Students</h3>
            <DataTable columns={columns} rows={students} empty="No students yet. Upload a CSV to get started." />
          </>
        )}
      </main>
    </div>
  );
}
