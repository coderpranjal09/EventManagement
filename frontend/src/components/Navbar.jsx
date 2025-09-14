import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Shield, 
  Users, 
  QrCode,
  BarChart3
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin, isCoordinator, isMember, isCommitteeMember } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-800">FestivoEMS</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/events" 
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Events
            </Link>

            {user && (
              <Link 
                to="/my-registrations" 
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                My Registrations
              </Link>
            )}

            {isCommitteeMember() && (
              <>
                <Link 
                  to={isCoordinator() ? "/coordinator/dashboard" : "/member/dashboard"} 
                  className="text-gray-600 hover:text-primary-600 transition-colors flex items-center space-x-1"
                >
                  <Shield className="h-4 w-4" />
                  <span>{isCoordinator() ? 'Coordinator' : 'Member'}</span>
                </Link>
                <Link 
                  to={isCoordinator() ? "/coordinator/registrations" : "/member/registrations"} 
                  className="text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Registrations
                </Link>
                <Link 
                  to="/committee/verify" 
                  className="text-gray-600 hover:text-primary-600 transition-colors flex items-center space-x-1"
                >
                  <QrCode className="h-4 w-4" />
                  <span>Verify QR</span>
                </Link>
                <Link 
                  to={isCoordinator() ? "/coordinator/reports" : "/member/reports"} 
                  className="text-gray-600 hover:text-primary-600 transition-colors flex items-center space-x-1"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Reports</span>
                </Link>
              </>
            )}

            {isAdmin() && (
              <>
                <Link 
                  to="/admin/dashboard" 
                  className="text-gray-600 hover:text-primary-600 transition-colors flex items-center space-x-1"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
                <Link 
                  to="/admin/registrations" 
                  className="text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Registrations
                </Link>
              </>
            )}

            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700">{user.name}</span>
                  <span className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-full">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="btn-primary"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link 
                to="/events" 
                className="text-gray-600 hover:text-primary-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Events
              </Link>

              {user && (
                <Link 
                  to="/my-registrations" 
                  className="text-gray-600 hover:text-primary-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Registrations
                </Link>
              )}

              {isCommitteeMember() && (
                <>
                  <Link 
                    to={isCoordinator() ? "/coordinator/dashboard" : "/member/dashboard"} 
                    className="text-gray-600 hover:text-primary-600 transition-colors flex items-center space-x-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Shield className="h-4 w-4" />
                    <span>{isCoordinator() ? 'Coordinator Dashboard' : 'Member Dashboard'}</span>
                  </Link>
                  <Link 
                    to={isCoordinator() ? "/coordinator/registrations" : "/member/registrations"} 
                    className="text-gray-600 hover:text-primary-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Registrations
                  </Link>
                  <Link 
                    to="/committee/verify" 
                    className="text-gray-600 hover:text-primary-600 transition-colors flex items-center space-x-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <QrCode className="h-4 w-4" />
                    <span>Verify QR</span>
                  </Link>
                  <Link 
                    to={isCoordinator() ? "/coordinator/reports" : "/member/reports"} 
                    className="text-gray-600 hover:text-primary-600 transition-colors flex items-center space-x-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Reports</span>
                  </Link>
                </>
              )}

              {isAdmin() && (
                <>
                  <Link 
                    to="/admin/dashboard" 
                    className="text-gray-600 hover:text-primary-600 transition-colors flex items-center space-x-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </Link>
                  <Link 
                    to="/admin/registrations" 
                    className="text-gray-600 hover:text-primary-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Registrations
                  </Link>
                </>
              )}

              {user ? (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-700">{user.name}</span>
                    <span className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-full">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <Link 
                    to="/login" 
                    className="block text-gray-600 hover:text-primary-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/signup" 
                    className="block btn-primary text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

