import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUserProfile } from '../services/authService';
import { registerForPushNotifications, saveUserPushToken } from '../services/notificationService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [parentViewSettings, setParentViewSettings] = useState({
    canViewDashboard: true,
    canViewAttendance: true,
    canViewPayments: true,
    canViewProgress: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile) {
            setUser(profile);
            if (profile.role === 'parent') {
              setParentViewSettings({
                canViewDashboard: profile.canViewDashboard ?? true,
                canViewAttendance: profile.canViewAttendance ?? true,
                canViewPayments: profile.canViewPayments ?? true,
                canViewProgress: profile.canViewProgress ?? true,
              });
            }
            const token = await registerForPushNotifications();
            if (token) {
              await saveUserPushToken(firebaseUser.uid, token);
            }
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error('Auth state error:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
    if (updates.canViewDashboard !== undefined) {
      setParentViewSettings({
        canViewDashboard: updates.canViewDashboard ?? true,
        canViewAttendance: updates.canViewAttendance ?? true,
        canViewPayments: updates.canViewPayments ?? true,
        canViewProgress: updates.canViewProgress ?? true,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, updateUser, parentViewSettings, setParentViewSettings }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
