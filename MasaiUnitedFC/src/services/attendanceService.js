import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { FIREBASE_COLLECTIONS } from '../utils/constants';
import moment from 'moment';

export const createSession = async (sessionData) => {
  const ref = await addDoc(collection(db, FIREBASE_COLLECTIONS.SESSIONS), {
    ...sessionData,
    date: Timestamp.fromDate(new Date(sessionData.date)),
    createdAt: serverTimestamp(),
    isCompleted: false,
  });
  return ref.id;
};

export const getSession = async (sessionId) => {
  const snap = await getDoc(doc(db, FIREBASE_COLLECTIONS.SESSIONS, sessionId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

export const getSessions = async (category = null, limit = 20) => {
  let q = collection(db, FIREBASE_COLLECTIONS.SESSIONS);
  if (category) {
    q = query(q, where('category', '==', category), orderBy('date', 'desc'));
  } else {
    q = query(q, orderBy('date', 'desc'));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const markAttendance = async (sessionId, playerId, status, notes = '') => {
  const id = `${sessionId}_${playerId}`;
  await setDoc(doc(db, FIREBASE_COLLECTIONS.ATTENDANCE, id), {
    sessionId,
    playerId,
    status,
    notes,
    markedAt: serverTimestamp(),
  });
};

export const batchMarkAttendance = async (sessionId, attendanceList) => {
  const promises = attendanceList.map(({ playerId, status, notes }) =>
    markAttendance(sessionId, playerId, status, notes)
  );
  await Promise.all(promises);

  await updateDoc(doc(db, FIREBASE_COLLECTIONS.SESSIONS, sessionId), {
    isCompleted: true,
    completedAt: serverTimestamp(),
  });
};

export const getSessionAttendance = async (sessionId) => {
  const q = query(
    collection(db, FIREBASE_COLLECTIONS.ATTENDANCE),
    where('sessionId', '==', sessionId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getPlayerAttendance = async (playerId, month = null, year = null) => {
  let q = query(
    collection(db, FIREBASE_COLLECTIONS.ATTENDANCE),
    where('playerId', '==', playerId)
  );
  const snap = await getDocs(q);
  let records = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (month && year) {
    records = records.filter((r) => {
      const date = r.markedAt?.toDate ? r.markedAt.toDate() : new Date();
      return moment(date).month() + 1 === month && moment(date).year() === year;
    });
  }

  return records;
};

export const getAttendanceSummary = async (category, month, year) => {
  const startDate = moment(`${year}-${month}-01`).startOf('month').toDate();
  const endDate = moment(`${year}-${month}-01`).endOf('month').toDate();

  const sessionsQuery = query(
    collection(db, FIREBASE_COLLECTIONS.SESSIONS),
    where('category', '==', category),
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate))
  );

  const sessionsSnap = await getDocs(sessionsQuery);
  const sessions = sessionsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const attendancePromises = sessions.map((s) => getSessionAttendance(s.id));
  const allAttendance = await Promise.all(attendancePromises);

  const summary = {};
  allAttendance.forEach((sessionAttendance) => {
    sessionAttendance.forEach((record) => {
      if (!summary[record.playerId]) {
        summary[record.playerId] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      summary[record.playerId].total++;
      summary[record.playerId][record.status] = (summary[record.playerId][record.status] || 0) + 1;
    });
  });

  return { sessions, summary };
};

export const completeSession = async (sessionId) => {
  await updateDoc(doc(db, FIREBASE_COLLECTIONS.SESSIONS, sessionId), {
    isCompleted: true,
    completedAt: serverTimestamp(),
  });
};
