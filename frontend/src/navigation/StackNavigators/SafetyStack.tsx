import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';

const Stack = createNativeStackNavigator();

function SafetyPlaceholder() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0B1220', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff' }}>Safety Screen</Text>
    </View>
  );
}

export default function SafetyStack() {
  return (
    <Stack.Navigator id="SafetyStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SafetyMain" component={SafetyPlaceholder} />
    </Stack.Navigator>
  );
}
