import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';

import CoachDashboard from '../screens/coach/CoachDashboard';
import TakeAttendance from '../screens/coach/TakeAttendance';
import PlayerProgress from '../screens/coach/PlayerProgress';
import CoachPlayerList from '../screens/coach/CoachPlayerList';
import CoachBroadcasts from '../screens/coach/CoachBroadcasts';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const tabBarIcon = (name) => ({ color, size }) => <Ionicons name={name} size={size} color={color} />;

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CoachDashboard" component={CoachDashboard} />
    </Stack.Navigator>
  );
}

function AttendanceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TakeAttendance" component={TakeAttendance} />
    </Stack.Navigator>
  );
}

function PlayersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CoachPlayerList" component={CoachPlayerList} />
      <Stack.Screen name="PlayerProgress" component={PlayerProgress} />
    </Stack.Navigator>
  );
}

export default function CoachNavigator() {
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
        name="Attendance"
        component={AttendanceStack}
        options={{ tabBarLabel: 'Attendance', tabBarIcon: tabBarIcon('checkmark-circle') }}
      />
      <Tab.Screen
        name="Players"
        component={PlayersStack}
        options={{ tabBarLabel: 'Players', tabBarIcon: tabBarIcon('people') }}
      />
      <Tab.Screen
        name="Broadcasts"
        component={CoachBroadcasts}
        options={{ tabBarLabel: 'Updates', tabBarIcon: tabBarIcon('megaphone') }}
      />
    </Tab.Navigator>
  );
}
