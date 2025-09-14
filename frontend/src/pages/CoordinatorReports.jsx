import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { coordinatorAPI } from '../utils/api';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  MapPin,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';

const CoordinatorReports = () => {
  const { user } = useAuth();
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await coordinatorAPI.getReports();
      setReportsData(response.data);
    } catch (error) {
      toast.error('Failed to fetch reports');
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    const csvContent = [
      ['Event', 'Date', 'Venue', 'Fee', 'Registrations', 'Total Participants', 'Present', 'Absent', 'Not Marked'],
      ...data.map(report => [
        report.event.title,
        new Date(report.event.dateTime).toLocaleDateString(),
        report.event.venue,
        report.event.fee,
        report.registrations,
        report.totalParticipants,
        report.attendance.present,
        report.attendance.absent,
        report.attendance.notMarked
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (!reportsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No reports data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Committee Reports
          </h1>
          <p className="text-gray-600">
            View detailed reports for your committee's events and attendance.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{reportsData.summary.totalEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                <p className="text-2xl font-bold text-gray-900">{reportsData.summary.totalRegistrations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Present</p>
                <p className="text-2xl font-bold text-gray-900">{reportsData.summary.totalPresent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-gray-900">{reportsData.summary.attendanceRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="mb-6">
          <button
            onClick={() => exportToCSV(reportsData.eventReports, 'committee_reports.csv')}
            className="btn-primary flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </button>
        </div>

        {/* Event Reports */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Event-wise Reports
          </h3>
          
          {reportsData.eventReports && reportsData.eventReports.length > 0 ? (
            <div className="space-y-6">
              {reportsData.eventReports.map((report, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{report.event.title}</h4>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(report.event.dateTime)}
                        <span className="mx-2">•</span>
                        <MapPin className="h-4 w-4 mr-1" />
                        {report.event.venue}
                        <span className="mx-2">•</span>
                        <DollarSign className="h-4 w-4 mr-1" />
                        ₹{report.event.fee}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Attendance Rate</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {report.totalParticipants > 0 
                          ? ((report.attendance.present / report.totalParticipants) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{report.registrations}</p>
                      <p className="text-sm text-blue-800">Registrations</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{report.attendance.present}</p>
                      <p className="text-sm text-green-800">Present</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{report.attendance.absent}</p>
                      <p className="text-sm text-red-800">Absent</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{report.attendance.notMarked}</p>
                      <p className="text-sm text-yellow-800">Not Marked</p>
                    </div>
                  </div>

                  {/* Assigned Members */}
                  {report.assignedMembers && report.assignedMembers.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Assigned Committee Members:</p>
                      <div className="flex flex-wrap gap-2">
                        {report.assignedMembers.map((member) => (
                          <span
                            key={member._id}
                            className="px-3 py-1 text-sm bg-primary-100 text-primary-800 rounded-full"
                          >
                            {member.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No event reports available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoordinatorReports;
