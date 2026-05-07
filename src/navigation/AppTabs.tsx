import React from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator, type BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'nativewind';
import {
  Home as HomeIcon,
  User,
  QrCode,
  Users,
  MessageCircle,
} from 'lucide-react-native';
import type { AppTabParams } from './types';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ProfileScreen } from '../screens/home/ProfileScreen';
import { FriendsScreen } from '../screens/friends/FriendsScreen';
import { DmInboxScreen } from '../screens/chat/DmInboxScreen';

const Tab = createBottomTabNavigator<AppTabParams>();

// Placeholder — never actually rendered because tabPress is intercepted to navigate to JoinGroup
function ScanPlaceholder() {
  return <View />;
}

function ScanTabButton(props: BottomTabBarButtonProps) {
  return (
    <View className="flex-1 items-center justify-center">
      <TouchableOpacity
        onPress={(e) => props.onPress?.(e as any)}
        activeOpacity={0.85}
        accessibilityLabel="Scan invite QR"
        className="w-14 h-14 rounded-full bg-primary items-center justify-center -mt-7"
        style={{
          shadowColor: '#6366f1',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 8,
        }}
      >
        <QrCode size={26} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

export function AppTabs() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
          borderTopColor: isDark ? '#2d2d44' : '#e2e8f0',
          height: Platform.OS === 'ios' ? 86 : 64,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: isDark ? '#9ca3af' : '#64748b',
        headerStyle: { backgroundColor: isDark ? '#1a1a2e' : '#ffffff' },
        headerTintColor: isDark ? '#ffffff' : '#0f172a',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'My Trips',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <HomeIcon size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Chats"
        component={DmInboxScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanPlaceholder}
        options={{
          tabBarLabel: () => null,
          tabBarButton: (props) => <ScanTabButton {...props} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.getParent()?.navigate('JoinGroup', { scan: true });
          },
        })}
      />
      <Tab.Screen
        name="Friends"
        component={FriendsScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
