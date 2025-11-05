import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// Electron API types are declared in AuthContext.tsx

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.trim() !== confirmPassword.trim()) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (!user?.id) {
      setError("User not authenticated");
      return;
    }

    setLoading(true);

    try {
      // Update password using admin API with the current user ID
      const updateResult = await window.electronAPI.updateUserPassword(
        user.id.toString(),
        newPassword
      );
      if (!updateResult.success) {
        setError(updateResult.error || "Failed to update password.");
      } else {
        // Refresh user data to ensure consistency
        refreshUser();
        setSuccess(true);
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      }
    } catch (err) {
      console.error("Password change error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-100 to-blue-300">
        <div className="w-full max-w-md bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-2xl overflow-hidden border border-blue-300">
          <div className="p-8 md:p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Password Changed!
              </h2>
              <p className="text-gray-600 mb-6">
                Your password has been successfully changed. You will be
                redirected to the dashboard shortly.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="w-full h-[450px] bg-gradient-to-br from-blue-500 to-blue-50"></div>
        <div className="w-full h-full bg-gray-100 -mt-[2px]"></div>
      </div>

      <div className="flex-1 flex flex-col min-h-screen ml-68 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-4xl bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-2xl overflow-hidden border border-blue-300 grid md:grid-cols-2">
            <div className="p-8 md:p-12">
              <div className="flex items-center gap-3 mb-8">
                <img
                  src="/src/assets/Logo.png"
                  alt="School Logo"
                  className="w-10 h-10"
                />
                <h1 className="text-2xl font-bold text-gray-600">
                  Change Password
                </h1>
              </div>

              <p className="text-gray-600 mb-8">
                Choose a new password.
              </p>

              {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200"
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer hover:opacity-80 transition"
                    >
                      {showNewPassword ? (
                        <EyeOff size={24} />
                      ) : (
                        <Eye size={24} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200"
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer hover:opacity-80 transition"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={24} />
                      ) : (
                        <Eye size={24} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mt-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg text-lg font-medium hover:from-blue-600 hover:to-blue-800 transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Changing..." : "Change Password"}
                </button>
              </form>
            </div>

            <div className="hidden md:flex flex-col bg-gradient-to-br from-blue-500 to-blue-700 p-8 md:p-12 text-white">
              <div className="flex-grow flex items-center justify-center">
                <svg
                  className="w-3/4 h-auto"
                  viewBox="0 0 200 150"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 20L20 70H180L100 20Z"
                    fill="white"
                    fillOpacity="0.5"
                  />
                  <rect
                    x="30"
                    y="70"
                    width="140"
                    height="60"
                    rx="5"
                    fill="white"
                    fillOpacity="0.8"
                  />
                  <rect
                    x="50"
                    y="90"
                    width="20"
                    height="20"
                    rx="2"
                    fill="#2563EB"
                  />
                  <rect
                    x="80"
                    y="90"
                    width="40"
                    height="40"
                    rx="2"
                    fill="#2563EB"
                  />
                  <rect
                    x="130"
                    y="90"
                    width="20"
                    height="20"
                    rx="2"
                    fill="#2563EB"
                  />
                  <path
                    d="M10 130H190V140H10V130Z"
                    fill="white"
                    fillOpacity="0.6"
                  />
                </svg>
              </div>
              <div className="text-center mt-auto">
                <p className="text-sm">
                  Secure your account with a strong password. <br />
                  Your security is our top priority!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
