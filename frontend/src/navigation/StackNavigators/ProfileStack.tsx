import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';

const Stack = createNativeStackNavigator();

function ProfilePlaceholder() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0B1220', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff' }}>Profile Screen</Text>
    </View>
  );
}

export default function ProfileStack() {
  return (
    <Stack.Navigator id="ProfileStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfilePlaceholder} />
    </Stack.Navigator>
  );
}
