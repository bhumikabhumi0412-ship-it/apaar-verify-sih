import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/axios";
import Navbar from "../../components/Navbar";

export default function VerifyRecord() {
    const [params, setParams] = useSearchParams();
    const [apaarId, setApaarId] = useState(params.get("apaarId") || "");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const search = async (id) => {
        setResult(null);
        setError("");
        if (!/^\d{12}$/.test(id)) {
            setError("APAAR ID must be a 12-digit number");
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.get(`/verify/${id}`);
            setResult(data);
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong. Try again.");
        } finally {
            setLoading(false);
        }
    };

    // Opened from a QR code: /verify?apaarId=123456789012
    useEffect(() => {
        const id = params.get("apaarId");
        if (id) search(id);
        // eslint-disable-next-line
    }, []);

    const onSubmit = (e) => {
        e.preventDefault();
        const id = apaarId.trim();
        setParams(id ? { apaarId: id } : {});
        search(id);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="max-w-3xl mx-auto px-6 py-8">
                <h1 className="text-2xl font-bold text-gray-900">Verify a student record</h1>
                <p className="text-sm text-gray-600 mt-1">
                    Enter a 12-digit APAAR ID to check enrolment.
                </p>

                <form onSubmit={onSubmit} className="mt-6 flex gap-3">
                    <input
                        value={apaarId}
                        onChange={(e) => setApaarId(e.target.value.replace(/\D/g, "").slice(0, 12))}
                        inputMode="numeric"
                        placeholder="12-digit APAAR ID"
                        className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-md bg-blue-800 text-white px-5 py-2 font-medium hover:bg-blue-900 disabled:opacity-60"
                    >
                        {loading ? "Checking..." : "Verify"}
                    </button>
                </form>

                {error && (
                    <div className="mt-6 rounded-md border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">
                        {error}
                    </div>
                )}

                {result && (
                    <div className="mt-6 space-y-4">
                        <div
                            className={`rounded-lg px-4 py-3 font-semibold ${result.verified
                                    ? "bg-green-50 text-green-800 border border-green-200"
                                    : "bg-amber-50 text-amber-800 border border-amber-200"
                                }`}
                        >
                            {result.verified ? "Verified: active and authentic record" : "Not verified"}
                            <span className="block text-xs font-normal mt-0.5">
                                APAAR ID {result.apaarId}
                            </span>
                        </div>

                        {result.records.map((r, i) => (
                            <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-gray-900">{r.institution}</p>
                                        <p className="text-sm text-gray-600">{r.course}</p>
                                        {r.name && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                {r.name} ({r.studentId})
                                            </p>
                                        )}
                                    </div>
                                    <span
                                        className={`text-xs rounded-full px-2.5 py-1 font-medium ${r.status === "active"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-700"
                                            }`}
                                    >
                                        {r.status}
                                    </span>
                                </div>
                                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <dt className="text-gray-500">Academic year</dt>
                                        <dd className="font-medium">{r.academicYear}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-gray-500">Signature check</dt>
                                        <dd className={`font-medium ${r.authentic ? "text-green-700" : "text-red-700"}`}>
                                            {r.authentic ? "Authentic" : "Tampered or invalid"}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}