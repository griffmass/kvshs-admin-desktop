import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserPlus,
  LogOut,
  Shield,
} from "lucide-react";
import schoolLogo from "/favicon.ico";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "regular-student", label: "Regular Students", icon: Users },
  { id: "als-student", label: "ALS Students", icon: BookOpen },
  { id: "als-new-enrollees", label: "ALS New Enrollees", icon: UserPlus },
  { id: "new-student", label: "New Enrollees", icon: UserPlus },
  { id: "app-users", label: "AppUsers", icon: Users },
  { id: "security", label: "Security", icon: Shield },
];

export default function Sidebar({
  currentPage,
  onNavigate,
  onLogout,
}: SidebarProps) {
  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-white shadow-lg flex flex-col p-4">
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
        <img src={schoolLogo} alt="KVSHS Logo" className="h-10 w-10" />
        <span className="text-xl font-bold text-gray-700 whitespace-nowrap">
          KVSHS Admin
        </span>
      </div>

      <nav className="flex-grow mt-6 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 text-left rounded-lg transition-all duration-200 ${
              currentPage === item.id
                ? "bg-blue-500 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-4 py-3 text-left rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors duration-200"
        >
          <LogOut size={20} />
          <span>Log out</span>
        </button>
        <p className="text-center text-xs text-gray-400 mt-4">
          @2025, developed by SIRI.JS for a better desktop.
        </p>
      </div>
    </aside>
  );
}
