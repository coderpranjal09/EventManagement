import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { coordinatorAPI } from "../utils/api";
import {
  Calendar,
  Users,
  UserPlus,
  BarChart3,
  Clock,
  MapPin,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";

const CoordinatorDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState("");
  const [roleChangeLoading, setRoleChangeLoading] = useState("");

  useEffect(() => {
    fetchDashboardData();
    fetchAvailableMembers();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await coordinatorAPI.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      toast.error("Failed to fetch dashboard data");
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMembers = async () => {
    try {
      const response = await coordinatorAPI.getAvailableMembers();
      const data = response.data;

      if (Array.isArray(data)) {
        setAvailableMembers(data);
      } else if (Array.isArray(data.members)) {
        setAvailableMembers(data.members);
      } else {
        setAvailableMembers([]);
      }
    } catch (error) {
      console.error("Error fetching available members:", error);
      toast.error("Failed to fetch available members");
      setAvailableMembers([]);
    }
  };

  const addMember = async () => {
    if (!selectedMember) {
      toast.error("Please select a member");
      return;
    }

    try {
      await coordinatorAPI.addMember({
        committeeId: dashboardData.committees[0]._id,
        memberId: selectedMember,
      });
      toast.success("Member added successfully");
      setSelectedMember("");
      fetchDashboardData();
      fetchAvailableMembers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add member");
    }
  };

  const removeMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) {
      return;
    }

    try {
      await coordinatorAPI.removeMember({
        committeeId: dashboardData.committees[0]._id,
        memberId,
      });
      toast.success("Member removed successfully");
      fetchDashboardData();
      fetchAvailableMembers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove member");
    }
  };

  const changeMemberRole = async (userId, currentRole) => {
    setRoleChangeLoading(userId);
    const newRole = currentRole === "member" ? "coordinator" : "member";

    try {
      await coordinatorAPI.updateMemberRole({
        committeeId: dashboardData.committees[0]._id,
        memberId: userId,
        role: newRole,
      });
      toast.success("Role updated successfully");
      fetchDashboardData();
      fetchAvailableMembers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update role");
    } finally {
      setRoleChangeLoading("");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No committee data found</p>
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
            Coordinator Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, {user?.name || "Coordinator"}! Manage your committee
            and events.
          </p>
        </div>

        {/* Committees Info */}
        {dashboardData.committees && dashboardData.committees.length > 0 ? (
          dashboardData.committees.map((committee) => (
            <div
              key={committee._id}
              className="bg-white rounded-lg shadow-md p-6 mb-8"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                {committee.name}
              </h2>
              <p className="text-gray-600 mb-4">{committee.description}</p>
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Users className="h-4 w-4 mr-1" />
                {committee.memberCount} members
              </div>

              {/* Members list */}
              {committee.members && committee.members.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Members:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {committee.members.map((member) => (
                      <span
                        key={member._id}
                        className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-full"
                      >
                        {member.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500 mb-8">No committees assigned yet</p>
        )}

        {/* Member Management */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Manage Members
          </h3>

          {/* Add Member */}
          <div className="mb-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add New Member
                </label>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a member</option>
                  {Array.isArray(availableMembers) &&
                    availableMembers.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                </select>
              </div>
              <button
                onClick={addMember}
                disabled={!selectedMember}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>

        {/* Events */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Assigned Events
          </h3>

          {dashboardData.events && dashboardData.events.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dashboardData.events.map((event) => (
                <div
                  key={event._id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {event.title}
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {formatDate(event.dateTime)}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.venue}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      ₹{event.fee}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      {event.registrationCount} registrations
                    </div>
                    <div className="flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      {event.attendanceCount} present
                    </div>
                  </div>

                  {/* Assigned Members */}
                  {event.committeeMembers &&
                    event.committeeMembers.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-2">
                          Assigned Members:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {event.committeeMembers.map((member) => (
                            <span
                              key={member._id}
                              className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-full"
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
            <p className="text-gray-500">No events assigned yet</p>
          )}
        </div>

        {/* Recent Registrations */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Recent Registrations
          </h3>

          {dashboardData.recentRegistrations &&
          dashboardData.recentRegistrations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leader
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.recentRegistrations.map((registration) => (
                    <tr key={registration._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {registration.eventId?.title || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registration.leaderId?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(registration.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            registration.paymentStatus === "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {registration.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No recent registrations</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoordinatorDashboard;
