import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../../screens/settings/ProfileScreen';
import EditProfileScreen from '../../screens/settings/EditProfileScreen';
import SavedTripsScreen from '../../screens/settings/SavedTripsScreen';
import SettingsScreen from '../../screens/settings/SettingsScreen';
import AIItineraryResult from '../../screens/trip-planning/AIItineraryResult';
import NotificationsScreen from '../../screens/home/NotificationsScreen';
import MyPostsScreen from '../../screens/settings/MyPostsScreen';

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator id="ProfileStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="SavedTrips" component={SavedTripsScreen} />
      <Stack.Screen name="AppSettings" component={SettingsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="AIItineraryResult" component={AIItineraryResult} />
      <Stack.Screen name="MyPosts" component={MyPostsScreen} />
    </Stack.Navigator>
  );
}
