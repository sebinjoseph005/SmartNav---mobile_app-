import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';

const Stack = createNativeStackNavigator();

function HomePlaceholder() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0B1220', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff' }}>Home Screen</Text>
    </View>
  );
}

export default function HomeStack() {
  return (
    <Stack.Navigator id="HomeStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomePlaceholder} />
    </Stack.Navigator>
  );
}
