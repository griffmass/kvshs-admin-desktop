import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

// Electron API types are declared in AuthContext.tsx

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await window.electronAPI.loginAdmin(email, password);
      if (!result.success) {
        setError(result.error || 'Login failed');
      } else {
        // Login successful - set user in context and redirect
        console.log('Login successful:', result.user);
        signIn(result.user!, keepLoggedIn);
        navigate('/'); // Use React Router navigation
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-100 to-blue-300 relative">
      <div className="w-full max-w-4xl bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-2xl overflow-hidden border border-blue-300 grid md:grid-cols-2">
        <div className="p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8">
            <img src="/src/assets/Logo.png" alt="School Logo" className="w-10 h-10" />
            <h1 className="text-2xl font-bold text-gray-600">KVSHS Admin Login</h1>
          </div>

          <p className="text-gray-600 mb-8">Login with your admin credentials.</p>

          {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Your E-mail</label>
              <input
                type="email"
                id="email"
                placeholder="your.admin.email@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pr-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer hover:opacity-80 transition"
                >
                  {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="keepLoggedIn"
                type="checkbox"
                checked={keepLoggedIn}
                onChange={(e) => setKeepLoggedIn(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="keepLoggedIn" className="ml-2 block text-sm text-gray-900">Keep me logged in</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg text-lg font-medium hover:from-blue-600 hover:to-blue-800 transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>

            <div className="text-center pt-2">
              <Link to="/forgot-password" className="font-medium text-sm text-blue-600 hover:text-blue-500">Forgot Password?</Link>
            </div>
          </form>
        </div>

        <div className="hidden md:flex flex-col bg-gradient-to-br from-blue-500 to-blue-700 p-8 md:p-12 text-white">
          <div className="flex-grow flex items-center justify-center">
            <svg className="w-3/4 h-auto" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 20L20 70H180L100 20Z" fill="white" fillOpacity="0.5" />
              <rect x="30" y="70" width="140" height="60" rx="5" fill="white" fillOpacity="0.8" />
              <rect x="50" y="90" width="20" height="20" rx="2" fill="#2563EB" />
              <rect x="80" y="90" width="40" height="40" rx="2" fill="#2563EB" />
              <rect x="130" y="90" width="20" height="20" rx="2" fill="#2563EB" />
              <path d="M10 130H190V140H10V130Z" fill="white" fillOpacity="0.6" />
            </svg>
          </div>
          <div className="text-center mt-auto">
            <p className="text-sm">
              Don't have an account yet? <br />
              Contact us at <span className="font-semibold">johnmichael.abanil@student.pnm.edu.ph</span> and we will take care of everything!!
            </p>
          </div>
        </div>
      </div>

      {/* About Us and Github Links */}
      <div className="absolute bottom-4 left-4 flex gap-6">
        <button
          onClick={() => setShowAboutModal(true)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
        >
          About Us
        </button>
        <button
          onClick={() => window.open('https://github.com/griffmass/kvshs-enrollment-management', '_blank')}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
        >
          Github
        </button>
      </div>

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">About Us</h2>
                <button
                  onClick={() => setShowAboutModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                >
                  &times;
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">PROJECT DEVELOPERS</h3>
                <hr className="border-gray-300 mb-6" />
                <div className="grid grid-cols-2 gap-6 justify-items-center">
                  <div className="text-center">
                    <p className="font-bold text-gray-600">MR. JOHN MICHAEL G. ABANIL</p>
                    <p className="text-gray-500 text-sm">Desktop and Lead Developer</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-600">MR. ARON JAMES L. BETINOL</p>
                    <p className="text-gray-500 text-sm">Web Developer</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-600">MR. JOMEL M. MARIÑO</p>
                    <p className="text-gray-500 text-sm">Mobile Developer</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-600">MS. JENNELYN S. SERANTE</p>
                    <p className="text-gray-500 text-sm">Docs</p>
                  </div>
                </div>
                <div className="text-center mt-6">
                  <div>
                    <p className="font-bold text-gray-600">MS. ANGELICA C. GALANTO</p>
                    <p className="text-gray-500 text-sm">Docs</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setShowAboutModal(false)}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg hover:from-blue-600 hover:to-blue-800 transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}