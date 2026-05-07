import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '../store/auth.store';
import type { RootStackParams } from './types';
import { AuthNavigator } from './AuthNavigator';
import { AppTabs } from './AppTabs';
import { GroupDetailScreen } from '../screens/group/GroupDetailScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { MapScreen } from '../screens/map/MapScreen';
import { ExpensesScreen } from '../screens/expenses/ExpensesScreen';
import { CreateGroupScreen } from '../screens/group/CreateGroupScreen';
import { JoinGroupScreen } from '../screens/group/JoinGroupScreen';
import { ItineraryScreen } from '../screens/group/ItineraryScreen';
import { ArchivedTripsScreen } from '../screens/group/ArchivedTripsScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { ChangePasswordScreen } from '../screens/profile/ChangePasswordScreen';
import { DmChatScreen } from '../screens/chat/DmChatScreen';

const Stack = createNativeStackNavigator<RootStackParams>();

export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack.Navigator
      screenOptions={{
        // Match the CSS variables in global.css so screen content blends
        // seamlessly with the navigator backdrop (no faint seam at edges
        // / during transitions).
        headerStyle: { backgroundColor: isDark ? '#1a1a2e' : '#ffffff' },
        headerTintColor: isDark ? '#ffffff' : '#0f172a',
        contentStyle: { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="App" component={AppTabs} options={{ headerShown: false }} />
          <Stack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ title: 'Trip' }} />
          <Stack.Screen name="Chat" component={ChatScreen} options={({ route }) => ({ title: route.params.groupName })} />
          <Stack.Screen name="Map" component={MapScreen} options={({ route }) => ({ title: route.params.groupName })} />
          <Stack.Screen name="Itinerary" component={ItineraryScreen} options={{ title: 'Itinerary' }} />
          <Stack.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'Expenses' }} />
          <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'Create Trip' }} />
          <Stack.Screen name="JoinGroup" component={JoinGroupScreen} options={{ title: 'Join Trip' }} />
          <Stack.Screen name="ArchivedTrips" component={ArchivedTripsScreen} options={{ title: 'Archived Trips' }} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit profile' }} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change password' }} />
          <Stack.Screen name="DmChat" component={DmChatScreen} options={({ route }) => ({ title: route.params.peerName })} />
        </>
      )}
    </Stack.Navigator>
  );
}
