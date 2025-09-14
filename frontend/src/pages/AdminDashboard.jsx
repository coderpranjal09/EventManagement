import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { adminAPI, eventsAPI, committeeAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  BarChart3,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  UserCheck,
  Clock
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', collegeId: '', year: '' });
  const [roleAssignment, setRoleAssignment] = useState({ userId: '', role: '', committeeId: '' });

  const [showEventForm, setShowEventForm] = useState(false);
  const [showCommitteeForm, setShowCommitteeForm] = useState(false);

  const eventSectionRef = useRef(null);
  const committeeSectionRef = useRef(null);

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    committeeId: '',
    dateTime: '',
    venue: '',
    fee: 0,
    isGroup: false,
    maxGroupSize: 1
  });

  const [newCommittee, setNewCommittee] = useState({
    name: '',
    description: ''
  });

  const [editingEvent, setEditingEvent] = useState(null);
  const [editingCommittee, setEditingCommittee] = useState(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      // Load stats
      try {
        const s = await adminAPI.getStats();
        setStats(s.data);
      } catch (e) {
        // Fallback silently if stats endpoint not ready
        setStats(null);
      }
      // Load committees (admin only)
      try {
        const c = await committeeAPI.getCommittees();
        setCommittees(c.data || []);
      } catch (e) {
        setCommittees([]);
      }
      // Load events
      try {
        const ev = await eventsAPI.getEvents();
        setEvents(ev.data || []);
      } catch (e) {
        setEvents([]);
      }
      // Load users
      try {
        setLoadingUsers(true);
        const u = await adminAPI.listUsers();
        setUsers(u.data || []);
      } catch (e) {
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    } finally {
      setLoading(false);
    }
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

  const createEvent = async () => {
    try {
      if (!newEvent.title || !newEvent.description || !newEvent.venue || !newEvent.dateTime || !newEvent.committeeId) {
        toast.error('Please fill all required fields');
        return;
      }
      const payload = {
        title: newEvent.title,
        description: newEvent.description,
        committeeId: newEvent.committeeId,
        dateTime: new Date(newEvent.dateTime).toISOString(),
        venue: newEvent.venue,
        fee: Number(newEvent.fee) || 0,
        isGroup: Boolean(newEvent.isGroup),
        maxGroupSize: Number(newEvent.maxGroupSize) || 1,
        packages: [],
        rules: []
      };
      const res = await eventsAPI.createEvent(payload);
      const created = res.data;
      toast.success('Event created');
      setEvents([created, ...events]);
      setShowEventForm(false);
      setNewEvent({ title: '', description: '', committeeId: '', dateTime: '', venue: '', fee: 0, isGroup: false, maxGroupSize: 1 });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create event');
    }
  };

  const updateEvent = async () => {
    if (!editingEvent) return;
    try {
      const id = editingEvent._id;
      const payload = {
        title: editingEvent.title,
        description: editingEvent.description,
        dateTime: editingEvent.dateTime,
        venue: editingEvent.venue,
        fee: Number(editingEvent.fee) || 0,
        isGroup: Boolean(editingEvent.isGroup),
        maxGroupSize: Number(editingEvent.maxGroupSize) || 1
      };
      const res = await eventsAPI.updateEvent(id, payload);
      const updated = res.data;
      setEvents(events.map(e => (e._id === id ? updated : e)));
      toast.success('Event updated');
      setEditingEvent(null);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update event');
    }
  };

  const deleteEvent = async (id) => {
    try {
      await eventsAPI.deleteEvent(id);
      setEvents(events.filter(e => e._id !== id));
      toast.success('Event deleted');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete event');
    }
  };

  const createCommittee = async () => {
    try {
      if (!newCommittee.name) {
        toast.error('Committee name is required');
        return;
      }
      const res = await committeeAPI.createCommittee({ name: newCommittee.name, description: newCommittee.description });
      const created = res.data;
      toast.success('Committee created');
      setCommittees([created, ...committees]);
      setShowCommitteeForm(false);
      setNewCommittee({ name: '', description: '' });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create committee');
    }
  };

  const updateCommittee = async () => {
    if (!editingCommittee) return;
    try {
      const id = editingCommittee._id;
      const payload = { name: editingCommittee.name, description: editingCommittee.description };
      const res = await committeeAPI.updateCommittee(id, payload);
      const updated = res.data;
      setCommittees(committees.map(c => (c._id === id ? updated : c)));
      toast.success('Committee updated');
      setEditingCommittee(null);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update committee');
    }
  };

  const deleteCommittee = async (id) => {
    try {
      await committeeAPI.deleteCommittee(id);
      setCommittees(committees.filter(c => c._id !== id));
      toast.success('Committee deleted');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete committee');
    }
  };

  const changeUserRole = async (userId, role, committeeId = null) => {
    try {
      const res = await adminAPI.updateUserRole(userId, role, committeeId);
      const updated = res.data;
      setUsers(users.map(u => (u._id === userId ? updated : u)));
      toast.success('Role updated');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update role');
    }
  };

  const assignUserRole = async () => {
    try {
      if (!roleAssignment.userId || !roleAssignment.role) {
        toast.error('Select both user and role');
        return;
      }
      if ((roleAssignment.role === 'coordinator' || roleAssignment.role === 'member') && !roleAssignment.committeeId) {
        toast.error('Use above menu to assign user to a committee');
        return;
      }
      const res = await adminAPI.updateUserRole(roleAssignment.userId, roleAssignment.role, roleAssignment.committeeId);
      const updated = res.data;
      setUsers(users.map(u => (u._id === roleAssignment.userId ? updated : u)));
      toast.success('Role updated');
      setRoleAssignment({ userId: '', role: '', committeeId: '' });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Role assignment failed');
    }
  };


  const handleExportParticipants = async () => {
    try {
      const res = await api.get('/admin/export/participants', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'participants_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to export data');
    }
  };

  const handleExportAttendance = async () => {
    try {
      const res = await api.get('/admin/export/attendance', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'attendance_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage events, committees, and view system statistics
        </p>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input className="input-field w-full" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input className="input-field w-full" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">College ID</label>
                  <input className="input-field w-full" value={editForm.collegeId} onChange={e => setEditForm({ ...editForm, collegeId: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input className="input-field w-full" value={editForm.year} onChange={e => setEditForm({ ...editForm, year: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={async () => {
                  try {
                    const res = await adminAPI.updateUser(editingUser._id, editForm);
                    const updated = res.data;
                    setUsers(users.map(x => (x._id === updated._id ? updated : x)));
                    toast.success('User updated');
                    setEditingUser(null);
                  } catch (e) {
                    toast.error(e.response?.data?.message || 'Failed to update user');
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.overview.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.overview.totalEvents}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Registrations</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.overview.totalRegistrations}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Committees</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.overview.totalCommittees}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors" onClick={() => { setShowEventForm(true); setTimeout(() => eventSectionRef.current?.scrollIntoView({ behavior: 'smooth' }), 0); }}>
            <Plus className="h-6 w-6 text-primary-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Create Event</div>
              <div className="text-sm text-gray-600">Add a new event</div>
            </div>
          </button>

          <button className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors" onClick={() => { setShowCommitteeForm(true); setTimeout(() => committeeSectionRef.current?.scrollIntoView({ behavior: 'smooth' }), 0); }}>
            <Users className="h-6 w-6 text-green-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Manage Committees</div>
              <div className="text-sm text-gray-600">Add or edit committees</div>
            </div>
          </button>

          <button 
            onClick={handleExportParticipants}
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Download className="h-6 w-6 text-blue-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Export Participants</div>
              <div className="text-sm text-gray-600">Download CSV data</div>
            </div>
          </button>

          <button 
            onClick={handleExportAttendance}
            className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <Download className="h-6 w-6 text-yellow-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Export Attendance</div>
              <div className="text-sm text-gray-600">Download CSV data</div>
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Events Management */}
        <div className="card" ref={eventSectionRef}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Events</h2>
            <button className="btn-primary text-sm" onClick={() => setShowEventForm(v => !v)}>
              <Plus className="h-4 w-4 mr-1" />
              {showEventForm ? 'Close' : 'Add Event'}
            </button>
          </div>

          {showEventForm && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="input-field" placeholder="Title" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
              <input className="input-field" placeholder="Venue" value={newEvent.venue} onChange={e => setNewEvent({ ...newEvent, venue: e.target.value })} />
              <div>
                <label className="block text-sm text-gray-700 mb-1">Committee</label>
                <select className="input-field" value={newEvent.committeeId} onChange={e => setNewEvent({ ...newEvent, committeeId: e.target.value })}>
                  <option value="">Select committee</option>
                  {committees.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <input className="input-field" type="datetime-local" placeholder="Date & Time" value={newEvent.dateTime} onChange={e => setNewEvent({ ...newEvent, dateTime: e.target.value })} />
              <input className="input-field" type="number" placeholder="Fee" value={newEvent.fee} onChange={e => setNewEvent({ ...newEvent, fee: e.target.value })} />
              <textarea className="input-field md:col-span-2" placeholder="Description" value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 text-sm text-gray-700">
                  <input type="checkbox" checked={newEvent.isGroup} onChange={e => setNewEvent({ ...newEvent, isGroup: e.target.checked })} />
                  <span>Group Event</span>
                </label>
                <input className="input-field" type="number" min={1} value={newEvent.maxGroupSize} onChange={e => setNewEvent({ ...newEvent, maxGroupSize: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <button className="btn-primary" onClick={createEvent}>Create Event</button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {events.map((event) => (
              <div key={event._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{event.title}</h3>
                  <div className="flex space-x-2">
                    <button className="text-gray-400 hover:text-gray-600" onClick={() => window.open(`/events/${event._id}`, '_self')}>
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-gray-400 hover:text-gray-600" onClick={() => setEditingEvent({ ...event, dateTime: new Date(event.dateTime).toISOString().slice(0,16) })}>
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-400 hover:text-red-600" onClick={() => deleteEvent(event._id)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(event.dateTime)}
                  <span className="mx-2">•</span>
                  <span>{event.venue}</span>
                  <span className="mx-2">•</span>
                  <span>₹{event.fee}</span>
                </div>


                {editingEvent && editingEvent._id === event._id && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input className="input-field" value={editingEvent.title} onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })} />
                    <input className="input-field" value={editingEvent.venue} onChange={e => setEditingEvent({ ...editingEvent, venue: e.target.value })} />
                    <input className="input-field" type="datetime-local" value={editingEvent.dateTime} onChange={e => setEditingEvent({ ...editingEvent, dateTime: e.target.value })} />
                    <input className="input-field" type="number" value={editingEvent.fee} onChange={e => setEditingEvent({ ...editingEvent, fee: e.target.value })} />
                    <textarea className="input-field md:col-span-2" value={editingEvent.description} onChange={e => setEditingEvent({ ...editingEvent, description: e.target.value })} />
                    <label className="flex items-center space-x-2 text-sm text-gray-700">
                      <input type="checkbox" checked={!!editingEvent.isGroup} onChange={e => setEditingEvent({ ...editingEvent, isGroup: e.target.checked })} />
                      <span>Group Event</span>
                    </label>
                    <input className="input-field" type="number" min={1} value={editingEvent.maxGroupSize} onChange={e => setEditingEvent({ ...editingEvent, maxGroupSize: e.target.value })} />
                    <div className="md:col-span-2 flex space-x-2">
                      <button className="btn-primary" onClick={updateEvent}>Save</button>
                      <button className="btn-secondary" onClick={() => setEditingEvent(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Committees Management */}
        <div className="card" ref={committeeSectionRef}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Committees</h2>
            <button className="btn-primary text-sm" onClick={() => setShowCommitteeForm(v => !v)}>
              <Plus className="h-4 w-4 mr-1" />
              {showCommitteeForm ? 'Close' : 'Add Committee'}
            </button>
          </div>

          {showCommitteeForm && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="input-field md:col-span-2" placeholder="Committee Name" value={newCommittee.name} onChange={e => setNewCommittee({ ...newCommittee, name: e.target.value })} />
              <input className="input-field md:col-span-2" placeholder="Description (optional)" value={newCommittee.description} onChange={e => setNewCommittee({ ...newCommittee, description: e.target.value })} />
              <div className="md:col-span-2">
                <button className="btn-primary" onClick={createCommittee}>Create Committee</button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {committees.map((committee) => (
              <div key={committee._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{committee.name}</h3>
                  <div className="flex space-x-2">
                    <button className="text-gray-400 hover:text-gray-600" onClick={() => setEditingCommittee({ ...committee })}>
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-400 hover:text-red-600" onClick={() => deleteCommittee(committee._id)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{committee.description}</p>
                <div className="text-sm text-gray-500">
                  <div>Members: {committee.memberIds?.length || 0}</div>
                  <div>Events: {committee.assignedEventIds?.length || 0}</div>
                </div>

                {editingCommittee && editingCommittee._id === committee._id && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input className="input-field md:col-span-2" value={editingCommittee.name} onChange={e => setEditingCommittee({ ...editingCommittee, name: e.target.value })} />
                    <textarea className="input-field md:col-span-2" value={editingCommittee.description || ''} onChange={e => setEditingCommittee({ ...editingCommittee, description: e.target.value })} />
                    <div className="md:col-span-2 flex space-x-2">
                      <button className="btn-primary" onClick={updateCommittee}>Save</button>
                      <button className="btn-secondary" onClick={() => setEditingCommittee(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Users Management */}
      <div className="card mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Users</h2>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <select className="input-field" value={roleAssignment.userId} onChange={e => setRoleAssignment({ ...roleAssignment, userId: e.target.value })}>
              <option value="">Select user</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select className="input-field" value={roleAssignment.role} onChange={e => setRoleAssignment({ ...roleAssignment, role: e.target.value, committeeId: '' })}>
              <option value="">Select role</option>
              <option value="student">Student</option>
              <option value="coordinator">Coordinator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {(roleAssignment.role === 'coordinator') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Committee</label>
              <select className="input-field" value={roleAssignment.committeeId} onChange={e => setRoleAssignment({ ...roleAssignment, committeeId: e.target.value })}>
                <option value="">Select committee</option>
                {committees.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <button className="btn-primary" onClick={assignUserRole}>Assign Role</button>
          </div>
        </div>

        {/* Users header with search */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Users</h3>
          <input
            type="text"
            placeholder="Search by name or email..."
            className="input-field w-64"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle px-4 sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Committee</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.filter(u => {
                  const q = userQuery.trim().toLowerCase();
                  if (!q) return true;
                  return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
                }).map(u => (
                  <tr key={u._id}>
                    <td className="px-3 py-2 text-sm text-gray-900">{u.name}</td>
                    <td className="px-3 py-2 text-sm text-gray-500">{u.email}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        u.role === 'admin' ? 'bg-red-100 text-red-800' :
                        u.role === 'coordinator' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'member' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {/* Primary committee (legacy single link) */}
                      <div>
                        <span className="text-gray-600">Primary:</span> {u.committeeId ? u.committeeId.name : 'None'}
                      </div>
                      {/* Multiple associations */}
                      {(u.coordinatorOf?.length > 0) && (
                        <div className="mt-1">
                          <span className="text-purple-700 text-xs font-medium">Coordinator of:</span>
                          <span className="text-xs ml-1">{u.coordinatorOf.map(c => c.name).join(', ')}</span>
                        </div>
                      )}
                      {(u.memberOf?.length > 0) && (
                        <div className="mt-1">
                          <span className="text-green-700 text-xs font-medium">Member of:</span>
                          <span className="text-xs ml-1">{u.memberOf.map(c => c.name).join(', ')}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex flex-wrap items-center gap-1">
                        <button 
                          className={`text-xs px-2 py-1 rounded ${u.role === 'student' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}
                          onClick={() => changeUserRole(u._id, 'student')}
                        >
                          Student
                        </button>
                        <button 
                          className={`text-xs px-2 py-1 rounded ${u.role === 'coordinator' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'}`}
                          onClick={() => {
                            const committeeId = u.committeeId?._id || '';
                            changeUserRole(u._id, 'coordinator', committeeId);
                          }}
                        >
                          Coordinator
                        </button>
                        <button 
                          className={`text-xs px-2 py-1 rounded ${u.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}
                          onClick={() => changeUserRole(u._id, 'admin')}
                        >
                          Admin
                        </button>
                        {/* Edit */}
                        <button
                          className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700"
                          onClick={() => {
                            setEditingUser(u);
                            setEditForm({ name: u.name || '', email: u.email || '', collegeId: u.collegeId || '', year: u.year || '' });
                          }}
                        >
                          Edit
                        </button>
                        {/* Block/Unblock */}
                        <button
                          className={`text-xs px-2 py-1 rounded ${u.isBlocked ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}
                          onClick={async () => {
                            try {
                              const res = await adminAPI.blockUser(u._id, !u.isBlocked);
                              const updated = res.data;
                              setUsers(users.map(x => (x._id === u._id ? updated : x)));
                              toast.success(updated.isBlocked ? 'User blocked' : 'User unblocked');
                            } catch (e) {
                              toast.error(e.response?.data?.message || 'Failed to update block status');
                            }
                          }}
                        >
                          {u.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                        {/* Delete */}
                        <button
                          className="text-xs px-2 py-1 rounded bg-red-50 text-red-700"
                          onClick={async () => {
                            if (!window.confirm('Delete this user? This cannot be undone.')) return;
                            try {
                              await adminAPI.deleteUser(u._id);
                              setUsers(users.filter(x => x._id !== u._id));
                              toast.success('User deleted');
                            } catch (e) {
                              toast.error(e.response?.data?.message || 'Failed to delete user');
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Registrations</h2>
        <div className="space-y-4">
          {stats?.recentRegistrations?.map((registration) => (
            <div key={registration._id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <UserCheck className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{registration?.leaderId?.name || 'Unknown'}</div>
                  <div className="text-sm text-gray-600">{registration?.eventId?.title || 'Unknown Event'}</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(registration.createdAt)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Statistics */}
      <div className="card mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">User Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats?.userStats.map((stat) => (
            <div key={stat._id} className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">{stat.count}</div>
              <div className="text-sm text-gray-600 capitalize">{stat._id}s</div>
            </div>
          ))}
        </div>
      </div>

      {/* Event Statistics */}
      <div className="card mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Event Registration Statistics</h2>
        <div className="space-y-4">
          {stats?.eventStats.map((event, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{event.title}</div>
                <div className="text-sm text-gray-600">{formatDate(event.dateTime)}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600">{event.registrationCount}</div>
                <div className="text-sm text-gray-500">registrations</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
