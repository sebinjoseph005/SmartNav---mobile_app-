import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeDashboard from '../../screens/home/HomeDashboard';
import WeatherDetails from '../../screens/home/WeatherDetails';
import TripBudgetScreen from '../../screens/budget/TripBudgetScreen';
import TripPlannerInput from '../../screens/trip-planning/TripPlannerInput';
import AIItineraryLoading from '../../screens/trip-planning/AIItineraryLoading';
import AIItineraryResult from '../../screens/trip-planning/AIItineraryResult';
import EditItinerary from '../../screens/trip-planning/EditItinerary';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator id="HomeStack" screenOptions={{ headerShown: false }}>
      {/* HOME */}
      <Stack.Screen
        name="HomeMain"
        component={HomeDashboard}
      />

      {/* WEATHER DETAILS */}
      <Stack.Screen
        name="WeatherDetails"
        component={WeatherDetails}
      />

      {/* TRIP BUDGET - Budget Overview & Tracking */}
      <Stack.Screen
        name="TripBudget"
        component={TripBudgetScreen}
      />

      {/* TRIP PLANNING */}
      <Stack.Screen
        name="TripPlanner"
        component={TripPlannerInput}
      />
      <Stack.Screen
        name="AIItineraryLoading"
        component={AIItineraryLoading}
      />
      <Stack.Screen
        name="AIItineraryResult"
        component={AIItineraryResult}
      />
      <Stack.Screen
        name="EditItinerary"
        component={EditItinerary}
      />
    </Stack.Navigator>
  );
}
