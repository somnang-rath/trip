import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Keyboard, QrCode, Camera as CameraIcon, ScanLine, X } from 'lucide-react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { RootNavProp, RootStackParams } from '../../navigation/types';
import { useJoinGroup } from '../../hooks/useGroups';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { parseInviteCode } from '../../utils/inviteCode';

type Mode = 'code' | 'scan';
type Route = RouteProp<RootStackParams, 'JoinGroup'>;

export function JoinGroupScreen() {
  const navigation = useNavigation<RootNavProp>();
  const route = useRoute<Route>();
  const startInScanMode = route.params?.scan === true;
  const { mutate: join, isPending } = useJoinGroup();
  const [mode, setMode] = useState<Mode>(startInScanMode ? 'scan' : 'code');
  const [code, setCode] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const handledRef = useRef(false);
  const autoRequestedRef = useRef(false);

  // Hide the navigator header when launched as a full-screen camera so the
  // viewfinder owns the screen.
  useEffect(() => {
    navigation.setOptions(
      startInScanMode && mode === 'scan'
        ? { headerShown: false }
        : { headerShown: true, title: 'Join Trip' },
    );
  }, [navigation, startInScanMode, mode]);

  // Auto-request camera permission when arriving via the Scan tab.
  useEffect(() => {
    if (!startInScanMode || autoRequestedRef.current) return;
    autoRequestedRef.current = true;
    if (!permission) return;
    if (!permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [startInScanMode, permission, requestPermission]);

  const submit = useCallback(
    (raw: string) => {
      const parsed = parseInviteCode(raw);
      if (!parsed) {
        Alert.alert('Invalid code', 'Invite codes are 8 characters, letters and numbers only.');
        handledRef.current = false;
        return;
      }
      join(parsed, {
        onSuccess: (group) => navigation.replace('GroupDetail', { groupId: group._id }),
        onError: (err: any) => {
          handledRef.current = false;
          const msg = err?.response?.data?.message;
          Alert.alert(
            'Could not join',
            Array.isArray(msg) ? msg.join('\n') : msg ?? 'Invalid or expired invite code',
          );
        },
      });
    },
    [join, navigation],
  );

  const onScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (handledRef.current) return;
      handledRef.current = true;
      submit(data);
    },
    [submit],
  );

  function handleManualSubmit() {
    if (code.trim().length !== 8) {
      Alert.alert('Invalid code', 'Invite codes are 8 characters');
      return;
    }
    submit(code);
  }

  async function switchToScan() {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert(
          'Camera permission needed',
          'Allow camera access in Settings to scan QR invite codes.',
        );
        return;
      }
    }
    handledRef.current = false;
    setMode('scan');
  }

  // ── Full-screen camera when launched via the Scan tab ─────────────────────
  if (startInScanMode && mode === 'scan') {
    return (
      <FullScreenScanner
        permission={permission}
        requestPermission={requestPermission}
        onScanned={onScanned}
        joining={isPending}
        onClose={() => navigation.goBack()}
        onSwitchToCode={() => setMode('code')}
      />
    );
  }

  // ── Standard form (manual code entry, with optional inline scan) ──────────
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg-light dark:bg-bg-dark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="px-5 pt-4 flex-1">
        <Text className="text-slate-600 dark:text-slate-300 text-sm leading-5 mb-4">
          Have an invite from a friend? Enter the 8-character code or scan the QR they share with you.
        </Text>

        <View className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-1.5 flex-row gap-1 mb-5">
          <TouchableOpacity
            onPress={() => setMode('code')}
            activeOpacity={0.8}
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl ${
              mode === 'code' ? 'bg-primary' : ''
            }`}
          >
            <Keyboard size={15} color={mode === 'code' ? '#fff' : '#6366f1'} />
            <Text
              className={`text-[13px] font-semibold ${
                mode === 'code' ? 'text-white' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              Enter Code
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={mode === 'scan' ? () => setMode('code') : switchToScan}
            activeOpacity={0.8}
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl ${
              mode === 'scan' ? 'bg-primary' : ''
            }`}
          >
            <QrCode size={15} color={mode === 'scan' ? '#fff' : '#6366f1'} />
            <Text
              className={`text-[13px] font-semibold ${
                mode === 'scan' ? 'text-white' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              Scan QR
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'code' ? (
          <View>
            <Input
              label="Invite Code"
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase())}
              placeholder="A1B2C3D4"
              autoCapitalize="characters"
              maxLength={8}
              style={{ letterSpacing: 6, fontSize: 22, textAlign: 'center', fontWeight: '700' }}
            />
            <Button title="Join Trip" onPress={handleManualSubmit} loading={isPending} />
            <TouchableOpacity
              onPress={switchToScan}
              activeOpacity={0.7}
              className="mt-4 flex-row items-center justify-center gap-1.5"
            >
              <CameraIcon size={14} color="#6366f1" />
              <Text className="text-primary text-[13px] font-semibold">Scan a QR code instead</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <InlineScanner
            permission={permission}
            requestPermission={requestPermission}
            onScanned={onScanned}
            joining={isPending}
            onCancel={() => setMode('code')}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Full-bleed camera UI ────────────────────────────────────────────────────
function FullScreenScanner({
  permission,
  requestPermission,
  onScanned,
  joining,
  onClose,
  onSwitchToCode,
}: {
  permission: ReturnType<typeof useCameraPermissions>[0];
  requestPermission: ReturnType<typeof useCameraPermissions>[1];
  onScanned: (r: BarcodeScanningResult) => void;
  joining: boolean;
  onClose: () => void;
  onSwitchToCode: () => void;
}) {
  if (!permission) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#fff" />
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View className="flex-1 bg-bg-light dark:bg-bg-dark items-center justify-center p-6">
        <View className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-950 items-center justify-center mb-3">
          <CameraIcon size={28} color="#6366f1" />
        </View>
        <Text className="text-slate-900 dark:text-white text-lg font-bold mb-1.5">
          Camera access needed
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-[13px] text-center mb-5">
          Allow camera access to scan invite QR codes from your friends.
        </Text>
        <Button title="Grant access" onPress={requestPermission} />
        <TouchableOpacity onPress={onSwitchToCode} className="mt-4">
          <Text className="text-primary text-[13px] font-semibold">Enter code instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={joining ? undefined : onScanned}
      />

      {/* Top control bar */}
      <View
        className="absolute top-0 left-0 right-0 flex-row items-center justify-between px-5"
        style={{ paddingTop: Platform.OS === 'ios' ? 56 : 24 }}
      >
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.8}
          accessibilityLabel="Close scanner"
          className="w-10 h-10 rounded-full bg-black/60 items-center justify-center"
        >
          <X size={20} color="#fff" />
        </TouchableOpacity>
        <View className="bg-black/60 rounded-full px-3.5 py-2 flex-row items-center gap-1.5">
          <ScanLine size={14} color="#fff" />
          <Text className="text-white text-[12px] font-semibold">Scan QR invite</Text>
        </View>
        <View className="w-10" />
      </View>

      {/* Viewfinder window with corner brackets */}
      <View className="absolute inset-0 items-center justify-center pointer-events-none">
        <View className="w-72 h-72 relative">
          <View className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
          <View className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
          <View className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
          <View className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-2xl" />
        </View>
      </View>

      {/* Bottom hint + manual fallback */}
      <View
        className="absolute bottom-0 left-0 right-0 items-center px-6"
        style={{ paddingBottom: Platform.OS === 'ios' ? 40 : 28 }}
      >
        <Text className="text-white/90 text-[14px] text-center mb-4">
          Point your camera at a TripSync invite QR
        </Text>
        <TouchableOpacity
          onPress={onSwitchToCode}
          activeOpacity={0.85}
          className="bg-white/15 rounded-full px-5 py-2.5 flex-row items-center gap-2 border border-white/30"
        >
          <Keyboard size={14} color="#fff" />
          <Text className="text-white text-[13px] font-semibold">Enter code instead</Text>
        </TouchableOpacity>

        {joining && (
          <View className="mt-4 bg-black/70 rounded-full px-4 py-2 flex-row items-center gap-2">
            <ActivityIndicator color="#fff" size="small" />
            <Text className="text-white text-xs font-semibold">Joining trip…</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Inline scanner (used when the user toggles to scan from the form) ──────
function InlineScanner({
  permission,
  requestPermission,
  onScanned,
  joining,
  onCancel,
}: {
  permission: ReturnType<typeof useCameraPermissions>[0];
  requestPermission: ReturnType<typeof useCameraPermissions>[1];
  onScanned: (r: BarcodeScanningResult) => void;
  joining: boolean;
  onCancel: () => void;
}) {
  if (!permission) {
    return <ActivityIndicator className="flex-1" color="#6366f1" />;
  }
  if (!permission.granted) {
    return (
      <View className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-3xl p-6 items-center">
        <View className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-950 items-center justify-center mb-3">
          <CameraIcon size={28} color="#6366f1" />
        </View>
        <Text className="text-slate-900 dark:text-white text-base font-bold mb-1.5">
          Camera access needed
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-[13px] text-center mb-5">
          Allow camera access to scan invite QR codes from your friends.
        </Text>
        <Button title="Grant access" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View className="rounded-3xl overflow-hidden border border-border-light dark:border-border-dark bg-black aspect-square w-full self-center">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={joining ? undefined : onScanned}
      />
      <View className="absolute inset-0 items-center justify-center">
        <View className="w-56 h-56 border-2 border-white/80 rounded-3xl" />
        <View className="absolute top-4 right-4 left-4 flex-row justify-between">
          <View className="bg-black/50 rounded-full px-3 py-1.5 flex-row items-center gap-1.5">
            <ScanLine size={13} color="#fff" />
            <Text className="text-white text-[11px] font-semibold">Scanning</Text>
          </View>
          <TouchableOpacity
            onPress={onCancel}
            className="bg-black/50 rounded-full px-3 py-1.5"
            activeOpacity={0.8}
          >
            <Text className="text-white text-[11px] font-semibold">Cancel</Text>
          </TouchableOpacity>
        </View>
        {joining && (
          <View className="absolute bottom-6 bg-black/70 rounded-full px-4 py-2 flex-row items-center gap-2">
            <ActivityIndicator color="#fff" size="small" />
            <Text className="text-white text-xs font-semibold">Joining trip…</Text>
          </View>
        )}
      </View>
    </View>
  );
}
