import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TripPlannerInput from '../../screens/trip-planning/TripPlannerInput';
import AIItineraryLoading from '../../screens/trip-planning/AIItineraryLoading';
import AIItineraryResult from '../../screens/trip-planning/AIItineraryResult';
import EditItinerary from '../../screens/trip-planning/EditItinerary';

const Stack = createNativeStackNavigator();

export default function TripStack() {
  return (
    <Stack.Navigator id="TripStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TripPlanner" component={TripPlannerInput} />
      <Stack.Screen name="AIItineraryLoading" component={AIItineraryLoading} />
      <Stack.Screen name="AIItineraryResult" component={AIItineraryResult} />
      <Stack.Screen name="EditItinerary" component={EditItinerary} />
    </Stack.Navigator>
  );
}
