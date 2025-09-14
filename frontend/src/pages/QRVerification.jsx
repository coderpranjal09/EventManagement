import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { verificationAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { 
  QrCode, 
  Search, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Clock
} from 'lucide-react';

const QRVerification = () => {
  const { user } = useAuth();
  const [qrCode, setQrCode] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [notes, setNotes] = useState('');
  const [submittingAttendance, setSubmittingAttendance] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [detectorSupported, setDetectorSupported] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);

  useEffect(() => {
    setDetectorSupported('BarcodeDetector' in window);
    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const startScanner = async () => {
    setCameraError('');
    if (!('BarcodeDetector' in window)) {
      setCameraError('BarcodeDetector not supported. Use Chrome/Edge over localhost/HTTPS, or enter code manually.');
      return;
    }
    try {
      detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        scanFrame();
      }
    } catch (err) {
      setCameraError('Camera access denied or not available. You can type the code manually.');
    }
  };

  const scanFrame = async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    try {
      const barcodes = await detectorRef.current.detect(videoRef.current);
      if (barcodes && barcodes.length > 0) {
        const text = barcodes[0].rawValue || barcodes[0].raw || '';
        if (text) {
          setQrCode(text);
          setIsScanning(false);
          stopScanner();
          verifyValue(text);
          return;
        }
      }
    } catch (e) {
      // ignore per-frame decode errors
    }
    rafRef.current = requestAnimationFrame(scanFrame);
  };

  const verifyValue = async (value) => {
    if (!value || !value.trim()) {
      toast.error('QR code is empty');
      return;
    }
    setLoading(true);
    try {
      const response = await verificationAPI.verifyQR(value.trim());
      setVerificationResult(response.data);
      toast.success('QR code verified successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
      setVerificationResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    await verifyValue(qrCode);
  };

  const handleMarkAttendance = async (participantId) => {
    if (!verificationResult) return;

    setSubmittingAttendance(true);
    try {
      await verificationAPI.markAttendance({
        registrationId: verificationResult.registration.id,
        participantId: participantId,
        status: attendanceStatus,
        notes: notes.trim() || undefined
      });
      
      toast.success(`Attendance marked as ${attendanceStatus}`);
      setNotes('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setSubmittingAttendance(false);
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

  const resetForm = () => {
    setQrCode('');
    setVerificationResult(null);
    setAttendanceStatus('present');
    setNotes('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          QR Code Verification
        </h1>
        <p className="text-gray-600">
          Scan or enter QR codes to verify participants and mark attendance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* QR Code Input */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Enter QR Code
          </h2>

          {/* Scanner */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-700">Camera Scanner</span>
              <button
                type="button"
                onClick={async () => {
                  if (!isScanning) {
                    setIsScanning(true);
                    await startScanner();
                  } else {
                    setIsScanning(false);
                    stopScanner();
                  }
                }}
                className={`text-sm ${isScanning ? 'btn-secondary' : 'btn-primary'}`}
              >
                {isScanning ? 'Stop Scanning' : 'Start Scanning'}
              </button>
            </div>
            {cameraError && (
              <div className="text-xs text-red-600 mb-2">{cameraError}</div>
            )}
            {isScanning && (
              <div className="rounded-lg overflow-hidden border border-gray-200">
                {!detectorSupported ? (
                  <div className="p-3 text-sm text-red-600">
                    BarcodeDetector not supported on this browser. Use Chrome/Edge over localhost/HTTPS, or enter the code manually.
                  </div>
                ) : (
                  <div className="w-full">
                    <video ref={videoRef} className="w-full h-64 object-cover" muted playsInline />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">Tip: On mobile, ensure camera permission is allowed. Works on localhost or HTTPS.</p>
          </div>
          
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="qrCode" className="block text-sm font-medium text-gray-700 mb-2">
                QR Code Data
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <QrCode className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="qrCode"
                  type="text"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="Enter QR code data or scan QR code"
                  className="input-field pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading || !qrCode.trim()}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify QR Code'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setQrCode('');
                  setVerificationResult(null);
                }}
                className="btn-secondary"
              >
                Clear
              </button>
            </div>
          </form>

          {/* Attendance Marking */}
          {verificationResult && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Mark Attendance
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attendance Status
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="attendanceStatus"
                        value="present"
                        checked={attendanceStatus === 'present'}
                        onChange={(e) => setAttendanceStatus(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Present</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="attendanceStatus"
                        value="absent"
                        checked={attendanceStatus === 'absent'}
                        onChange={(e) => setAttendanceStatus(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Absent</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about attendance..."
                    className="input-field"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Verification Result */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Verification Result
          </h2>

          {!verificationResult ? (
            <div className="text-center py-8">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No verification yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Enter a QR code to see participant details
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Event Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Event Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(verificationResult.registration.event.dateTime)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {verificationResult.registration.event.venue}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Amount: ₹{verificationResult.registration.totalAmount}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-4 h-4 mr-2 flex items-center justify-center">
                      {verificationResult.registration.paymentStatus === 'paid' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                    </span>
                    Payment: {verificationResult.registration.paymentStatus}
                  </div>
                </div>
              </div>

              {/* Leader Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Group Leader
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-8 w-8 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {verificationResult.registration.leader.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {verificationResult.registration.leader.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {verificationResult.registration.leader.collegeId} • {verificationResult.registration.leader.year}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleMarkAttendance(verificationResult.registration.leader._id)}
                    disabled={submittingAttendance}
                    className="mt-3 w-full btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingAttendance ? 'Marking...' : `Mark ${attendanceStatus === 'present' ? 'Present' : 'Absent'}`}
                  </button>
                </div>
              </div>

              {/* Group Members */}
              {verificationResult.registration.groupMembers && 
               verificationResult.registration.groupMembers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Group Members
                  </h3>
                  <div className="space-y-3">
                    {verificationResult.registration.groupMembers.map((member, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <Users className="h-6 w-6 text-gray-400" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {member.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {member.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.collegeId} • {member.year}
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleMarkAttendance(member._id)}
                          disabled={submittingAttendance}
                          className="mt-3 w-full btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingAttendance ? 'Marking...' : `Mark ${attendanceStatus === 'present' ? 'Present' : 'Absent'}`}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRVerification;

