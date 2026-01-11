import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { House, Map, Users, Shield, User } from 'lucide-react-native';

import HomeStack from './StackNavigators/HomeStack';
import MapStack from './StackNavigators/MapStack';
import CommunityStack from './StackNavigators/CommunityStack';
import SafetyStack from './StackNavigators/SafetyStack';
import ProfileStack from './StackNavigators/ProfileStack';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator id="BottomTab"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0B1220',
          borderTopColor: '#1E293B',
          height: 64,
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#94A3B8',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <House size={24} color={focused ? '#2563EB' : '#94A3B8'} />
          ),
        }}
      />

      <Tab.Screen
        name="Map"
        component={MapStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <Map size={24} color={focused ? '#2563EB' : '#94A3B8'} />
          ),
        }}
      />

      <Tab.Screen
        name="Community"
        component={CommunityStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <Users size={24} color={focused ? '#2563EB' : '#94A3B8'} />
          ),
        }}
      />

      <Tab.Screen
        name="Safety"
        component={SafetyStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <Shield size={24} color={focused ? '#2563EB' : '#94A3B8'} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <User size={24} color={focused ? '#2563EB' : '#94A3B8'} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
