import { useEffect, useState } from "react";
import api from "../../api/axios";
import StatCard from "../../components/StatCard";
import DataTable from "../../components/DataTable";
import Navbar from "../../components/Navbar";

const fmtDateTime = (d) =>
    d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-";

const inputCls =
    "border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200";

function useDebounced(value, ms = 400) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return v;
}

function Pager({ page, pages, total, onChange }) {
    return (
        <div className="flex items-center justify-between text-sm text-slate-600 mt-3">
            <span>{total} records</span>
            <div className="flex items-center gap-2">
                <button
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:opacity-40"
                    disabled={page <= 1}
                    onClick={() => onChange(page - 1)}
                >
                    Previous
                </button>
                <span>
                    Page {page} of {pages}
                </span>
                <button
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:opacity-40"
                    disabled={page >= pages}
                    onClick={() => onChange(page + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
}

const ErrorBox = ({ msg }) =>
    msg ? <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-3 text-sm mb-3">{msg}</div> : null;

/* ---------------- Overview ---------------- */
function Overview() {
    const [data, setData] = useState(null);
    const [national, setNational] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        Promise.all([api.get("/aicte/overview"), api.get("/dashboard/aicte")])
            .then(([o, n]) => {
                setData(o.data);
                setNational(n.data);
            })
            .catch((e) => setError(e.response?.data?.message || "Could not load overview"));
    }, []);

    if (error) return <ErrorBox msg={error} />;
    if (!data) return <p className="text-slate-500">Loading...</p>;

    const max = Math.max(...data.verificationsByDay.map((d) => d.count), 1);
    const consentPct = data.students ? Math.round((data.consented / data.students) * 100) : 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Institutions" value={data.institutions} />
                <StatCard label="Students" value={data.students} />
                <StatCard label="Consent given" value={`${consentPct}%`} tone="green" />
                <StatCard label="Verifications" value={data.verifications} tone="amber" />
            </div>

            <div className="bg-white rounded-xl shadow p-5">
                <p className="font-medium text-slate-700 mb-4">Verifications, last 14 days</p>
                <div className="flex items-end gap-2 h-40">
                    {data.verificationsByDay.map((d) => (
                        <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full">
                            <span className="text-xs text-slate-500 mb-1">{d.count}</span>
                            <div
                                className="w-full bg-blue-500 rounded-t"
                                style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count ? 4 : 1 }}
                                title={`${d.day}: ${d.count}`}
                            />
                            <span className="text-[10px] text-slate-400 mt-1">{d.day.slice(5)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {national?.stateWise?.length > 0 && (
                <div>
                    <p className="font-medium text-slate-700 mb-2">State-wise enrolment</p>
                    <DataTable
                        columns={[
                            { key: "state", label: "State" },
                            { key: "institutions", label: "Institutions" },
                            { key: "enrolled", label: "Enrolled students" },
                        ]}
                        rows={national.stateWise}
                    />
                </div>
            )}
        </div>
    );
}

/* ---------------- Audit log ---------------- */
const ACTIONS = ["VERIFY_RECORD", "UPLOAD_STUDENTS", "RESOLVE_ALERT", "EXPORT_STUDENTS"];

function AuditLogTab() {
    const [f, setF] = useState({ action: "", from: "", to: "", q: "" });
    const [page, setPage] = useState(1);
    const [res, setRes] = useState({ logs: [], total: 0, pages: 1 });
    const [error, setError] = useState("");
    const debouncedQ = useDebounced(f.q);

    useEffect(() => {
        const params = { page, action: f.action, from: f.from, to: f.to, q: debouncedQ };
        api
            .get("/aicte/audit", { params })
            .then((r) => {
                setRes(r.data);
                setError("");
            })
            .catch((e) => setError(e.response?.data?.message || "Could not load audit log"));
    }, [page, f.action, f.from, f.to, debouncedQ]);

    const set = (k, v) => {
        setF((p) => ({ ...p, [k]: v }));
        setPage(1);
    };

    return (
        <div>
            <div className="flex flex-wrap gap-3 mb-4">
                <select className={inputCls} value={f.action} onChange={(e) => set("action", e.target.value)}>
                    <option value="">All actions</option>
                    {ACTIONS.map((a) => (
                        <option key={a} value={a}>
                            {a}
                        </option>
                    ))}
                </select>
                <input type="date" className={inputCls} value={f.from} onChange={(e) => set("from", e.target.value)} />
                <input type="date" className={inputCls} value={f.to} onChange={(e) => set("to", e.target.value)} />
                <input
                    className={`${inputCls} flex-1 min-w-[200px]`}
                    placeholder="Search details (e.g. an APAAR ID)"
                    value={f.q}
                    onChange={(e) => set("q", e.target.value)}
                />
            </div>
            <ErrorBox msg={error} />
            <DataTable
                empty="No audit entries match these filters."
                columns={[
                    { key: "createdAt", label: "When", render: (r) => fmtDateTime(r.createdAt) },
                    {
                        key: "action",
                        label: "Action",
                        render: (r) => (
                            <span className="text-xs rounded-full px-2.5 py-1 font-medium bg-slate-100 text-slate-700">
                                {r.action}
                            </span>
                        ),
                    },
                    { key: "user", label: "User", render: (r) => r.user?.name || r.user?.email || "-" },
                    { key: "role", label: "Role" },
                    { key: "details", label: "Details" },
                    { key: "ip", label: "IP" },
                ]}
                rows={res.logs}
            />
            <Pager page={page} pages={res.pages} total={res.total} onChange={setPage} />
        </div>
    );
}

/* ---------------- All students ---------------- */
function StudentsTab() {
    const [institutions, setInstitutions] = useState([]);
    const [f, setF] = useState({ institution: "", status: "", consent: "", q: "" });
    const [page, setPage] = useState(1);
    const [res, setRes] = useState({ students: [], total: 0, pages: 1 });
    const [error, setError] = useState("");
    const debouncedQ = useDebounced(f.q);

    useEffect(() => {
        api.get("/aicte/institutions").then((r) => setInstitutions(r.data)).catch(() => { });
    }, []);

    useEffect(() => {
        const params = { page, institution: f.institution, status: f.status, consent: f.consent, q: debouncedQ };
        api
            .get("/aicte/students", { params })
            .then((r) => {
                setRes(r.data);
                setError("");
            })
            .catch((e) => setError(e.response?.data?.message || "Could not load students"));
    }, [page, f.institution, f.status, f.consent, debouncedQ]);

    const set = (k, v) => {
        setF((p) => ({ ...p, [k]: v }));
        setPage(1);
    };

    const exportCsv = async () => {
        try {
            const r = await api.get("/aicte/students/export", {
                params: { institution: f.institution, status: f.status, consent: f.consent, q: debouncedQ },
                responseType: "blob",
            });
            const url = URL.createObjectURL(r.data);
            const a = document.createElement("a");
            a.href = url;
            a.download = "students.csv";
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            setError("Export failed");
        }
    };

    return (
        <div>
            <div className="flex flex-wrap gap-3 mb-4">
                <select className={inputCls} value={f.institution} onChange={(e) => set("institution", e.target.value)}>
                    <option value="">All institutions</option>
                    {institutions.map((i) => (
                        <option key={i._id} value={i._id}>
                            {i.name}
                        </option>
                    ))}
                </select>
                <select className={inputCls} value={f.status} onChange={(e) => set("status", e.target.value)}>
                    <option value="">Any status</option>
                    <option value="active">Active</option>
                    <option value="dropped">Dropped</option>
                    <option value="graduated">Graduated</option>
                </select>
                <select className={inputCls} value={f.consent} onChange={(e) => set("consent", e.target.value)}>
                    <option value="">Any consent</option>
                    <option value="true">Consent given</option>
                    <option value="false">No consent</option>
                </select>
                <input
                    className={`${inputCls} flex-1 min-w-[200px]`}
                    placeholder="Search name, APAAR ID, roll no, course"
                    value={f.q}
                    onChange={(e) => set("q", e.target.value)}
                />
                <button onClick={exportCsv} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium">
                    Export CSV
                </button>
            </div>
            <ErrorBox msg={error} />
            <DataTable
                empty="No students match these filters."
                columns={[
                    { key: "apaarId", label: "APAAR ID" },
                    { key: "name", label: "Name" },
                    { key: "institution", label: "Institution", render: (r) => r.institution?.name || "-" },
                    { key: "course", label: "Course" },
                    { key: "academicYear", label: "Year" },
                    {
                        key: "status",
                        label: "Status",
                        render: (r) => (
                            <span
                                className={`text-xs rounded-full px-2.5 py-1 font-medium ${r.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                                    }`}
                            >
                                {r.status}
                            </span>
                        ),
                    },
                    { key: "consentGiven", label: "Consent", render: (r) => (r.consentGiven ? "Yes" : "No") },
                ]}
                rows={res.students}
            />
            <Pager page={page} pages={res.pages} total={res.total} onChange={setPage} />
        </div>
    );
}

/* ---------------- Page ---------------- */
const TABS = [
    { id: "overview", label: "Overview" },
    { id: "audit", label: "Audit log" },
    { id: "students", label: "All students" },
];

export default function AicteDashboard() {
    const [tab, setTab] = useState("overview");

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 py-6 space-y-5">
                <h1 className="text-2xl font-bold text-slate-800">AICTE Dashboard</h1>
                <div className="flex gap-1 border-b border-slate-200">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${tab === t.id
                                    ? "border-blue-600 text-blue-700"
                                    : "border-transparent text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                {tab === "overview" && <Overview />}
                {tab === "audit" && <AuditLogTab />}
                {tab === "students" && <StudentsTab />}
            </main>
        </div>
    );
}