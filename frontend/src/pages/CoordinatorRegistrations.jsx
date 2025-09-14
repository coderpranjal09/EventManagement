import React, { useEffect, useState } from 'react';
import { coordinatorAPI, eventsAPI } from '../utils/api';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';

const CoordinatorRegistrations = () => {
  const [events, setEvents] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ q: '', eventId: '', paymentStatus: '' });

  useEffect(() => {
    (async () => {
      try {
        const ev = await eventsAPI.getEvents();
        setEvents(ev.data || []);
      } catch (e) {
        setEvents([]);
      }
      fetchData();
    })();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await coordinatorAPI.searchRegistrations({
        q: filters.q || undefined,
        eventId: filters.eventId || undefined,
        paymentStatus: filters.paymentStatus || undefined,
      });
      setRows(res.data || []);
    } catch (e) {
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Committee Registrations</h1>
        <p className="text-gray-600">Search and filter registrations for your committee's events.</p>
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              className="input-field w-full"
              placeholder="Search by event, leader name or email"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
          </div>
          <div>
            <select
              className="input-field w-full"
              value={filters.eventId}
              onChange={(e) => setFilters({ ...filters, eventId: e.target.value })}
            >
              <option value="">All events</option>
              {events.map(ev => (
                <option key={ev._id} value={ev._id}>{ev.title}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              className="input-field w-full"
              value={filters.paymentStatus}
              onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
            >
              <option value="">Any payment status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary w-full" onClick={() => { setFilters({ q: '', eventId: '', paymentStatus: '' }); setTimeout(fetchData, 0); }}>Reset</button>
            <button className="btn-primary w-full" onClick={fetchData}>Apply</button>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leader</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map(r => (
                  <tr key={r._id}>
                    <td className="px-3 py-2 text-sm text-gray-900">{r.event.title}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{r.leader.name}</td>
                    <td className="px-3 py-2 text-sm text-gray-500">{r.leader.email}</td>
                    <td className="px-3 py-2 text-sm text-gray-500">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2 text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${r.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{r.paymentStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoordinatorRegistrations;


