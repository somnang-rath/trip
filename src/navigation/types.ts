import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type AuthStackParams = {
  Login: undefined;
  Register: undefined;
};

export type AppTabParams = {
  Home: undefined;
  Chats: undefined;
  Scan: undefined;
  Friends: undefined;
  Profile: undefined;
};

export type RootStackParams = {
  Auth: undefined;
  App: undefined;
  GroupDetail: { groupId: string };
  Chat: { groupId: string; groupName: string };
  Map: { groupId: string; groupName: string };
  Itinerary: { groupId: string; groupName: string };
  Expenses: { groupId: string; groupName: string };
  CreateGroup: undefined;
  JoinGroup: { scan?: boolean } | undefined;
  ArchivedTrips: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  DmChat: { conversationId: string; peerId: string; peerName: string };
};

export type AuthNavProp = NativeStackNavigationProp<AuthStackParams>;
export type RootNavProp = NativeStackNavigationProp<RootStackParams>;
export type TabNavProp = BottomTabNavigationProp<AppTabParams>;
