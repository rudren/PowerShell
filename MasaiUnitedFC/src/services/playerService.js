import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { FIREBASE_COLLECTIONS } from '../utils/constants';

export const addPlayer = async (playerData) => {
  const ref = await addDoc(collection(db, FIREBASE_COLLECTIONS.PLAYERS), {
    ...playerData,
    isActive: true,
    registrationDate: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updatePlayer = async (playerId, data) => {
  await updateDoc(doc(db, FIREBASE_COLLECTIONS.PLAYERS, playerId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deactivatePlayer = async (playerId) => {
  await updateDoc(doc(db, FIREBASE_COLLECTIONS.PLAYERS, playerId), {
    isActive: false,
    updatedAt: serverTimestamp(),
  });
};

export const getPlayer = async (playerId) => {
  const snap = await getDoc(doc(db, FIREBASE_COLLECTIONS.PLAYERS, playerId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

export const getAllPlayers = async (activeOnly = true) => {
  let q = collection(db, FIREBASE_COLLECTIONS.PLAYERS);
  if (activeOnly) {
    q = query(q, where('isActive', '==', true), orderBy('fullName'));
  } else {
    q = query(q, orderBy('fullName'));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getPlayersByCategory = async (category) => {
  const q = query(
    collection(db, FIREBASE_COLLECTIONS.PLAYERS),
    where('category', '==', category),
    where('isActive', '==', true),
    orderBy('fullName')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getPlayersByParent = async (parentId) => {
  const q = query(
    collection(db, FIREBASE_COLLECTIONS.PLAYERS),
    where('parentId', '==', parentId),
    where('isActive', '==', true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getPlayerStats = async (playerId) => {
  const player = await getPlayer(playerId);
  if (!player) return null;

  const attendanceQuery = query(
    collection(db, FIREBASE_COLLECTIONS.ATTENDANCE),
    where('playerId', '==', playerId)
  );
  const attendanceSnap = await getDocs(attendanceQuery);
  const attendance = attendanceSnap.docs.map((d) => d.data());

  const present = attendance.filter((a) => a.status === 'present').length;
  const total = attendance.length;

  return {
    player,
    totalSessions: total,
    attended: present,
    absent: attendance.filter((a) => a.status === 'absent').length,
    late: attendance.filter((a) => a.status === 'late').length,
    attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
  };
};

export const searchPlayers = async (searchText) => {
  const allPlayers = await getAllPlayers(true);
  const lower = searchText.toLowerCase();
  return allPlayers.filter(
    (p) =>
      p.fullName?.toLowerCase().includes(lower) ||
      p.jerseyNumber?.toString().includes(lower) ||
      p.category?.toLowerCase().includes(lower)
  );
};
