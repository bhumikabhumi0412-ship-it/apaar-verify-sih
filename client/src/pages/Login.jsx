import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth, homeFor } from "../context/AuthContext";

const DEMO = [
  { label: "AICTE Admin", email: "aicte@apaar.test", password: "Admin@123" },
  { label: "Institution", email: "inst1@apaar.test", password: "Inst@123" },
  { label: "Verifier", email: "verifier@apaar.test", password: "Verify@123" },
  { label: "Student", email: "student@apaar.test", password: "Student@123" },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await login(email, password);
      navigate(homeFor(u.role));
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-800">APAAR-Verify</h1>
          <p className="text-slate-600 mt-1">
            Student Data Management and Verification Platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-medium py-2"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-5 bg-white rounded-xl shadow p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
            Demo accounts (click to fill)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => {
                  setEmail(d.email);
                  setPassword(d.password);
                }}
                className="text-sm rounded-md border border-slate-300 hover:bg-slate-50 py-1.5"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}