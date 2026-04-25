import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { FIREBASE_COLLECTIONS, ROLES } from '../utils/constants';

export const loginUser = async (email, password) => {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, FIREBASE_COLLECTIONS.USERS, userCred.user.uid));

  if (!userDoc.exists()) throw new Error('User profile not found.');

  const userData = userDoc.data();
  if (!userData.isActive) throw new Error('Account is deactivated. Contact admin.');

  await updateDoc(doc(db, FIREBASE_COLLECTIONS.USERS, userCred.user.uid), {
    lastLogin: serverTimestamp(),
  });

  return { uid: userCred.user.uid, ...userData };
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const getUserProfile = async (uid) => {
  const userDoc = await getDoc(doc(db, FIREBASE_COLLECTIONS.USERS, uid));
  if (!userDoc.exists()) return null;
  return { uid, ...userDoc.data() };
};

export const createUserProfile = async (uid, data) => {
  await setDoc(doc(db, FIREBASE_COLLECTIONS.USERS, uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isActive: true,
    notificationEnabled: true,
  });
};

export const updateUserProfile = async (uid, data) => {
  await updateDoc(doc(db, FIREBASE_COLLECTIONS.USERS, uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const createAdminAccount = async (email, password, name, phone) => {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  await createUserProfile(userCred.user.uid, {
    email,
    name,
    phone,
    role: ROLES.ADMIN,
    displayName: name,
    photoURL: null,
  });
  return userCred.user.uid;
};

export const createCoachAccount = async (email, password, name, phone, categories) => {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  await createUserProfile(userCred.user.uid, {
    email,
    name,
    phone,
    role: ROLES.COACH,
    categories: categories || [],
    displayName: name,
    photoURL: null,
  });
  return userCred.user.uid;
};

export const createParentAccount = async (email, password, name, phone, playerIds) => {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  await createUserProfile(userCred.user.uid, {
    email,
    name,
    phone,
    role: ROLES.PARENT,
    playerIds: playerIds || [],
    displayName: name,
    photoURL: null,
    canViewDashboard: true,
    canViewAttendance: true,
    canViewPayments: true,
    canViewProgress: true,
  });
  return userCred.user.uid;
};
