import { NavLink } from "react-router-dom";

const cls = ({ isActive }) =>
  `px-4 py-2 rounded-md text-sm font-medium ${
    isActive ? "bg-blue-700 text-white" : "bg-white text-slate-700 hover:bg-slate-100 shadow"
  }`;

export default function InstitutionTabs() {
  return (
    <div className="flex gap-2 mb-6">
      <NavLink to="/institution" end className={cls}>Dashboard</NavLink>
      <NavLink to="/institution/upload" className={cls}>Upload students</NavLink>
    </div>
  );
}
