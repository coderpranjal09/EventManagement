import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { registrationsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  QrCode, 
  Download,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';
import QRCode from 'qrcode';

const MyRegistrations = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrCodes, setQrCodes] = useState({});

  useEffect(() => {
    if (user) {
      fetchRegistrations();
    }
  }, [user]);

  const fetchRegistrations = async () => {
    try {
      const response = await registrationsAPI.getUserRegistrations(user.id);
      setRegistrations(response.data);
      
      // Generate QR codes for each registration
      const qrCodePromises = response.data.map(async (reg) => {
        try {
          const qrCodeDataURL = await QRCode.toDataURL(reg.qrCode);
          return { id: reg._id, qrCode: qrCodeDataURL };
        } catch (error) {
          console.error('Error generating QR code:', error);
          return { id: reg._id, qrCode: null };
        }
      });
      
      const qrCodeResults = await Promise.all(qrCodePromises);
      const qrCodeMap = {};
      qrCodeResults.forEach(({ id, qrCode }) => {
        qrCodeMap[id] = qrCode;
      });
      setQrCodes(qrCodeMap);
    } catch (error) {
      toast.error('Failed to fetch registrations');
      console.error('Error fetching registrations:', error);
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

  const downloadQRCode = (registrationId, eventTitle) => {
    const qrCodeDataURL = qrCodes[registrationId];
    if (qrCodeDataURL) {
      const link = document.createElement('a');
      link.download = `${eventTitle.replace(/\s+/g, '_')}_QR_Code.png`;
      link.href = qrCodeDataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          My Registrations
        </h1>
        <p className="text-gray-600">
          View and manage your event registrations
        </p>
      </div>

      {registrations.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No registrations found</h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven't registered for any events yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {registrations.map((registration) => (
            <div key={registration._id} className="card">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Event Details */}
                <div className="lg:col-span-2">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {registration.eventId.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(registration.paymentStatus)}`}>
                      {registration.paymentStatus}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(registration.eventId.dateTime)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {registration.eventId.venue}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Total Amount: ₹{registration.totalAmount}
                    </div>
                    {registration.isGroupRegistration && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        Group Registration ({registration.groupMembers.length + 1} members)
                      </div>
                    )}
                  </div>

                  {registration.groupMembers && registration.groupMembers.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Group Members:</h4>
                      <div className="space-y-1">
                        {registration.groupMembers.map((member, index) => (
                          <div key={index} className="text-sm text-gray-600">
                            • {member.name} ({member.email})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-500">
                    Registered on {formatDate(registration.createdAt)}
                  </div>
                </div>

                {/* QR Code */}
                <div className="lg:col-span-1">
                  <div className="text-center">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Your QR Code</h4>
                    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 inline-block">
                      {qrCodes[registration._id] ? (
                        <img
                          src={qrCodes[registration._id]}
                          alt="QR Code"
                          className="w-32 h-32 mx-auto"
                        />
                      ) : (
                        <div className="w-32 h-32 bg-gray-100 rounded flex items-center justify-center">
                          <QrCode className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <button
                        onClick={() => downloadQRCode(registration._id, registration.eventId.title)}
                        className="w-full btn-secondary text-sm flex items-center justify-center space-x-1"
                        disabled={!qrCodes[registration._id]}
                      >
                        <Download className="h-4 w-4" />
                        <span>Download QR</span>
                      </button>
                      
                      <div className="text-xs text-gray-500">
                        Show this QR code at the event venue
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRegistrations;

