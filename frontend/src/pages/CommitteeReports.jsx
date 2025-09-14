import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { committeeAPI, registrationsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { Calendar, Users, CheckCircle, Clock, Download, BarChart3, Search } from 'lucide-react';

const downloadCSV = (rows, filename) => {
  const header = Object.keys(rows[0] || {});
  const csv = [header.join(','), ...rows.map(r => header.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const CommitteeReports = () => {
  const { user } = useAuth();
  const [committeeId, setCommitteeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchReports = async () => {
    if (!committeeId.trim()) {
      toast.error('Enter a committee ID');
      return;
    }
    setLoading(true);
    try {
      const res = await committeeAPI.getDashboard(committeeId.trim());
      setData(res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to fetch committee reports');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const attendanceRate = useMemo(() => {
    if (!data) return 0;
    const total = data.totalRegistrations || 0;
    const present = data.totalAttendance || 0;
    return total ? Math.round((present / total) * 100) : 0;
  }, [data]);

  const exportParticipants = () => {
    if (!data) return;
    const rows = (data.events || []).flatMap(ev => ({
      Event: ev.title,
      Date: new Date(ev.dateTime).toISOString(),
      Venue: ev.venue,
      Registrations: ev.registrationCount,
      Attendance: ev.attendanceCount
    }));
    if (rows.length === 0) {
      toast.error('No data to export');
      return;
    }
    downloadCSV(rows, 'committee_events_report.csv');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Committee Reports</h1>
        <p className="text-gray-600">View registrations, attendance and export CSVs for assigned events</p>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-end md:space-x-3 space-y-3 md:space-y-0">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Committee ID</label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter committee ID"
              value={committeeId}
              onChange={(e) => setCommitteeId(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Ask admin for your committee ID. Data is limited to assigned events.</p>
          </div>
          <button onClick={fetchReports} disabled={loading} className="btn-primary whitespace-nowrap">
            {loading ? 'Loading...' : 'Load Reports'}
          </button>
          <button onClick={exportParticipants} disabled={!data} className="btn-secondary whitespace-nowrap">
            <Download className="h-4 w-4 mr-1 inline" /> Export CSV
          </button>
        </div>
      </div>

      {!data ? (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No data</h3>
          <p className="mt-1 text-sm text-gray-500">Enter a committee ID and click Load Reports.</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Events</p>
                  <p className="text-2xl font-bold text-gray-900">{data.totalEvents}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Registrations</p>
                  <p className="text-2xl font-bold text-gray-900">{data.totalRegistrations}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Attendance</p>
                  <p className="text-2xl font-bold text-gray-900">{data.totalAttendance}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{attendanceRate}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Events Table */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Assigned Events</h2>
            <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle px-4 sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Registrations</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(data.events || []).map((ev) => (
                      <tr key={ev._id}>
                        <td className="px-3 py-2 text-sm text-gray-900">{ev.title}</td>
                        <td className="px-3 py-2 text-sm text-gray-500">{new Date(ev.dateTime).toLocaleString()}</td>
                        <td className="px-3 py-2 text-sm text-gray-500">{ev.venue}</td>
                        <td className="px-3 py-2 text-sm text-right text-gray-900">{ev.registrationCount}</td>
                        <td className="px-3 py-2 text-sm text-right text-green-700">{ev.attendanceCount}</td>
                        <td className="px-3 py-2 text-sm text-right text-yellow-700">{Math.max(0, ev.registrationCount - ev.attendanceCount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CommitteeReports;

