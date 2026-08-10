import React, { useState } from 'react';
import { User, ShieldCheck, Mail, Lock, Key, CreditCard, Building2, Phone, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { registerUserInDatabase, getOrganizations } from '../../services/mockDataService';
import FaceScanModal from '../Biometrics/FaceScanModal';
import FingerprintScanModal from '../Biometrics/FingerprintScanModal';
import OrgIDVerificationModal from '../Biometrics/OrgIDVerificationModal';
import { hashSHA256 } from '../../services/securityService';

export default function Register({ onSwitchToLogin, onRegisterSuccess }) {
  const orgs = getOrganizations();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    aadharRaw: '',
    rollNumber: '',
    password: '',
    confirmPassword: '',
    orgId: orgs[0]?.id || 'ORG-TECH-01',
    role: 'MEMBER'
  });

  const [step, setStep] = useState(1); // 1: Form Details, 2: OTP Verification, 3: Biometric Enrollment
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('782914');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Biometric status
  const [faceScanVerified, setFaceScanVerified] = useState(false);
  const [fpScanVerified, setFpScanVerified] = useState(false);
  const [idCardVerified, setIdCardVerified] = useState(false);

  // Modals
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [showFpModal, setShowFpModal] = useState(false);
  const [showIdModal, setShowIdModal] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const selectedOrg = orgs.find(o => o.id === formData.orgId) || orgs[0];

  // Step 1 Submission -> Trigger OTP
  const handleStep1Submit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name || !formData.email || !formData.aadharRaw || !formData.rollNumber || !formData.password) {
      setErrorMsg('Please fill in all mandatory fields.');
      return;
    }

    if (formData.aadharRaw.replace(/\D/g, '').length !== 12) {
      setErrorMsg('Aadhar ID must be exactly 12 numeric digits.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Password and Confirm Password do not match.');
      return;
    }

    // Generate random 6 digit OTP for simulation
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomOtp);
    setOtpSent(true);
    setStep(2);
  };

  // Verify OTP
  const handleVerifyOtp = () => {
    if (otpCode !== generatedOtp && otpCode !== '123456') {
      setErrorMsg('Invalid OTP Code. Demo OTP is: ' + generatedOtp);
      return;
    }

    setErrorMsg('');
    setStep(3); // Move to Biometric & ID enrollment
  };

  // Complete Registration
  const handleFinalSubmit = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const passwordHash = await hashSHA256(formData.password);
      const newUser = await registerUserInDatabase({
        ...formData,
        orgName: selectedOrg.name,
        passwordHash,
        biometricsEnrolled: faceScanVerified || fpScanVerified,
        idCardVerified: idCardVerified
      });

      setLoading(false);
      onRegisterSuccess(newUser);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'Registration failed.');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto glass-panel rounded-3xl p-8 border border-slate-800 shadow-2xl relative">
      
      {/* Progress Steps Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
            0{step}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Secure Roll Member Registration</h2>
            <p className="text-xs text-slate-400">Step {step} of 3: {step === 1 ? 'Primary Details' : step === 2 ? 'OTP Verification' : 'Biometric Enrolment'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-cyan-400 shadow-lg shadow-cyan-500/50' : 'bg-slate-700'}`} />
          <span className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-cyan-400 shadow-lg shadow-cyan-500/50' : 'bg-slate-700'}`} />
          <span className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-cyan-400 shadow-lg shadow-cyan-500/50' : 'bg-slate-700'}`} />
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Registration Form Details */}
      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Organization */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-cyan-400" /> Organization (College / Corporate)
              </label>
              <select
                name="orgId"
                value={formData.orgId}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
              >
                {orgs.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.logo} {org.name} ({org.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-cyan-400" /> Full Name
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Rohit Sharma"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Roll Number / Employee ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-cyan-400" /> Roll Number / Employee ID
              </label>
              <input
                type="text"
                name="rollNumber"
                required
                placeholder="e.g. 2024-CS-108 or EMP-9042"
                value={formData.rollNumber}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Aadhar ID */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Aadhar ID (12-Digit Government ID)
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Encrypted with AES-256</span>
              </label>
              <input
                type="text"
                name="aadharRaw"
                required
                maxLength="12"
                placeholder="12-digit Aadhar Number (e.g. 773288194401)"
                value={formData.aadharRaw}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-cyan-400" /> Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="student@stxavier.edu"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Mobile Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-cyan-400" /> Mobile Phone
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-cyan-400" /> Create Password
              </label>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-cyan-400" /> Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
            >
              Already registered? Login here
            </button>

            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all"
            >
              Proceed to OTP Verification <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: OTP Verification */}
      {step === 2 && (
        <div className="space-y-6 text-center py-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
            <Key className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Enter 6-Digit Verification OTP</h3>
            <p className="text-xs text-slate-400 mt-1">
              We have dispatched a verification code to <span className="text-cyan-400 font-semibold">{formData.email}</span>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono max-w-sm mx-auto">
            ⚡ Demo OTP Code: <span className="text-lg font-bold text-white tracking-widest">{generatedOtp}</span>
          </div>

          <div className="max-w-xs mx-auto space-y-3">
            <input
              type="text"
              maxLength="6"
              placeholder="123456"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-widest text-white focus:outline-none focus:border-cyan-500 font-mono"
            />

            <button
              onClick={handleVerifyOtp}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all"
            >
              Verify OTP & Continue
            </button>
          </div>

          <button
            onClick={() => setStep(1)}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Back to Registration Details
          </button>
        </div>
      )}

      {/* STEP 3: Biometric Enrolment */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
            <p className="font-bold text-cyan-400">Biometric & Identity Verification Requirements:</p>
            <p>Please complete Face Scan and Fingerprint Enrolment. Organization ID card is an optional second layer verification.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Face Recognition Enrolment Card */}
            <div className={`p-5 rounded-2xl border text-center transition-all ${faceScanVerified ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-slate-900/60 border-slate-800 hover:border-cyan-500/40'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${faceScanVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                {faceScanVerified ? <CheckCircle2 className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
              </div>
              <h4 className="text-sm font-bold text-white">Face Recognition</h4>
              <p className="text-[11px] text-slate-400 mt-1 mb-4">Webcam Vector Scan</p>
              <button
                type="button"
                onClick={() => setShowFaceModal(true)}
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${faceScanVerified ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30'}`}
              >
                {faceScanVerified ? '✓ Face Enrolled' : 'Start Face Scan'}
              </button>
            </div>

            {/* Fingerprint Enrolment Card */}
            <div className={`p-5 rounded-2xl border text-center transition-all ${fpScanVerified ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/40'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${fpScanVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                {fpScanVerified ? <CheckCircle2 className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
              </div>
              <h4 className="text-sm font-bold text-white">Fingerprint Scan</h4>
              <p className="text-[11px] text-slate-400 mt-1 mb-4">Minutiae Pattern Template</p>
              <button
                type="button"
                onClick={() => setShowFpModal(true)}
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${fpScanVerified ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'}`}
              >
                {fpScanVerified ? '✓ Fingerprint Enrolled' : 'Scan Fingerprint'}
              </button>
            </div>

            {/* Org ID Enrolment Card */}
            <div className={`p-5 rounded-2xl border text-center transition-all ${idCardVerified ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-slate-900/60 border-slate-800 hover:border-blue-500/40'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${idCardVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                {idCardVerified ? <CheckCircle2 className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
              </div>
              <h4 className="text-sm font-bold text-white">Org ID Card</h4>
              <p className="text-[11px] text-slate-400 mt-1 mb-4">OCR Authenticity Check</p>
              <button
                type="button"
                onClick={() => setShowIdModal(true)}
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${idCardVerified ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30'}`}
              >
                {idCardVerified ? '✓ ID Verified' : 'Verify ID Card'}
              </button>
            </div>

          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              onClick={() => setStep(2)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              ← Back to OTP
            </button>

            <button
              onClick={handleFinalSubmit}
              disabled={loading}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Complete Account Enrolment
            </button>
          </div>
        </div>
      )}

      {/* Biometric Modals */}
      <FaceScanModal
        isOpen={showFaceModal}
        onClose={() => setShowFaceModal(false)}
        user={{ ...formData, orgName: selectedOrg.name }}
        onSuccess={() => {
          setFaceScanVerified(true);
          setShowFaceModal(false);
        }}
      />

      <FingerprintScanModal
        isOpen={showFpModal}
        onClose={() => setShowFpModal(false)}
        user={{ ...formData, orgName: selectedOrg.name }}
        onSuccess={() => {
          setFpScanVerified(true);
          setShowFpModal(false);
        }}
      />

      <OrgIDVerificationModal
        isOpen={showIdModal}
        onClose={() => setShowIdModal(false)}
        user={{ ...formData, orgName: selectedOrg.name }}
        onSuccess={() => {
          setIdCardVerified(true);
          setShowIdModal(false);
        }}
      />

    </div>
  );
}
