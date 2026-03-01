import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CommunityFeed from '../../screens/community/CommunityFeed';
import BlogDetail from '../../screens/community/BlogDetail';
import CreateBlog from '../../screens/community/CreateBlog';
import CreateBuddyPost from '../../screens/community/UserProfilePublic';
import BuddyChatScreen from '../../screens/community/BuddyChatScreen';

const Stack = createNativeStackNavigator();

export default function CommunityStack() {
  return (
    <Stack.Navigator id="CommunityStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CommunityMain" component={CommunityFeed} />
      <Stack.Screen name="BlogDetail" component={BlogDetail} />
      <Stack.Screen name="CreateStory" component={CreateBlog} />
      <Stack.Screen name="CreateBuddyPost" component={CreateBuddyPost} />
      <Stack.Screen name="BuddyChat" component={BuddyChatScreen} />
    </Stack.Navigator>
  );
}
