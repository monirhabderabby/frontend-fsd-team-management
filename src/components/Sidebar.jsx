import {
  FolderKanban,
  LayoutGrid,
  Rocket,
  ShieldCheck,
  Settings,
  Users,
  UserCog,
  Trophy,
  LogOut,
  ChevronRight,
  Megaphone,
  BookOpen,
} from "lucide-react";
// import { IoMegaphoneOutline } from "react-icons/io5";
import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import logo from "../assets/logo.png";

const roleLabels = {
  SUPER_ADMIN: "Super Admin",
  PROJECT_MANAGER: "Project Manager",
  TEAM_LEADER: "Team Leader",
  MEMBER: "Member",
};

const navItems = [
  { label: "Dashboard", to: "/", icon: LayoutGrid },
  { label: "Projects", to: "/projects", icon: FolderKanban },
  {
    label: "Delivery",
    to: "/delivery",
    icon: Rocket,
    roles: ["SUPER_ADMIN", "PROJECT_MANAGER", "TEAM_LEADER"],
  },
  { label: "Ranking", to: "/ranking", icon: Trophy },
  {
    label: "Service Lines",
    to: "/service-lines",
    icon: ShieldCheck,
    roles: ["SUPER_ADMIN"],
  },
  {
    label: "Teams",
    to: "/teams",
    icon: Users,
    roles: ["SUPER_ADMIN", "PROJECT_MANAGER"],
  },
  {
    label: "Employees",
    to: "/employees",
    icon: UserCog,
    roles: ["SUPER_ADMIN", "PROJECT_MANAGER", "TEAM_LEADER"],
  },
  { label: "Announcement", to: "/announcement", icon: Megaphone },
  { label: "Learn Together", to: "/learn-together", icon: BookOpen },
  // { label: "Attendance", to: "/attendance", icon: CalendarCheck },
  // { label: "Reports", to: "/reports", icon: BarChart3 },
  { label: "Settings", to: "/settings", icon: Settings },
];

const Sidebar = ({ isCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const filteredItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  });
  const displayName = user?.name || "User";
  const roleLabel = roleLabels[user?.role] || user?.role || "";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <aside
      className={`app-sidebar hidden md:flex ${isCollapsed ? "app-sidebar-collapsed" : ""
        }`}
    >
      {/* ── Brand Logo ── */}
      <div className={`p-5 ${isCollapsed ? "px-3" : "px-5"} border-b border-white/8 relative z-20`}>
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-10 h-10 rounded-xl bg-white border border-brand-yellow/40 shadow-lg shadow-brand-yellow/20 flex items-center justify-center shrink-0">
            <img src={logo} alt="Team Management Portal" className="h-7 w-7 object-contain rounded-lg" />
          </div>
          <div className={isCollapsed ? "hidden" : "block"}>
            <p className="font-semibold text-[20px] tracking-tight text-white">
              Team
            </p>
            <p className="text-[14px] text-slate-400 tracking-wide">Management Portal</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className={`flex-1 overflow-y-auto py-3 ${isCollapsed ? "px-2" : "px-3"} space-y-0.5 relative z-20`}>
        <p className={`text-[11px] uppercase tracking-[0.22em] text-slate-400 mb-3 ${isCollapsed ? "hidden" : "px-3"}`}>
          Main Menu
        </p>
        {filteredItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
                isCollapsed ? "justify-center" : "",
                isActive
                  ? "bg-brand-green/18 text-brand-yellow shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                  : "text-slate-300/75 hover:text-white hover:bg-white/10 hover:shadow-lg",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-yellow rounded-r-full shadow-[0_0_12px_rgba(255,195,0,0.55)]" />
                )}
                <item.icon size={18} className={`shrink-0 transition-all duration-300 ${isActive ? "text-brand-yellow scale-110" : "text-slate-500 group-hover:text-slate-200 group-hover:scale-110"}`} />
                <span className={`${isCollapsed ? "hidden" : "text-[14.5px] font-semibold tracking-wide"}`}>
                  {item.label}
                </span>
                {!isCollapsed && isActive && (
                  <ChevronRight size={14} className="ml-auto text-brand-yellow/90 animate-pulse" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User Card ── */}
      <div className={`p-4 ${isCollapsed ? "px-2" : "px-4"} relative z-20`}>
        <div className={`bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10 shadow-xl ${isCollapsed ? "px-1.5" : ""}`}>
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
            <div className="relative shrink-0">
              <div className="w-10 h-10 bg-brand-green text-white rounded-xl flex items-center justify-center font-bold text-sm overflow-hidden shadow-lg shadow-brand-green/25">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  initials || "U"
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-brand-yellow border-2 border-[#07160B] rounded-full shadow-sm" />
            </div>
            <div className={isCollapsed ? "hidden" : "block min-w-0"}>
              <p className="font-semibold text-white text-[13.5px] truncate leading-tight">{displayName}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 truncate mt-0.5">{roleLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className={`mt-3 w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-rose-500/10 text-slate-300 hover:text-rose-300 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-200 border border-transparent hover:border-rose-500/20 ${isCollapsed ? "hidden" : "flex"
              }`}
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
