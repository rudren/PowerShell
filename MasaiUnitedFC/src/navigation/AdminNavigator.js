import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';
import { getPendingCount } from '../services/pendingService';

import AdminDashboard from '../screens/admin/AdminDashboard';
import PlayerManagement from '../screens/admin/PlayerManagement';
import AddPlayerScreen from '../screens/admin/AddPlayerScreen';
import PlayerDetailScreen from '../screens/admin/PlayerDetailScreen';
import AttendanceManagement from '../screens/admin/AttendanceManagement';
import PaymentManagement from '../screens/admin/PaymentManagement';
import PaymentDetailScreen from '../screens/admin/PaymentDetailScreen';
import InvoiceScreen from '../screens/admin/InvoiceScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import BroadcastScreen from '../screens/admin/BroadcastScreen';
import UserManagement from '../screens/admin/UserManagement';
import ParentViewControl from '../screens/admin/ParentViewControl';
import SettingsScreen from '../screens/admin/SettingsScreen';
import RecordPaymentScreen from '../screens/admin/RecordPaymentScreen';
import PendingApprovalsScreen from '../screens/admin/PendingApprovalsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const tabBarIcon = (name) => ({ color, size }) => (
  <Ionicons name={name} size={size} color={color} />
);

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="PlayerDetail" component={PlayerDetailScreen} />
      <Stack.Screen name="ParentViewControl" component={ParentViewControl} />
    </Stack.Navigator>
  );
}

function PlayersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PlayerManagement" component={PlayerManagement} />
      <Stack.Screen name="AddPlayer" component={AddPlayerScreen} />
      <Stack.Screen name="PlayerDetail" component={PlayerDetailScreen} />
      <Stack.Screen name="PendingApprovals" component={PendingApprovalsScreen} />
    </Stack.Navigator>
  );
}

function AttendanceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AttendanceManagement" component={AttendanceManagement} />
    </Stack.Navigator>
  );
}

function PaymentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PaymentManagement" component={PaymentManagement} />
      <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} />
      <Stack.Screen name="RecordPayment" component={RecordPaymentScreen} />
      <Stack.Screen name="Invoice" component={InvoiceScreen} />
    </Stack.Navigator>
  );
}

function ReportsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="Broadcast" component={BroadcastScreen} />
      <Stack.Screen name="UserManagement" component={UserManagement} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

function PendingBadge({ count }) {
  if (!count) return null;
  return (
    <View style={badge.wrap}>
      <Text style={badge.text}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  text: { fontSize: 9, fontWeight: '900', color: COLORS.white },
});

export default function AdminNavigator() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const count = await getPendingCount();
      setPendingCount(count);
    };
    load();
    const interval = setInterval(load, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

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
      <Tab.Screen
        name="Home"
        component={DashboardStack}
        options={{ tabBarLabel: 'Dashboard', tabBarIcon: tabBarIcon('grid') }}
      />
      <Tab.Screen
        name="Players"
        component={PlayersStack}
        options={{
          tabBarLabel: 'Players',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="people" size={size} color={color} />
              <PendingBadge count={pendingCount} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceStack}
        options={{ tabBarLabel: 'Attendance', tabBarIcon: tabBarIcon('calendar') }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsStack}
        options={{ tabBarLabel: 'Payments', tabBarIcon: tabBarIcon('card') }}
      />
      <Tab.Screen
        name="More"
        component={ReportsStack}
        options={{ tabBarLabel: 'Reports', tabBarIcon: tabBarIcon('bar-chart') }}
      />
    </Tab.Navigator>
  );
}
