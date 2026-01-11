import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';

const Stack = createNativeStackNavigator();

function MapPlaceholder() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0B1220', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff' }}>Map Screen</Text>
    </View>
  );
}

export default function MapStack() {
  return (
    <Stack.Navigator id="MapStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MapMain" component={MapPlaceholder} />
    </Stack.Navigator>
  );
}
