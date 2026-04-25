import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';
import { COLORS } from '../utils/theme';

import AuthNavigator from './AuthNavigator';
import AdminNavigator from './AdminNavigator';
import CoachNavigator from './CoachNavigator';
import ParentNavigator from './ParentNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  const renderNavigator = () => {
    if (!user) return <AuthNavigator />;
    switch (user.role) {
      case ROLES.ADMIN: return <AdminNavigator />;
      case ROLES.COACH: return <CoachNavigator />;
      case ROLES.PARENT: return <ParentNavigator />;
      default: return <AuthNavigator />;
    }
  };

  return (
    <NavigationContainer>
      {renderNavigator()}
    </NavigationContainer>
  );
}
