import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import OnboardingScreen from '../screens/auth/OnboardingScreen';
import EmailLoginScreen from '../screens/auth/EmailLoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

const AuthStack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      
      <AuthStack.Screen
        name="Onboarding"
        component={OnboardingScreen}
      />

      <AuthStack.Screen
        name="EmailLogin"
        component={EmailLoginScreen}
      />

      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
      />

    </AuthStack.Navigator>
  );
};

export default AuthNavigator;
