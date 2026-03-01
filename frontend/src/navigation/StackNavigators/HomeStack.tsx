import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeDashboard from '../../screens/home/HomeDashboard';
import WeatherDetails from '../../screens/home/WeatherDetails';
import CrowdInsightScreen from '../../screens/home/CrowdInsightScreen';
import QuietPlacesScreen from '../../screens/home/QuietPlacesScreen';
import AICompanionChat from '../../screens/home/AICompanionChat';
import TripBudgetScreen from '../../screens/budget/TripBudgetScreen';
import TripPlannerInput from '../../screens/trip-planning/TripPlannerInput';
import AIItineraryLoading from '../../screens/trip-planning/AIItineraryLoading';
import AIItineraryResult from '../../screens/trip-planning/AIItineraryResult';
import EditItinerary from '../../screens/trip-planning/EditItinerary';
import SafeHavenLocator from '../../screens/safety-emergency/SafeHavenLocator';

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

      {/* CROWD INSIGHT */}
      <Stack.Screen
        name="CrowdInsight"
        component={CrowdInsightScreen}
      />

      {/* QUIET PLACES */}
      <Stack.Screen
        name="QuietPlaces"
        component={QuietPlacesScreen}
      />

      {/* AI COMPANION */}
      <Stack.Screen
        name="AICompanion"
        component={AICompanionChat}
      />

      {/* SAFE HAVEN LOCATOR */}
      <Stack.Screen
        name="SafeHavenLocator"
        component={SafeHavenLocator}
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
