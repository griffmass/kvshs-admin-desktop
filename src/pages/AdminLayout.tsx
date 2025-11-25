import { useState } from "react";
import Sidebar from "../components/Sidebar";
import StudentsPage from "../pages/StudentsPage";
import Dashboard from "../pages/Dashboard";

// You can add other page components here as you create them
// import AppUsersPage from '../pages/AppUsersPage';
// import SecurityPage from '../pages/SecurityPage';

export default function AdminLayout() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleLogout = () => {
    // Implement your logout logic here (e.g., clear session, redirect to login)
    console.log("User logged out");
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard onNavigate={handleNavigate} />;

      // When either 'enrollment' or 'student-records' is clicked, show the StudentsPage
      case "enrollment":
      case "student-records":
        return <StudentsPage currentPage={currentPage} />;

      // Add cases for other pages here
      // case 'app-users':
      //   return <AppUsersPage />;

      default:
        return <Dashboard onNavigate={handleNavigate} />; // Fallback to dashboard
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      <main className="flex-1 ml-64">{renderCurrentPage()}</main>
    </div>
  );
}
