import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-900 text-white pt-20">
        <main className="container mx-auto px-6 py-8">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Welcome, {user?.name || 'User'}!</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-700 rounded-lg p-5">
                <h3 className="font-medium text-purple-300 mb-3">Your Profile</h3>
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <img 
                        src={user.profilePicture || "https://via.placeholder.com/100"} 
                        alt="Profile" 
                        className="w-16 h-16 rounded-full mr-4 object-cover"
                      />
                      <div>
                        <p className="text-lg font-medium">{user.name}</p>
                        <p className="text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="pt-2">
                      <p className="text-sm text-gray-400">
                        <span className="font-medium">Account type:</span> {user.role}
                      </p>
                      <p className="text-sm text-gray-400">
                        <span className="font-medium">Email verified:</span> {user.isEmailVerified ? 'Yes' : 'No'}
                      </p>
                      <p className="text-sm text-gray-400">
                        <span className="font-medium">Member since:</span> {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400">Loading profile information...</p>
                )}
              </div>
              
              <div className="bg-gray-700 rounded-lg p-5">
                <h3 className="font-medium text-purple-300 mb-3">Account Security</h3>
                <div className="space-y-4">
                  <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors text-left flex justify-between items-center">
                    <span>Change Password</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors text-left flex justify-between items-center">
                    <span>Two-Factor Authentication</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors text-left flex justify-between items-center">
                    <span>Connected Accounts</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">My Roadmaps</h2>
                <Link to="/my-roadmaps" className="text-purple-400 hover:text-purple-300 text-sm flex items-center">
                  View All
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
              <div className="bg-gray-700 rounded-lg p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-400 mb-4">Create personalized learning roadmaps to track your progress</p>
                <Link 
                  to="/my-roadmaps" 
                  className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
                >
                  Manage Your Roadmaps
                </Link>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-gray-400 text-center py-4">No recent activity to display.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
};

export default Dashboard; 