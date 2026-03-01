import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SafetyDashboard from '../../screens/safety-emergency/SafetyDashboard';
import ScamAlertScreen from '../../screens/safety-emergency/ScamAlertScreen';
import CrowdInsightScreen from '../../screens/home/CrowdInsightScreen';
import QuietPlacesScreen from '../../screens/home/QuietPlacesScreen';

const Stack = createNativeStackNavigator();

export default function SafetyStack() {
  return (
    <Stack.Navigator id="SafetyStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SafetyMain" component={SafetyDashboard} />
      <Stack.Screen name="ScamAlert" component={ScamAlertScreen} />
      <Stack.Screen name="CrowdInsight" component={CrowdInsightScreen} />
      <Stack.Screen name="QuietPlaces" component={QuietPlacesScreen} />
    </Stack.Navigator>
  );
}
