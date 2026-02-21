import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthNavigator from './AuthNavigator';
import BottomTabNavigator from './BottomTabNavigator';
import EmergencySOS from '../screens/safety-emergency/EmergencySOS';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator id="RootStack" screenOptions={{ headerShown: false }}>
        {/* AUTH FLOW */}
        <Stack.Screen name="Auth" component={AuthNavigator} />

        {/* MAIN APP */}
        <Stack.Screen name="Main" component={BottomTabNavigator} />

        {/* SOS MODAL - Accessible from anywhere */}
        <Stack.Screen 
          name="SOS" 
          component={EmergencySOS}
          options={{
            presentation: 'fullScreenModal',
            animation: 'fade',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
