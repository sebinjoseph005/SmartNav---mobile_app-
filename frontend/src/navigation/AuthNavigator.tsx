import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import EmailLoginScreen from '../screens/auth/EmailLoginScreen';

const AuthStack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <AuthStack.Navigator id="AuthStack" screenOptions={{ headerShown: false }}>
      {/* ✅ FIRST SCREEN */}
      <AuthStack.Screen name="Splash" component={SplashScreen} />

      <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="EmailLogin" component={EmailLoginScreen} />
    </AuthStack.Navigator>
  );
}
