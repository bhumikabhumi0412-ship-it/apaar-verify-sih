import { useEffect, useState } from "react";
import api from "../../api/axios";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";

export default function Consent() {
    const { user } = useAuth();
    const [consent, setConsent] = useState(null); // unknown until the student acts
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [qr, setQr] = useState(null);
    const [qrError, setQrError] = useState("");

    const updateConsent = async (value) => {
        setLoading(true);
        setError("");
        setMessage("");
        try {
            const { data } = await api.patch("/verify/consent", { consent: value });
            setConsent(data.consent);
            setMessage(
                data.consent
                    ? `Consent granted for ${data.recordsUpdated} record(s).`
                    : `Consent withdrawn for ${data.recordsUpdated} record(s).`
            );
        } catch (err) {
            setError(err.response?.data?.message || "Could not update consent. Try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user?.apaarId) {
            setQrError("Your APAAR ID was not found in your login details, so the QR cannot be shown.");
            return;
        }
        api
            .get(`/verify/${user.apaarId}/qr`)
            .then(({ data }) => setQr(data))
            .catch((err) =>
                setQrError(err.response?.data?.message || "Could not load your QR code.")
            );
    }, [user]);

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Your consent</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Verifiers can only see your enrolment records while consent is on.
                        You can change it at any time.
                    </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Current status</p>
                    <p
                        className={`text-lg font-semibold mt-1 ${consent === true
                                ? "text-green-700"
                                : consent === false
                                    ? "text-red-700"
                                    : "text-gray-700"
                            }`}
                    >
                        {consent === true
                            ? "Sharing is ON"
                            : consent === false
                                ? "Sharing is OFF"
                                : "Choose an option below"}
                    </p>

                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={() => updateConsent(true)}
                            disabled={loading}
                            className="rounded-md bg-green-700 text-white px-5 py-2 font-medium hover:bg-green-800 disabled:opacity-60"
                        >
                            Give consent
                        </button>
                        <button
                            onClick={() => updateConsent(false)}
                            disabled={loading}
                            className="rounded-md bg-white border border-gray-300 text-gray-800 px-5 py-2 font-medium hover:bg-gray-50 disabled:opacity-60"
                        >
                            Withdraw consent
                        </button>
                    </div>

                    {message && (
                        <p className="mt-4 rounded-md bg-green-50 border border-green-200 text-green-800 px-3 py-2 text-sm">
                            {message}
                        </p>
                    )}
                    {error && (
                        <p className="mt-4 rounded-md bg-red-50 border border-red-200 text-red-800 px-3 py-2 text-sm">
                            {error}
                        </p>
                    )}
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="font-semibold text-gray-900">Your verification QR</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Scanning it opens the verification page for your APAAR ID.
                    </p>
                    {qr && (
                        <div className="mt-4">
                            <img src={qr.image} alt="Verification QR code" className="w-48 h-48" />
                            <p className="text-xs text-gray-500 mt-2 break-all">{qr.url}</p>
                        </div>
                    )}
                    {qrError && <p className="mt-4 text-sm text-amber-700">{qrError}</p>}
                </div>
            </div>
        </div>
    );
}