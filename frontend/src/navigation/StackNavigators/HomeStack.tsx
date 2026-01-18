import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeDashboard from '../../screens/home/HomeDashboard';
import WeatherDetails from '../../screens/home/WeatherDetails'; // ✅ ADD THIS

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator id="HomeStack" screenOptions={{ headerShown: false }}>
      {/* HOME */}
      <Stack.Screen
        name="HomeMain"
        component={HomeDashboard}
      />

      {/* WEATHER DETAILS */}
      <Stack.Screen
        name="WeatherDetails"
        component={WeatherDetails}
      />
    </Stack.Navigator>
  );
}
