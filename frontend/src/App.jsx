import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import MyRegistrations from './pages/MyRegistrations';
import CommitteeDashboard from './pages/CommitteeDashboard';
import AdminDashboard from './pages/AdminDashboard';
import QRVerification from './pages/QRVerification';
import CommitteeReports from './pages/CommitteeReports';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import MemberDashboard from './pages/MemberDashboard';
import CoordinatorReports from './pages/CoordinatorReports';
import MemberReports from './pages/MemberReports';
import AdminRegistrations from './pages/AdminRegistrations';
import CoordinatorRegistrations from './pages/CoordinatorRegistrations';
import MemberRegistrations from './pages/MemberRegistrations';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            {/* Public routes */}
            <Route 
              path="/login" 
              element={user ? <Navigate to="/" replace /> : <Login />} 
            />
            <Route 
              path="/signup" 
              element={user ? <Navigate to="/" replace /> : <Signup />} 
            />

            {/* Protected routes */}
            <Route path="/" element={<Events />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetails />} />
            
            <Route 
              path="/my-registrations" 
              element={
                <ProtectedRoute>
                  <MyRegistrations />
                </ProtectedRoute>
              } 
            />

            {/* Coordinator routes */}
            <Route 
              path="/coordinator/dashboard" 
              element={
                <ProtectedRoute allowedRoles={["coordinator"]}>
                  <CoordinatorDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/coordinator/reports" 
              element={
                <ProtectedRoute allowedRoles={["coordinator"]}>
                  <CoordinatorReports />
                </ProtectedRoute>
              } 
            />

            {/* Member routes */}
            <Route 
              path="/member/dashboard" 
              element={
                <ProtectedRoute allowedRoles={["member"]}>
                  <MemberDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/member/reports" 
              element={
                <ProtectedRoute allowedRoles={["member"]}>
                  <MemberReports />
                </ProtectedRoute>
              } 
            />

            {/* Legacy committee routes for backward compatibility */}
            <Route 
              path="/committee/dashboard" 
              element={
                <ProtectedRoute allowedRoles={["coordinator", "member", "admin"]}>
                  <CommitteeDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/committee/verify" 
              element={
                <ProtectedRoute allowedRoles={["coordinator", "member", "admin"]}>
                  <QRVerification />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/committee/reports" 
              element={
                <ProtectedRoute allowedRoles={["coordinator", "member", "admin"]}>
                  <CommitteeReports />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Registrations management */}
            <Route 
              path="/admin/registrations" 
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminRegistrations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/coordinator/registrations" 
              element={
                <ProtectedRoute allowedRoles={["coordinator"]}>
                  <CoordinatorRegistrations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/member/registrations" 
              element={
                <ProtectedRoute allowedRoles={["member"]}>
                  <MemberRegistrations />
                </ProtectedRoute>
              } 
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

