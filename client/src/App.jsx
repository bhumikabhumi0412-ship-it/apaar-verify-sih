import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth, homeFor } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import InstitutionDashboard from "./pages/InstitutionDashboard";
import UploadStudents from "./pages/UploadStudents";
import VerifyRecord from "./pages/verifier/VerifyRecord";
import StudentConsent from "./pages/student/Consent";
import AicteDashboard from "./pages/aicte/Dashboard";

function Placeholder({ title }) {
    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 py-10">
                <h2 className="text-2xl font-semibold text-slate-800">{title}</h2>
                <p className="text-slate-500 mt-2">Page coming next.</p>
            </main>
        </div>
    );
}

function RoleRedirect() {
    const { user } = useAuth();
    return <Navigate to={user ? homeFor(user.role) : "/login"} replace />;
}

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<RoleRedirect />} />
                <Route
                    path="/institution"
                    element={
                        <ProtectedRoute roles={["institution_admin"]}>
                            <InstitutionDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/institution/upload"
                    element={
                        <ProtectedRoute roles={["institution_admin"]}>
                            <UploadStudents />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/aicte"
                    element={
                        <ProtectedRoute roles={["aicte_admin"]}>
                            <AicteDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/verify"
                    element={
                        <ProtectedRoute roles={["verifier", "aicte_admin"]}>
                            <VerifyRecord />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/consent"
                    element={
                        <ProtectedRoute roles={["student"]}>
                            <StudentConsent />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthProvider>
    );
}