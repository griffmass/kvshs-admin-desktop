import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, CheckCircle, Plus, Search } from 'lucide-react';
import emailjs from '@emailjs/browser';

interface AppUser {
  email: string;
  password: string;
  status: string;
  full_name: string;
}

export default function AppUsers() {
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    password: ''
  });
  const [modalKey, setModalKey] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'approve';
    userEmail: string;
    userName?: string;
  } | null>(null);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
  });

  useEffect(() => {
    fetchAppUsers();
  }, []);

  const fetchAppUsers = async () => {
    try {
      // Assuming there's a 'AppUsers' table in Supabase
      const { data, error } = await supabase
        .from('AppUsers')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;

      // Force a new array reference to ensure re-render
      const newData = data || [];
      setAppUsers([...newData]);

      // Calculate stats
      const pendingCount = newData.filter(user => user.status === 'Pending').length || 0;
      const approvedCount = newData.filter(user => user.status === 'Approved').length || 0;

      setStats({
        pending: pendingCount,
        approved: approvedCount,
      });
    } catch (error) {
      console.error('Error fetching app users:', error);
    }
  };

  const filteredAppUsers = appUsers.filter((user) => {
    const fullName = user.full_name || '';
    return searchTerm === '' ||
          fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
  });




  const handleApproveAppUser = (userEmail: string, userName?: string) => {
    setConfirmAction({
      type: 'approve',
      userEmail,
      userName
    });
    setShowConfirmModal(true);
  };

  const handleConfirmApprove = async () => {
    if (!confirmAction || confirmAction.type !== 'approve') return;

    try {
      const { error } = await supabase
        .from('AppUsers')
        .update({ status: 'Approved' })
        .eq('email', confirmAction.userEmail);

      if (error) throw error;

      // Send approval email
      const templateParams = {
        email: confirmAction.userEmail,
        user_email: confirmAction.userEmail,
      };

      console.log('Sending approval email with params:', templateParams);

      // Check if all required values are present
      if (!import.meta.env.VITE_EMAILJS_SERVICE_ID ||
          !import.meta.env.VITE_EMAILJS_TEMPLATE_ID ||
          !import.meta.env.VITE_EMAILJS_PUBLIC_KEY) {
        throw new Error('EmailJS configuration is missing. Please check your .env file.');
      }

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        'template_yy2u2nl', // Approval template
        templateParams,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      console.log('Approval email sent successfully to:', confirmAction.userEmail);

      console.log('Approval email sent successfully');

      // Refresh the list
      await fetchAppUsers();
      setShowConfirmModal(false);
      setConfirmAction(null);
      setSuccessMessage('App user approved and notification email sent!');
      setShowSuccessModal(true);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error approving app user:', err);
      alert(`Error approving app user: ${err.message}`);
    }
  };


  const handleDeleteAppUser = (userEmail: string, userName?: string) => {
    setConfirmAction({
      type: 'delete',
      userEmail,
      userName
    });
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmAction || confirmAction.type !== 'delete') return;

    try {
      // Delete from AppUsers table
      const { error: deleteError } = await supabase
        .from('AppUsers')
        .delete()
        .eq('email', confirmAction.userEmail);

      if (deleteError) throw deleteError;

      // Delete from auth.users (optional - this will prevent login)
      // Note: This requires admin privileges in Supabase
      // const { error: authError } = await supabase.auth.admin.deleteUser(confirmAction.userEmail);

      // Refresh the list
      await fetchAppUsers();
      setModalKey(prev => prev + 1);
      setShowConfirmModal(false);
      setConfirmAction(null);
      setSuccessMessage('App user deleted successfully!');
      setShowSuccessModal(true);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error deleting app user:', err);
      alert(`Error deleting app user: ${err.message}`);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUser.email || !newUser.full_name || !newUser.password) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('AppUsers')
        .insert({
          email: newUser.email,
          full_name: newUser.full_name,
          password: newUser.password,
          status: 'Approved' // Default to approved for manually added accounts
        });

      if (error) throw error;

      // Send account activation email with credentials
      const templateParams = {
        email: newUser.email,
        user_email: newUser.email,
        user_password: newUser.password,
      };

      console.log('Sending account activation email with params:', templateParams);
      console.log('EmailJS Config:', {
        serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
        templateId: 'template_yy2u2nl',
        publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      });

      // Check if all required values are present
      if (!import.meta.env.VITE_EMAILJS_SERVICE_ID ||
          !import.meta.env.VITE_EMAILJS_TEMPLATE_ID ||
          !import.meta.env.VITE_EMAILJS_PUBLIC_KEY) {
        throw new Error('EmailJS configuration is missing. Please check your .env file.');
      }

      try {
        const result = await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          'template_yy2u2nl', // Account activation template
          templateParams,
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        );
        console.log('EmailJS result:', result);
        console.log('Account activation email sent successfully to:', newUser.email);
      } catch (emailError) {
        console.error('EmailJS error:', emailError);
        throw emailError;
      }

      setSuccessMessage('App user added successfully and activation email sent!');
      setShowSuccessModal(true);
      setShowAddModal(false);
      setNewUser({ email: '', full_name: '', password: '' });
      await fetchAppUsers();
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error adding app user:', err);
      alert(`Error adding app user: ${err.message}`);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="w-full h-[450px] bg-gradient-to-br from-blue-500 to-blue-50"></div>
        <div className="w-full h-full bg-gray-100 -mt-[2px]"></div>
      </div>

      <div className="flex-1 flex flex-col min-h-screen ml-68 overflow-y-auto">
        <div className="p-4 pl-32 pt-12">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">App Users</h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-2 rounded-lg text-lg font-medium hover:from-blue-600 hover:to-blue-800 transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 flex items-center gap-2"
            >
              <Plus size={20} />
              Add Account
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 h-40 rounded-xl shadow-md flex items-center justify-between hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
              <div>
                <p className="font-bold text-gray-600 uppercase">PENDING USERS</p>
                <p className="text-4xl font-semibold text-gray-600 mt-2">{stats.pending}</p>
              </div>
              <div className="bg-gradient-to-tr from-yellow-400 to-yellow-600 p-4 rounded-full shadow-lg">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>

            <div className="bg-white p-6 h-40 rounded-xl shadow-md flex items-center justify-between hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
              <div>
                <p className="font-bold text-gray-600 uppercase">APPROVED USERS</p>
                <p className="text-4xl font-semibold text-gray-600 mt-2">{stats.approved}</p>
              </div>
              <div className="bg-gradient-to-tr from-green-400 to-green-600 p-4 rounded-full shadow-lg">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md flex-grow hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="border-b-2 border-gray-300 pb-2">
                <h2 className="text-lg font-bold text-gray-600">LIST OF ALL APP USERS:</h2>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && console.log('Search triggered')}
                  className="w-80 px-4 py-2 pl-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition duration-200 text-gray-700 placeholder-gray-400 shadow-sm"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear search"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {searchTerm && (
              <div className="mb-4 text-sm text-gray-600">
                Searching for: <span className="font-medium text-blue-600">"{searchTerm}"</span>
                <span className="ml-2 text-xs text-gray-500">
                  ({filteredAppUsers.length} result{filteredAppUsers.length !== 1 ? 's' : ''} found)
                </span>
              </div>
            )}
            <div className="overflow-x-auto">
              {filteredAppUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {searchTerm ? 'No app users found matching your search' : 'No app users found'}
                </div>
              ) : (
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3 px-6">Email</th>
                      <th scope="col" className="py-3 px-6">Full Name</th>
                      <th scope="col" className="py-3 px-6">Status</th>
                      <th scope="col" className="py-3 px-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppUsers.map((user) => (
                      <tr key={user.email} className="bg-white border-b">
                        <td className="py-3 px-6">{user.email}</td>
                        <td className="py-3 px-6">{user.full_name}</td>
                        <td className="py-3 px-6">
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                            user.status === 'Approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleDeleteAppUser(user.email, user.full_name)}
                              className="flex items-center space-x-1 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                            {user.status === 'Pending' && (
                              <button
                                onClick={() => handleApproveAppUser(user.email, user.full_name)}
                                className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                              >
                                <CheckCircle size={14} />
                                <span>Approve</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Confirm {confirmAction.type === 'delete' ? 'Delete' : 'Approve'}
                </h2>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                >
                  &times;
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 text-lg">
                  {confirmAction.type === 'delete'
                    ? `Are you sure you want to delete the app user account for "${confirmAction.userName || confirmAction.userEmail}"?`
                    : `Are you sure you want to approve the app user account for "${confirmAction.userName || confirmAction.userEmail}"?`
                  }
                </p>
                {confirmAction.type === 'delete' && (
                  <p className="text-red-600 text-sm mt-2 font-medium">
                    This action cannot be undone.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                  }}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction.type === 'delete' ? handleConfirmDelete : handleConfirmApprove}
                  className={`px-6 py-2 text-white rounded-lg transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    confirmAction.type === 'delete'
                      ? 'bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 focus:ring-red-600'
                      : 'bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 focus:ring-green-600'
                  }`}
                >
                  {confirmAction.type === 'delete' ? 'Delete' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">Success</h2>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                >
                  &times;
                </button>
              </div>

              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-600 text-lg text-center">{successMessage}</p>
              </div>

              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg hover:from-blue-600 hover:to-blue-800 transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div key={modalKey} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">Add New Account</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    id="full_name"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    id="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200"
                    placeholder="Enter password"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg hover:from-blue-600 hover:to-blue-800 transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
                  >
                    Add Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}