
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';

const Stack = createNativeStackNavigator();

function CommunityPlaceholder() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0B1220', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff' }}>Community Screen</Text>
    </View>
  );
}

export default function CommunityStack() {
  return (
    <Stack.Navigator id="CommunityStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CommunityMain" component={CommunityPlaceholder} />
    </Stack.Navigator>
  );
}
