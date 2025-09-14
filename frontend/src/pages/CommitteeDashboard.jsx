import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { committeeAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  MapPin, 
  Users, 
  BarChart3,
  QrCode,
  Clock,
  CheckCircle
} from 'lucide-react';

const CommitteeDashboard = () => {
  const { user, isAdmin, isCommittee } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [committees, setCommittees] = useState([]);
  const [selectedCommitteeId, setSelectedCommitteeId] = useState('');

  useEffect(() => {
    autoDetect();
  }, [user]);

  const autoDetect = async () => {
    if (!user) return;
    try {
      const res = await committeeAPI.getMine();
      const list = res.data || [];
      setCommittees(list);
      if (list.length > 0) {
        const autoId = list[0]._id;
        setSelectedCommitteeId(autoId);
        fetchDashboardData(autoId);
      } else {
        setDashboardData(null);
      }
    } catch (e) {
      setCommittees([]);
      setDashboardData(null);
    }
  };

  const fetchDashboardData = async (id) => {
    setLoading(true);
    try {
      const response = await committeeAPI.getDashboard(id);
      setDashboardData(response.data);
    } catch (error) {
      setDashboardData(null);
      toast.error(error.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (e) => {
    const id = e.target.value;
    setSelectedCommitteeId(id);
    if (id) fetchDashboardData(id);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAttendancePercentage = (attended, total) => {
    if (total === 0) return 0;
    return Math.round((attended / total) * 100);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Committee Dashboard</h1>
        {isAdmin() && (
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Committee</label>
            <select className="input-field max-w-md" value={selectedCommitteeId} onChange={handleSelect}>
              <option value="">{committees.length ? 'Choose a committee' : 'No committees available'}</option>
              {committees.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
        {isCommittee() && !dashboardData && (
          <p className="text-sm text-gray-500 mt-1">You are not assigned to any committee yet.</p>
        )}
      </div>

      {loading ? (
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : !dashboardData ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No data</h3>
          <p className="mt-1 text-sm text-gray-500">{isAdmin() ? 'Select a committee to view its dashboard.' : 'Ask admin to assign you to a committee.'}</p>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.totalEvents}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.totalRegistrations}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Attendance</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.totalAttendance}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {getAttendancePercentage(dashboardData.totalAttendance, dashboardData.totalRegistrations)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                to="/committee/verify"
                className="flex items-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
              >
                <QrCode className="h-6 w-6 text-primary-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Verify QR Codes</div>
                  <div className="text-sm text-gray-600">Scan and verify participant QR codes</div>
                </div>
              </Link>

              <Link
                to="/events"
                className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Calendar className="h-6 w-6 text-green-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">View All Events</div>
                  <div className="text-sm text-gray-600">Browse all available events</div>
                </div>
              </Link>

              <Link
                to="/committee/reports"
                className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <BarChart3 className="h-6 w-6 text-gray-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">View Reports</div>
                  <div className="text-sm text-gray-600">Open committee reports</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Assigned Events */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Assigned Events</h2>
            
            {dashboardData.events.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No events assigned</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You haven't been assigned to any events yet.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {dashboardData.events.map((event) => (
                  <div key={event._id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {event.title}
                        </h3>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            {formatDate(event.dateTime)}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {event.venue}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Attendance Rate</div>
                        <div className="text-2xl font-bold text-primary-600">
                          {getAttendancePercentage(event.attendanceCount, event.registrationCount)}%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center">
                          <Users className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm text-gray-600">Registrations</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {event.registrationCount}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <div>
                            <div className="text-sm text-gray-600">Present</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {event.attendanceCount}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-50 rounded-lg p-3">
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                          <div>
                            <div className="text-sm text-gray-600">Absent</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {Math.max(0, event.registrationCount - event.attendanceCount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Link
                        to={`/events/${event._id}`}
                        className="btn-secondary text-sm"
                      >
                        View Event Details
                      </Link>
                      <Link
                        to="/committee/verify"
                        className="btn-primary text-sm"
                      >
                        Verify Participants
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CommitteeDashboard;

