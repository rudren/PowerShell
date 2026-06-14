import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { addPlayer, updatePlayer } from './playerService';
import { sendPaymentReminder } from './notificationService';
import { openWhatsApp, sanitizePhone } from '../utils/helpers';

const PENDING_COL    = 'pendingPlayers';
const UPDATE_REQ_COL = 'updateRequests';

// ── Pending new-player registrations ────────────────────────────────────────

export const getPendingPlayers = async () => {
  const q = query(
    collection(db, PENDING_COL),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getPendingCount = async () => {
  const [pendingSnap, updateSnap] = await Promise.all([
    getDocs(query(collection(db, PENDING_COL),    where('status', '==', 'pending'))),
    getDocs(query(collection(db, UPDATE_REQ_COL), where('status', '==', 'pending'))),
  ]);
  return pendingSnap.size + updateSnap.size;
};

export const approvePendingPlayer = async (pendingId, pendingData, adminUid) => {
  const playerId = await addPlayer({
    fullName:         pendingData.playerName,
    dob:              pendingData.dob,
    category:         pendingData.category,
    position:         pendingData.position,
    jerseyNumber:     pendingData.jerseyNumber ? parseInt(pendingData.jerseyNumber) : null,
    school:           pendingData.school,
    parentName:       pendingData.parentName,
    parentPhone:      pendingData.parentPhone,
    parentEmail:      pendingData.parentEmail,
    address:          pendingData.address,
    emergencyContact: pendingData.emergencyContact,
    emergencyPhone:   pendingData.emergencyPhone,
    medicalNotes:     pendingData.medicalNotes,
    monthlyFee:       pendingData.monthlyFee || 0,
    source:           'google_form',
  });

  await updateDoc(doc(db, PENDING_COL, pendingId), {
    status:      'approved',
    playerId,
    approvedBy:  adminUid,
    approvedAt:  serverTimestamp(),
  });

  return playerId;
};

export const rejectPendingPlayer = async (pendingId, reason, adminUid) => {
  await updateDoc(doc(db, PENDING_COL, pendingId), {
    status:     'rejected',
    rejectReason: reason,
    rejectedBy: adminUid,
    rejectedAt: serverTimestamp(),
  });
};

// ── Update requests (existing players) ──────────────────────────────────────

export const getUpdateRequests = async () => {
  const q = query(
    collection(db, UPDATE_REQ_COL),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const approveUpdateRequest = async (requestId, requestData, adminUid) => {
  const { existingPlayerId } = requestData;

  const updates = {};
  const fieldMap = {
    playerName:       'fullName',
    dob:              'dob',
    category:         'category',
    position:         'position',
    jerseyNumber:     'jerseyNumber',
    school:           'school',
    parentName:       'parentName',
    parentPhone:      'parentPhone',
    parentEmail:      'parentEmail',
    address:          'address',
    emergencyContact: 'emergencyContact',
    emergencyPhone:   'emergencyPhone',
    medicalNotes:     'medicalNotes',
    monthlyFee:       'monthlyFee',
  };

  Object.entries(fieldMap).forEach(([formKey, dbKey]) => {
    if (requestData[formKey] !== undefined && requestData[formKey] !== '') {
      updates[dbKey] = requestData[formKey];
    }
  });

  await updatePlayer(existingPlayerId, updates);

  await updateDoc(doc(db, UPDATE_REQ_COL, requestId), {
    status:     'approved',
    approvedBy: adminUid,
    approvedAt: serverTimestamp(),
  });
};

export const rejectUpdateRequest = async (requestId, reason, adminUid) => {
  await updateDoc(doc(db, UPDATE_REQ_COL, requestId), {
    status:       'rejected',
    rejectReason: reason,
    rejectedBy:   adminUid,
    rejectedAt:   serverTimestamp(),
  });
};

// ── WhatsApp notification helpers ────────────────────────────────────────────

export const notifyApproval = async (parentPhone, playerName) => {
  const phone = sanitizePhone(parentPhone);
  const msg =
    `✅ *Masai United FC*\n\n` +
    `Pendaftaran untuk *${playerName}* telah diluluskan! 🎉\n\n` +
    `Sila log masuk ke aplikasi MUFC untuk melihat maklumat lanjut.\n\n` +
    `_Selamat datang ke keluarga Masai United FC!_ ⚽🔴`;
  await openWhatsApp(phone, msg);
};

export const notifyRejection = async (parentPhone, playerName, reason) => {
  const phone = sanitizePhone(parentPhone);
  const msg =
    `ℹ️ *Masai United FC*\n\n` +
    `Pendaftaran untuk *${playerName}* memerlukan semakan.\n\n` +
    `Sebab: _${reason}_\n\n` +
    `Sila hubungi kami untuk maklumat lanjut. Terima kasih.`;
  await openWhatsApp(phone, msg);
};
