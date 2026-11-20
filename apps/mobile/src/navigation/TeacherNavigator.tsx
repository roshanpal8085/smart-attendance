import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import {TeacherDashboardScreen} from '../screens/teacher/DashboardScreen';
import {StartSessionScreen} from '../screens/teacher/StartSessionScreen';
import {LiveSessionScreen} from '../screens/teacher/LiveSessionScreen';
import {TeacherHistoryScreen} from '../screens/teacher/HistoryScreen';
import {TeacherProfileScreen} from '../screens/teacher/ProfileScreen';
import {COLORS} from '../utils/constants';
import type {
  TeacherTabParamList,
  TeacherSessionStackParamList,
} from '../types/navigation';

const Tab = createBottomTabNavigator<TeacherTabParamList>();
const SessionStack = createNativeStackNavigator<TeacherSessionStackParamList>();

const SessionStackNavigator: React.FC = () => {
  return (
    <SessionStack.Navigator
      initialRouteName="StartSession"
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}>
      <SessionStack.Screen
        name="StartSession"
        component={StartSessionScreen}
        options={{
          headerTitle: 'Start Attendance Session',
        }}
      />
      <SessionStack.Screen
        name="LiveSession"
        component={LiveSessionScreen}
        options={{
          headerTitle: 'Live Attendance Window',
          headerBackVisible: false,
        }}
      />
    </SessionStack.Navigator>
  );
};

export const TeacherNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="DashboardTab"
      screenOptions={({route}) => ({
        headerShown: route.name !== 'StartSessionTab',
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
          } else if (route.name === 'StartSessionTab') {
            iconName = focused ? 'play-circle' : 'play-circle-outline';
          } else if (route.name === 'HistoryTab') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon name={iconName} size={size || 22} color={color} />;
        },
      })}>
      <Tab.Screen
        name="DashboardTab"
        component={TeacherDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          headerTitle: 'Instructor Dashboard',
        }}
      />
      <Tab.Screen
        name="StartSessionTab"
        component={SessionStackNavigator}
        options={{
          tabBarLabel: 'Start Session',
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={TeacherHistoryScreen}
        options={{
          tabBarLabel: 'History',
          headerTitle: 'Session Archives',
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={TeacherProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          headerTitle: 'Faculty Account',
        }}
      />
    </Tab.Navigator>
  );
};
