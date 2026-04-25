import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';
import { useAuth } from '../context/AuthContext';

import ParentDashboard from '../screens/parent/ParentDashboard';
import AttendanceView from '../screens/parent/AttendanceView';
import PaymentView from '../screens/parent/PaymentView';
import InvoiceDetailView from '../screens/parent/InvoiceDetailView';
import ParentBroadcasts from '../screens/parent/ParentBroadcasts';
import ParentProfile from '../screens/parent/ParentProfile';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const tabBarIcon = (name) => ({ color, size }) => <Ionicons name={name} size={size} color={color} />;

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ParentDashboard" component={ParentDashboard} />
    </Stack.Navigator>
  );
}

function PaymentStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PaymentView" component={PaymentView} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetailView} />
    </Stack.Navigator>
  );
}

export default function ParentNavigator() {
  const { parentViewSettings } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.midGray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.lightGray,
          paddingBottom: 6,
          paddingTop: 4,
          height: 62,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      {parentViewSettings.canViewDashboard && (
        <Tab.Screen
          name="Home"
          component={DashboardStack}
          options={{ tabBarLabel: 'Home', tabBarIcon: tabBarIcon('home') }}
        />
      )}
      {parentViewSettings.canViewAttendance && (
        <Tab.Screen
          name="Attendance"
          component={AttendanceView}
          options={{ tabBarLabel: 'Attendance', tabBarIcon: tabBarIcon('calendar') }}
        />
      )}
      {parentViewSettings.canViewPayments && (
        <Tab.Screen
          name="Payments"
          component={PaymentStack}
          options={{ tabBarLabel: 'Payments', tabBarIcon: tabBarIcon('card') }}
        />
      )}
      <Tab.Screen
        name="Updates"
        component={ParentBroadcasts}
        options={{ tabBarLabel: 'Updates', tabBarIcon: tabBarIcon('megaphone') }}
      />
      <Tab.Screen
        name="Profile"
        component={ParentProfile}
        options={{ tabBarLabel: 'Profile', tabBarIcon: tabBarIcon('person') }}
      />
    </Tab.Navigator>
  );
}
