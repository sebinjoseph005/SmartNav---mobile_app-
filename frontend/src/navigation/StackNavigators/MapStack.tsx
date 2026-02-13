import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainMapScreen from '../../screens/navigation-maps/MainMapScreen';
import SearchResults from '../../screens/navigation-maps/SearchResults';
import RouteSelection from '../../screens/navigation-maps/RouteSelection';
import ActiveNavigation from '../../screens/navigation-maps/ActiveNavigation';
import PlaceDetails from '../../screens/navigation-maps/PlaceDetails';

const Stack = createNativeStackNavigator();

export default function MapStack() {
  return (
    <Stack.Navigator id="MapStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MapMain" component={MainMapScreen} />
      <Stack.Screen name="SearchResults" component={SearchResults} />
      <Stack.Screen name="RouteSelection" component={RouteSelection} />
      <Stack.Screen name="ActiveNavigation" component={ActiveNavigation} />
      <Stack.Screen name="PlaceDetails" component={PlaceDetails} />
    </Stack.Navigator>
  );
}
