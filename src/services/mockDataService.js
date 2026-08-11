/**
 * SecureRoll - Mock Data & Multi-Tenant State Engine
 * Handles initialization, storage, and persistence of Organizations, Members, Attendance Records, and Leave Requests.
 */

import { encryptSensitiveData, maskAadharID, addAuditLog } from './securityService';

// Storage keys
const ORGS_KEY = 'secureroll_organizations';
const USERS_KEY = 'secureroll_users';
const ATTENDANCE_KEY = 'secureroll_attendance';
const LEAVES_KEY = 'secureroll_leaves';

// Default Organizations
export const DEFAULT_ORGANIZATIONS = [
  {
    id: 'ORG-KARTHIK-01',
    name: "Karthik's Enterprise Systems",
    type: 'Enterprise Company',
    code: 'KSE',
    logo: '⚡',
    location: 'Karthik Headquarters & Campus',
    geoFence: { lat: 28.6273, lng: 77.3714, radiusMeters: 500 }
  },
  {
    id: 'ORG-TECH-01',
    name: 'St. Xavier Institute of Technology',
    type: 'College',
    code: 'SXIT',
    logo: '🎓',
    location: 'Campus Hub, Sector 62',
    geoFence: { lat: 28.6273, lng: 77.3714, radiusMeters: 500 }
  }
];

// Helper to seed initial data if empty
export const initializeMockDatabase = async () => {
  // Always ensure Karthik's Org exists
  let orgs = JSON.parse(localStorage.getItem(ORGS_KEY) || '[]');
  if (!orgs.some(o => o.id === 'ORG-KARTHIK-01')) {
    orgs.unshift(DEFAULT_ORGANIZATIONS[0]);
    localStorage.setItem(ORGS_KEY, JSON.stringify(orgs));
  }

  const encryptedAadharKarthik = await encryptSensitiveData('999988887777');
  const encryptedAadhar1 = await encryptSensitiveData('773288194401');

  const karthikUser = {
    id: 'USR-ADMIN-KARTHIK',
    orgId: 'ORG-KARTHIK-01',
    orgName: "Karthik's Enterprise Systems",
    rollNumber: 'KARTHIK-001',
    name: 'Karthik',
    email: 'karthik@secureroll.org',
    passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    role: 'ADMIN',
    aadharEncrypted: encryptedAadharKarthik,
    aadharMasked: maskAadharID('999988887777'),
    phone: '+91 9876543210',
    biometricsEnrolled: true,
    faceTemplate: 'TEMPLATE_HASH_FACE_KARTHIK',
    fingerprintTemplate: 'TEMPLATE_HASH_FP_KARTHIK',
    idCardVerified: true,
    verificationStatus: 'VERIFIED',
    createdAt: '2026-01-01T00:00:00.000Z'
  };

  let currentUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  // Upgrade / update Karthik profile in storage
  const karthikIdx = currentUsers.findIndex(u => u.id === 'USR-ADMIN-KARTHIK' || u.name.toLowerCase() === 'karthik');
  if (karthikIdx !== -1) {
    currentUsers[karthikIdx] = { ...currentUsers[karthikIdx], ...karthikUser };
  } else {
    currentUsers.unshift(karthikUser);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(currentUsers));

  // Set logged user to Karthik by default
  localStorage.setItem('secureroll_logged_user_id', 'USR-ADMIN-KARTHIK');

  if (!localStorage.getItem(ATTENDANCE_KEY)) {
    const seedAttendance = [
      {
        id: 'ATT-001',
        userId: 'USR-MEM-01',
        userName: 'Rohit Sharma',
        rollNumber: '2024-CS-108',
        orgId: 'ORG-TECH-01',
        date: '2026-08-08',
        time: '08:52:10 AM',
        status: 'PRESENT',
        method: 'BARCODE_SCAN',
        gpsVerified: true,
        location: 'Within Campus Geo-Fence (28.6273, 77.3714)'
      },
      {
        id: 'ATT-002',
        userId: 'USR-MEM-01',
        userName: 'Rohit Sharma',
        rollNumber: '2024-CS-108',
        orgId: 'ORG-TECH-01',
        date: '2026-08-09',
        time: '09:28:45 AM',
        status: 'LATE',
        method: 'QR_SCAN',
        gpsVerified: true,
        location: 'Within Campus Geo-Fence (28.6274, 77.3712)'
      },
      {
        id: 'ATT-003',
        userId: 'USR-MEM-01',
        userName: 'Rohit Sharma',
        rollNumber: '2024-CS-108',
        orgId: 'ORG-TECH-01',
        date: '2026-08-10',
        time: '08:48:12 AM',
        status: 'PRESENT',
        method: 'FACE_SCAN_KIOSK',
        gpsVerified: true,
        location: 'Main Entry Terminal A'
      },
      {
        id: 'ATT-004',
        userId: 'USR-MEM-02',
        userName: 'Ananya Roy',
        rollNumber: 'EMP-9042',
        orgId: 'ORG-CORP-02',
        date: '2026-08-10',
        time: '09:02:00 AM',
        status: 'PRESENT',
        method: 'QR_SCAN',
        gpsVerified: true,
        location: 'Apex Cyber Tower Lobby'
      }
    ];

    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(seedAttendance));
  }

  if (!localStorage.getItem(LEAVES_KEY)) {
    const seedLeaves = [
      {
        id: 'LV-101',
        userId: 'USR-MEM-01',
        userName: 'Rohit Sharma',
        rollNumber: '2024-CS-108',
        orgId: 'ORG-TECH-01',
        startDate: '2026-08-14',
        endDate: '2026-08-15',
        type: 'Medical Leave',
        reason: 'Attending dental procedure and medical consultation.',
        status: 'PENDING',
        appliedAt: '2026-08-09T14:30:00.000Z'
      }
    ];

    localStorage.setItem(LEAVES_KEY, JSON.stringify(seedLeaves));
  }
};

// Data Accessors
export const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
export const getAttendanceRecords = () => JSON.parse(localStorage.getItem(ATTENDANCE_KEY) || '[]');
export const getLeaveRequests = () => JSON.parse(localStorage.getItem(LEAVES_KEY) || '[]');
export const getOrganizations = () => JSON.parse(localStorage.getItem(ORGS_KEY) || '[]');

// Register New User
export const registerUserInDatabase = async (userData) => {
  const users = getUsers();
  const existing = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase() || u.rollNumber === userData.rollNumber);
  
  if (existing) {
    throw new Error('User with this Email Address or Roll/Emp Number already exists.');
  }

  const encryptedAadhar = await encryptSensitiveData(userData.aadharRaw);
  const newUser = {
    id: 'USR-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    orgId: userData.orgId,
    orgName: userData.orgName,
    rollNumber: userData.rollNumber,
    name: userData.name,
    email: userData.email,
    passwordHash: userData.passwordHash,
    role: userData.role || 'MEMBER',
    aadharEncrypted: encryptedAadhar,
    aadharMasked: maskAadharID(userData.aadharRaw),
    phone: userData.phone,
    biometricsEnrolled: userData.biometricsEnrolled || false,
    faceTemplate: userData.faceTemplate || null,
    fingerprintTemplate: userData.fingerprintTemplate || null,
    idCardVerified: userData.idCardVerified || false,
    verificationStatus: (userData.biometricsEnrolled && userData.idCardVerified) ? 'VERIFIED' : 'PENDING_VERIFICATION',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  await addAuditLog({
    action: 'MEMBER_REGISTERED',
    userId: newUser.id,
    userRole: newUser.role,
    orgId: newUser.orgId,
    details: `Member registered successfully for ${newUser.orgName}. Biometric enrolment: ${newUser.biometricsEnrolled ? 'COMPLETED' : 'PENDING'}`
  });

  return newUser;
};

// Update User Biometrics / Verification
export const updateUserVerification = async (userId, updates) => {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updates };
    if (users[idx].biometricsEnrolled && users[idx].idCardVerified) {
      users[idx].verificationStatus = 'VERIFIED';
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return users[idx];
  }
  return null;
};

// Mark Attendance
export const markAttendanceInDatabase = async ({ userId, userName, rollNumber, orgId, method = 'BARCODE_SCAN', gpsVerified = true, location = 'Main Terminal' }) => {
  const records = getAttendanceRecords();
  const todayStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  // Check if already marked today
  const existingToday = records.find(r => r.userId === userId && r.date === todayStr);
  if (existingToday) {
    return { success: false, isDuplicate: true, record: existingToday, message: 'Attendance already marked for today.' };
  }

  // Calculate status (Present vs Late - e.g. after 9:15 AM is Late)
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const isLate = hours > 9 || (hours === 9 && minutes > 15);
  const status = isLate ? 'LATE' : 'PRESENT';

  const newRecord = {
    id: 'ATT-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    userId,
    userName,
    rollNumber,
    orgId,
    date: todayStr,
    time: timeStr,
    status,
    method,
    gpsVerified,
    location
  };

  records.unshift(newRecord);
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));

  await addAuditLog({
    action: 'ATTENDANCE_MARKED',
    userId,
    userRole: 'MEMBER',
    orgId,
    details: `Attendance marked (${status}) via ${method}. GPS Validated: ${gpsVerified ? 'YES' : 'NO'}`
  });

  return { success: true, record: newRecord, message: `Attendance marked successfully as ${status}` };
};

// Submit Leave Request
export const submitLeaveRequest = async ({ userId, userName, rollNumber, orgId, startDate, endDate, type, reason }) => {
  const leaves = getLeaveRequests();
  const newLeave = {
    id: 'LV-' + Math.random().toString(36).substr(2, 7).toUpperCase(),
    userId,
    userName,
    rollNumber,
    orgId,
    startDate,
    endDate,
    type,
    reason,
    status: 'PENDING',
    appliedAt: new Date().toISOString()
  };

  leaves.unshift(newLeave);
  localStorage.setItem(LEAVES_KEY, JSON.stringify(leaves));

  await addAuditLog({
    action: 'LEAVE_REQUESTED',
    userId,
    userRole: 'MEMBER',
    orgId,
    details: `Leave requested (${type}) from ${startDate} to ${endDate}`
  });

  return newLeave;
};

// Admin Approve / Reject Leave
export const updateLeaveStatus = async (leaveId, status, adminUserId) => {
  const leaves = getLeaveRequests();
  const idx = leaves.findIndex(l => l.id === leaveId);
  if (idx !== -1) {
    leaves[idx].status = status;
    leaves[idx].reviewedBy = adminUserId;
    leaves[idx].reviewedAt = new Date().toISOString();
    localStorage.setItem(LEAVES_KEY, JSON.stringify(leaves));

    await addAuditLog({
      action: `LEAVE_${status}`,
      userId: leaves[idx].userId,
      userRole: 'ADMIN',
      orgId: leaves[idx].orgId,
      details: `Leave application ${leaveId} was ${status.toLowerCase()} by Admin.`
    });

    return leaves[idx];
  }
  return null;
};

// Add New Custom Organization
export const addNewOrganization = ({ name, code, type = 'Company', location = 'Headquarters' }) => {
  const orgs = getOrganizations();
  const newOrg = {
    id: 'ORG-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    name: name || 'My Custom Organization',
    type,
    code: code ? code.toUpperCase() : 'MYORG',
    logo: type === 'College' ? '🎓' : '🏢',
    location: location || 'Main Office',
    geoFence: { lat: 28.6273, lng: 77.3714, radiusMeters: 500 }
  };
  orgs.push(newOrg);
  localStorage.setItem(ORGS_KEY, JSON.stringify(orgs));
  return newOrg;
};

// Delete User / Member
export const deleteUser = (userId) => {
  let users = getUsers();
  users = users.filter(u => u.id !== userId);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  // Also cleanup attendance & leaves for deleted user
  let attendance = getAttendanceRecords().filter(a => a.userId !== userId);
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(attendance));

  let leaves = getLeaveRequests().filter(l => l.userId !== userId);
  localStorage.setItem(LEAVES_KEY, JSON.stringify(leaves));
  return users;
};

// Delete Organization
export const deleteOrganization = (orgId) => {
  let orgs = getOrganizations().filter(o => o.id !== orgId);
  localStorage.setItem(ORGS_KEY, JSON.stringify(orgs));
  return orgs;
};

// Delete Single Attendance Record
export const deleteAttendanceRecord = (recordId) => {
  let records = getAttendanceRecords().filter(r => r.id !== recordId);
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
  return records;
};

// Clear All Sample / Dummy Data & Start Fresh with Custom Data
export const clearAllDummyData = () => {
  // Keep only current Admin user
  const users = getUsers();
  const adminUser = users.find(u => u.role === 'ADMIN') || {
    id: 'USR-ADMIN-01',
    orgId: 'ORG-CUSTOM-01',
    orgName: 'My Organization',
    rollNumber: 'ADMIN-001',
    name: 'Administrator',
    email: 'admin@secureroll.org',
    role: 'ADMIN',
    biometricsEnrolled: true,
    verificationStatus: 'VERIFIED'
  };

  const customOrg = [
    {
      id: adminUser.orgId || 'ORG-CUSTOM-01',
      name: 'My Custom Organization',
      type: 'Organization',
      code: 'MYORG',
      logo: '🏢',
      location: 'Primary Center',
      geoFence: { lat: 28.6273, lng: 77.3714, radiusMeters: 500 }
    }
  ];

  localStorage.setItem(ORGS_KEY, JSON.stringify(customOrg));
  localStorage.setItem(USERS_KEY, JSON.stringify([adminUser]));
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify([]));
  localStorage.setItem(LEAVES_KEY, JSON.stringify([]));
};

