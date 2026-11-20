import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import {StudentDashboardScreen} from '../screens/student/DashboardScreen';
import {ProximityScreen} from '../screens/student/ProximityScreen';
import {MarkAttendanceScreen} from '../screens/student/MarkAttendanceScreen';
import {StudentTimetableScreen} from '../screens/student/TimetableScreen';
import {AttendanceRegisterScreen} from '../screens/student/AttendanceRegisterScreen';
import {StudentProfileScreen} from '../screens/student/ProfileScreen';
import {COLORS} from '../utils/constants';
import type {
  StudentTabParamList,
  StudentDashboardStackParamList,
} from '../types/navigation';

const Tab = createBottomTabNavigator<StudentTabParamList>();
const DashboardStack = createNativeStackNavigator<StudentDashboardStackParamList>();

const DashboardStackNavigator: React.FC = () => {
  return (
    <DashboardStack.Navigator
      initialRouteName="StudentDashboard"
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}>
      <DashboardStack.Screen
        name="StudentDashboard"
        component={StudentDashboardScreen}
        options={{
          headerTitle: 'Student Portal',
        }}
      />
      <DashboardStack.Screen
        name="Proximity"
        component={ProximityScreen}
        options={{
          headerTitle: 'Classroom Verification',
        }}
      />
      <DashboardStack.Screen
        name="MarkAttendance"
        component={MarkAttendanceScreen}
        options={{
          headerTitle: 'Mark Attendance',
        }}
      />
    </DashboardStack.Navigator>
  );
};

export const StudentNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="DashboardTab"
      screenOptions={({route}) => ({
        headerShown: route.name !== 'DashboardTab',
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: '700',
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({focused, color, size}) => {
          let iconName = 'home-outline';

          if (route.name === 'DashboardTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'TimetableTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'AttendanceTab') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon name={iconName} size={size || 22} color={color} />;
        },
      })}>
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStackNavigator}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="TimetableTab"
        component={StudentTimetableScreen}
        options={{
          tabBarLabel: 'Timetable',
          headerTitle: 'Weekly Timetable',
        }}
      />
      <Tab.Screen
        name="AttendanceTab"
        component={AttendanceRegisterScreen}
        options={{
          tabBarLabel: 'Attendance',
          headerTitle: 'Attendance Register',
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={StudentProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          headerTitle: 'My Account',
        }}
      />
    </Tab.Navigator>
  );
};
