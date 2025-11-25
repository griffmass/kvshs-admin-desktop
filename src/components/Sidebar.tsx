import React, { useState } from 'react';
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Shield,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import schoolLogo from "/favicon.ico";

// Define the structure for nested navigation
interface NavItem {
  id: string;
  label: string;
  icon?: React.ElementType; // Icon is optional for sub-items
  subItems?: { id: string; label: string }[];
}

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  // This is the parent item for students
  {
    id: "students-parent",
    label: "Students",
    icon: Users,
    subItems: [
      { id: "enrollment", label: "Enrollment" },
      { id: "student-records", label: "Student Records" },
    ],
  },
  { id: "app-users", label: "AppUsers", icon: Users },
  { id: "security", label: "Security", icon: Shield },
];

// Helper function to check if a page is a student sub-page
const isStudentSubPage = (page: string) =>
  ['enrollment', 'student-records'].includes(page);


export default function Sidebar({
  currentPage,
  onNavigate,
  onLogout,
}: SidebarProps) {
  // Determine if the sub-menu should be open. It should be open if a sub-page is currently active.
  const [isStudentsOpen, setIsStudentsOpen] = useState(
    isStudentSubPage(currentPage)
  );

  const handleParentClick = (id: string, subItems: NavItem['subItems']) => {
    if (id === "students-parent" && subItems) {
      // Toggle the dropdown
      setIsStudentsOpen(!isStudentsOpen);
    } else {
      onNavigate(id);
    }
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-white shadow-lg flex flex-col p-4 z-10">
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
        <img src={schoolLogo} alt="KVSHS Logo" className="h-10 w-10" />
        <span className="text-xl font-bold text-gray-700 whitespace-nowrap">
          KVSHS Admin
        </span>
      </div>

      <nav className="flex-grow mt-6 space-y-2">
        {navItems.map((item) => {
          const isActive = (item.id === "students-parent" && isStudentSubPage(currentPage)) || currentPage === item.id;

          return (
            <div key={item.id}>
              {/* Main Navigation Item (Parent or Standalone) */}
              <button
                onClick={() => handleParentClick(item.id, item.subItems)}
                className={`relative w-full text-left rounded-lg transition-all duration-200 ${
                  isActive ? "text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-blue-500 rounded-lg shadow-md"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-between w-full px-4 py-3">
                  <div className="flex items-center gap-4">
                    {item.icon && <item.icon size={20} />}
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.subItems && (
                    isStudentsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                  )}
                </span>
              </button>

            {/* Sub-Items (Enrollment and Student Records) */}
            {item.subItems && (
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isStudentsOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-3">
                    {item.subItems.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => onNavigate(subItem.id)}
                        className={`relative w-full flex items-center px-4 py-2 text-left rounded-lg transition-all duration-200 text-sm ${
                          currentPage === subItem.id
                            ? "text-blue-700 font-semibold"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {currentPage === subItem.id && (
                          <motion.div
                            layoutId="active-sub-pill"
                            className="absolute inset-0 bg-blue-100 rounded-lg"
                            initial={false}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            </div>
          );
        })}
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