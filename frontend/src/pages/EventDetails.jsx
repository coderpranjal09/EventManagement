import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { eventsAPI, registrationsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  ArrowLeft, 
  CheckCircle,
  UserPlus,
  Package
} from 'lucide-react';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [groupMembers, setGroupMembers] = useState(['']);
  const [registrationData, setRegistrationData] = useState(null);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await eventsAPI.getEvent(id);
      setEvent(response.data);
    } catch (error) {
      toast.error('Failed to fetch event details');
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
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

  const handleGroupMemberChange = (index, value) => {
    const newMembers = [...groupMembers];
    newMembers[index] = value;
    setGroupMembers(newMembers);
  };

  const addGroupMember = () => {
    if (groupMembers.length < event.maxGroupSize - 1) {
      setGroupMembers([...groupMembers, '']);
    }
  };

  const removeGroupMember = (index) => {
    if (groupMembers.length > 1) {
      const newMembers = groupMembers.filter((_, i) => i !== index);
      setGroupMembers(newMembers);
    }
  };

  const handleRegistration = async () => {
    if (!user) {
      toast.error('Please login to register for events');
      navigate('/login');
      return;
    }

    setRegistering(true);

    try {
      const registrationData = {
        packageId: selectedPackage || null,
        groupMembers: event.isGroup && groupMembers.length > 0 
          ? groupMembers.filter(email => email.trim() !== '')
          : []
      };

      const response = await registrationsAPI.registerForEvent(id, registrationData);
      
      setRegistrationData(response.data);
      toast.success('Registration successful!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const calculateTotalAmount = () => {
    if (!event) return 0;
    
    if (selectedPackage && event.packages.length > 0) {
      const pkg = event.packages.find(p => p._id === selectedPackage);
      return pkg ? pkg.price : event.fee;
    }
    
    return event.fee;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Event not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The event you're looking for doesn't exist or has been removed.
        </p>
      </div>
    );
  }

  if (registrationData) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Registration Successful!
          </h2>
          <p className="text-gray-600 mb-6">
            You have successfully registered for <strong>{event.title}</strong>
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Registration Details</h3>
            <p className="text-sm text-gray-600">
              <strong>Total Amount:</strong> ₹{registrationData.totalAmount}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Payment Status:</strong> {registrationData.paymentStatus}
            </p>
            <p className="text-sm text-gray-600">
              <strong>QR Code:</strong> {registrationData.qrCode}
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/my-registrations')}
              className="btn-primary flex-1"
            >
              View My Registrations
            </button>
            <button
              onClick={() => navigate('/events')}
              className="btn-secondary flex-1"
            >
              Browse More Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/events')}
        className="flex items-center text-gray-600 hover:text-primary-600 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Events
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Event Details */}
        <div className="lg:col-span-2">
          <div className="card">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {event.title}
            </h1>

            <div className="space-y-4 mb-6">
              <div className="flex items-center text-gray-600">
                <Calendar className="h-5 w-5 mr-3" />
                <span>{formatDate(event.dateTime)}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className="h-5 w-5 mr-3" />
                <span>{event.venue}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Users className="h-5 w-5 mr-3" />
                <span>
                  {event.isGroup 
                    ? `Group Event (Max ${event.maxGroupSize} members)`
                    : 'Individual Event'
                  }
                </span>
              </div>
              <div className="flex items-center text-gray-600">
                <DollarSign className="h-5 w-5 mr-3" />
                <span>Entry Fee: ₹{event.fee}</span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {event.rules && event.rules.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Rules</h3>
                <ul className="space-y-2">
                  {event.rules.map((rule, index) => (
                    <li key={index} className="flex items-start text-gray-600">
                      <span className="mr-2">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Registration Form */}
        <div className="lg:col-span-1">
          <div className="card sticky top-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Register for this Event
            </h3>

            {event.packages && event.packages.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Package
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="package"
                      value=""
                      checked={selectedPackage === ''}
                      onChange={(e) => setSelectedPackage(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      Standard (₹{event.fee})
                    </span>
                  </label>
                  {event.packages.map((pkg) => (
                    <label key={pkg._id} className="flex items-center">
                      <input
                        type="radio"
                        name="package"
                        value={pkg._id}
                        checked={selectedPackage === pkg._id}
                        onChange={(e) => setSelectedPackage(e.target.value)}
                        className="mr-2"
                      />
                      <div className="text-sm">
                        <div className="text-gray-700 font-medium">{pkg.name}</div>
                        <div className="text-gray-500">₹{pkg.price}</div>
                        {pkg.description && (
                          <div className="text-xs text-gray-400">{pkg.description}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {event.isGroup && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Members (Optional)
                </label>
                <div className="space-y-2">
                  {groupMembers.map((member, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="email"
                        placeholder="Member email"
                        value={member}
                        onChange={(e) => handleGroupMemberChange(index, e.target.value)}
                        className="input-field flex-1"
                      />
                      {groupMembers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeGroupMember(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {groupMembers.length < event.maxGroupSize - 1 && (
                    <button
                      type="button"
                      onClick={addGroupMember}
                      className="flex items-center text-sm text-primary-600 hover:text-primary-800"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add Member
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum {event.maxGroupSize} members including yourself
                </p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Total Amount:</span>
                <span className="text-lg font-bold text-primary-600">
                  ₹{calculateTotalAmount()}
                </span>
              </div>
            </div>

            <button
              onClick={handleRegistration}
              disabled={registering}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registering ? 'Registering...' : 'Register Now'}
            </button>

            {!user && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                Please <a href="/login" className="text-primary-600 hover:underline">login</a> to register
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;

