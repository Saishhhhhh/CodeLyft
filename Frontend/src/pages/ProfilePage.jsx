import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaKey, FaCamera, FaSave, FaExclamationTriangle, FaCheck } from 'react-icons/fa';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4 }
  }
};

const ProfilePage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    profilePicture: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Populate form with user data
    if (user) {
      setProfileData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
      
      if (user.profilePicture) {
        setImagePreview(user.profilePicture);
      }
    }
  }, [user, isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setProfileData(prev => ({
      ...prev,
      profilePicture: file
    }));

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulated API call - replace with actual API implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (profileData.newPassword !== profileData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (profileData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      // Simulated API call - replace with actual API implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      toast.success('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-xl p-6 mb-8 text-white"
          >
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="mt-2">Manage your account settings and preferences</p>
          </motion.div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-md mb-8">
            <div className="flex border-b border-gray-200">
              <button
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'profile'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('profile')}
              >
                Profile Information
              </button>
              <button
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'security'
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('security')}
              >
                Security
              </button>
            </div>

            {/* Profile Information Tab */}
            {activeTab === 'profile' && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="p-6"
              >
                <form onSubmit={handleProfileUpdate}>
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Profile Picture */}
                    <motion.div variants={itemVariants} className="flex flex-col items-center">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                          <img
                            src={imagePreview || (user?.profilePicture || "https://via.placeholder.com/200?text=Profile")}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <label
                          htmlFor="profile-picture"
                          className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-purple-700 transition-colors"
                        >
                          <FaCamera />
                          <input
                            type="file"
                            id="profile-picture"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                      </div>
                      <p className="mt-3 text-sm text-gray-500">Click to change photo</p>
                    </motion.div>

                    {/* Form Fields */}
                    <div className="flex-1 space-y-6">
                      <motion.div variants={itemVariants}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaUser className="text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="name"
                            value={profileData.name}
                            onChange={handleInputChange}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                            placeholder="Your full name"
                          />
                        </div>
                      </motion.div>

                      <motion.div variants={itemVariants}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaEnvelope className="text-gray-400" />
                          </div>
                          <input
                            type="email"
                            name="email"
                            value={profileData.email}
                            onChange={handleInputChange}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                            placeholder="your@email.com"
                            disabled={user?.isOAuthUser}
                          />
                        </div>
                        {user?.isOAuthUser && (
                          <p className="mt-1 text-sm text-gray-500">
                            Email cannot be changed for accounts linked with OAuth providers.
                          </p>
                        )}
                      </motion.div>

                      <motion.div variants={itemVariants}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account Status
                        </label>
                        <div className="flex items-center space-x-2 py-2">
                          {user?.isEmailVerified ? (
                            <>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                <FaCheck className="mr-1" /> Verified
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                <FaExclamationTriangle className="mr-1" /> Unverified
                              </span>
                              <button
                                type="button"
                                className="text-sm text-purple-600 hover:text-purple-800"
                              >
                                Resend verification email
                              </button>
                            </>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {user?.isEmailVerified
                            ? 'Your account is fully verified.'
                            : 'Please verify your email address to access all features.'}
                        </p>
                      </motion.div>

                      <motion.div variants={itemVariants} className="pt-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                          {loading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Saving...
                            </>
                          ) : (
                            <>
                              <FaSave className="mr-2" /> Save Changes
                            </>
                          )}
                        </button>
                      </motion.div>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="p-6"
              >
                <form onSubmit={handlePasswordUpdate}>
                  <div className="space-y-6 max-w-md">
                    <motion.h3 
                      variants={itemVariants}
                      className="text-lg font-medium text-gray-900 border-b pb-2"
                    >
                      Change Password
                    </motion.h3>

                    {user?.isOAuthUser ? (
                      <motion.div 
                        variants={itemVariants}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800"
                      >
                        <p>Your account is linked with an OAuth provider. Password management is handled by the provider.</p>
                      </motion.div>
                    ) : (
                      <>
                        <motion.div variants={itemVariants}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Password
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FaKey className="text-gray-400" />
                            </div>
                            <input
                              type="password"
                              name="currentPassword"
                              value={profileData.currentPassword}
                              onChange={handleInputChange}
                              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                              placeholder="Enter current password"
                            />
                          </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FaKey className="text-gray-400" />
                            </div>
                            <input
                              type="password"
                              name="newPassword"
                              value={profileData.newPassword}
                              onChange={handleInputChange}
                              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                              placeholder="Enter new password"
                            />
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            Password must be at least 8 characters long.
                          </p>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FaKey className="text-gray-400" />
                            </div>
                            <input
                              type="password"
                              name="confirmPassword"
                              value={profileData.confirmPassword}
                              onChange={handleInputChange}
                              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                              placeholder="Confirm new password"
                            />
                          </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="pt-4">
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          >
                            {loading ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Updating...
                              </>
                            ) : (
                              'Update Password'
                            )}
                          </button>
                        </motion.div>
                      </>
                    )}
                  </div>
                </form>
              </motion.div>
            )}
          </div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-md p-6 border border-red-200"
          >
            <h2 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h2>
            
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">Delete Account</h3>
                    <p className="text-sm text-gray-500">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage; 