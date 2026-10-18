import { NavLink } from "react-router-dom";

const LINKS = [["/internal/build", "Build & Environment"], ["/internal/health", "Health Center"]];

export default function InternalNav() {
  return (
    <nav aria-label="Internal tooling" className="flex flex-wrap gap-2">
      {LINKS.map(([to, label]) => (
        <NavLink key={to} to={to}
          className={({ isActive }) => `min-h-11 px-4 inline-flex items-center rounded-xl text-sm border ${isActive ? "bg-shinka-plum text-shinka-surface border-shinka-plum" : "bg-shinka-surface text-shinka-plum border-shinka-line"}`}>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}