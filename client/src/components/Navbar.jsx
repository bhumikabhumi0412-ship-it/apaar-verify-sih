import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_LABEL = {
  aicte_admin: "AICTE Admin",
  institution_admin: "Institution Admin",
  verifier: "Verifier",
  student: "Student",
};

const LINKS = {
  aicte_admin: [
    { to: "/aicte", label: "Dashboard" },
    { to: "/verify", label: "Verify" },
  ],
  verifier: [{ to: "/verify", label: "Verify" }],
  student: [{ to: "/consent", label: "Consent & QR" }],
  institution_admin: [],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const links = user ? LINKS[user.role] || [] : [];

  return (
    <header className="bg-blue-800 text-white">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-tight">APAAR-Verify</span>
          <nav className="flex items-center gap-2">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm ${
                    isActive ? "bg-white/25" : "hover:bg-white/15"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-blue-200">{ROLE_LABEL[user.role]}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md bg-white/15 hover:bg-white/25 px-3 py-1.5 text-sm"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}