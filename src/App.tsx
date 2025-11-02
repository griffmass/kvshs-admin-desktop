import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import NewStudent from './pages/NewStudent';
import ALSStudent from './pages/ALSStudent';
import ALSNewEnrollees from './pages/ALSNewEnrollees';
import RegularStudent from './pages/RegularStudent';
import AppUsers from './pages/AppUsers';
import ChangePassword from './pages/ChangePassword';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword';

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const renderPage = (page: string) => {
    switch (page) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'new-student':
        return <NewStudent />;
      case 'als-student':
        return <ALSStudent />;
      case 'als-new-enrollees':
        return <ALSNewEnrollees />;
      case 'regular-student':
        return <RegularStudent />;
      case 'app-users':
        return <AppUsers />;
      case 'security':
        return <ChangePassword />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    await signOut();
    setShowLogoutModal(false);
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // If user is logged in, show dashboard directly
  if (user) {
    return (
      <div className="flex h-screen relative overflow-hidden">
        {/* Main container for the two-part background */}
        <div className="absolute inset-0 -z-10">
          <div className="w-full h-[450px] bg-gradient-to-br from-blue-500 to-blue-50"></div>
          <div className="w-full h-full bg-gray-100 -mt-[2px]"></div> {/* Clean overlap */}
        </div>
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogoutClick} />
        <main className="ml-48 flex-1 overflow-hidden">
          {renderPage(currentPage)}
        </main>
        {showLogoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 9999 }}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full" style={{ zIndex: 10000 }}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Confirm Logout</h2>
                  <button
                    onClick={handleLogoutCancel}
                    className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                  >
                    &times;
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-gray-600 text-lg">Are you sure you want to log out?</p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={handleLogoutCancel}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogoutConfirm}
                    className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-lg hover:from-red-600 hover:to-red-800 transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If no user, show auth routes
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
