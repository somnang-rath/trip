import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Switch,
  TextInput,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  useColorScheme as useRNColorScheme,
} from 'react-native';
import {
  MessageCircle,
  Map as MapIcon,
  Calendar,
  Wallet,
  MapPin,
  AlertTriangle,
  QrCode,
  Share2,
  X,
  Bell,
  BellOff,
  Check,
  RefreshCw,
  LogOut,
  Crown,
  Shield,
  UserX,
  Archive,
  Trash2,
  Pin as PinIcon,
  type LucideIcon,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { RootNavProp, RootStackParams } from '../../navigation/types';
import {
  useGroup,
  useLeaveGroup,
  useRegenerateInviteCode,
  useRemoveMember,
  useArchiveGroup,
  useDeleteGroup,
  useUpdateGroup,
} from '../../hooks/useGroups';
import { useGroupMute, useMuteGroup, useUnmuteGroup } from '../../hooks/useMutes';
import { useAuthStore } from '../../store/auth.store';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { buildInviteUrl } from '../../utils/inviteCode';

type Route = RouteProp<RootStackParams, 'GroupDetail'>;

interface QuickLinkProps {
  Icon: LucideIcon;
  label: string;
  onPress: () => void;
}

function QuickLink({ Icon, label, onPress }: QuickLinkProps) {
  return (
    <TouchableOpacity
      className="flex-1 min-w-[45%] bg-surface-light dark:bg-surface-dark rounded-2xl p-4 items-center border border-border-light dark:border-border-dark"
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View className="w-11 h-11 rounded-full bg-indigo-100 dark:bg-indigo-950 items-center justify-center mb-2">
        <Icon size={22} color="#6366f1" />
      </View>
      <Text className="text-slate-700 dark:text-slate-300 text-sm font-medium">{label}</Text>
    </TouchableOpacity>
  );
}

interface MuteOption {
  label: string;
  /** Hours to mute, or null for "until I unmute". */
  hours: number | null;
}

const MUTE_OPTIONS: MuteOption[] = [
  { label: 'For 1 hour', hours: 1 },
  { label: 'For 8 hours', hours: 8 },
  { label: 'For 1 day', hours: 24 },
  { label: 'For 1 week', hours: 24 * 7 },
  { label: 'Until I unmute', hours: null },
];

function formatMutedUntil(until: Date | null): string {
  if (!until) return 'Muted until you unmute';
  const diffMs = until.getTime() - Date.now();
  if (diffMs <= 0) return 'Muted';
  const hours = Math.round(diffMs / 3_600_000);
  if (hours < 24) return `Muted for ${hours}h`;
  const days = Math.round(hours / 24);
  return `Muted for ${days}d`;
}

function NotificationsCard({
  groupId,
  onOpenPicker,
  onUnmute,
}: {
  groupId: string;
  onOpenPicker: () => void;
  onUnmute: () => void;
}) {
  const { isMuted, until } = useGroupMute(groupId);
  const Icon = isMuted ? BellOff : Bell;
  return (
    <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 mb-4 border border-border-light dark:border-border-dark flex-row items-center">
      <View
        className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
          isMuted ? 'bg-slate-200 dark:bg-slate-700' : 'bg-indigo-100 dark:bg-indigo-950'
        }`}
      >
        <Icon size={18} color={isMuted ? '#94a3b8' : '#6366f1'} />
      </View>
      <View className="flex-1">
        <Text className="text-slate-900 dark:text-white text-[15px] font-semibold">
          Notifications
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
          {isMuted ? formatMutedUntil(until) : 'You receive chat, expense, and member alerts'}
        </Text>
      </View>
      <TouchableOpacity
        onPress={isMuted ? onUnmute : onOpenPicker}
        activeOpacity={0.85}
        className={`rounded-xl px-4 py-2 ${
          isMuted ? 'bg-primary' : 'bg-slate-100 dark:bg-slate-800 border border-border-light dark:border-border-dark'
        }`}
      >
        <Text
          className={`text-[13px] font-semibold ${
            isMuted ? 'text-white' : 'text-slate-800 dark:text-white'
          }`}
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function SheetShell({
  visible,
  onClose,
  keyboardAvoid,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  keyboardAvoid?: boolean;
  children: React.ReactNode;
}) {
  const Wrapper: React.ComponentType<{ children: React.ReactNode }> = keyboardAvoid
    ? ({ children: c }) => (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end"
        >
          {c}
        </KeyboardAvoidingView>
      )
    : ({ children: c }) => <View className="flex-1 justify-end">{c}</View>;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Wrapper>
        <Pressable className="absolute inset-0 bg-black/70" onPress={onClose} />
        <View className="bg-surface-light dark:bg-surface-dark rounded-t-3xl">
          <View className="items-center py-2">
            <View className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          </View>
          {children}
        </View>
      </Wrapper>
    </Modal>
  );
}

function DeleteTripModal({
  visible,
  groupName,
  deleting,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  groupName: string;
  deleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [typed, setTyped] = useState('');
  const matches = typed.trim() === groupName.trim();

  React.useEffect(() => {
    if (!visible) setTyped('');
  }, [visible]);

  return (
    <SheetShell visible={visible} onClose={onClose} keyboardAvoid>
      <View className="px-6 pt-2 pb-8">
        <View className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 items-center justify-center mb-3 self-center">
          <Trash2 size={22} color="#ef4444" />
        </View>
        <Text className="text-slate-900 dark:text-white text-lg font-bold text-center mb-1">
          Delete this trip?
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-[13px] text-center mb-4 leading-5">
          All chat messages, expenses, location history, and itinerary items will be
          permanently deleted for everyone in the trip. This cannot be undone.
        </Text>
        <Text className="text-slate-600 dark:text-slate-300 text-[13px] mb-2">
          Type <Text className="font-bold text-slate-900 dark:text-white">{groupName}</Text> to confirm:
        </Text>
        <TextInput
          value={typed}
          onChangeText={setTyped}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={groupName}
          placeholderTextColor="#94a3b8"
          className="bg-bg-light dark:bg-bg-dark rounded-xl px-3.5 py-3 text-slate-900 dark:text-white text-[15px] border border-border-light dark:border-border-dark mb-4"
        />
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.85}
            disabled={deleting}
            className="flex-1 rounded-xl py-3 items-center bg-slate-100 dark:bg-slate-800 border border-border-light dark:border-border-dark"
          >
            <Text className="text-slate-800 dark:text-white font-semibold text-[14px]">
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            disabled={!matches || deleting}
            activeOpacity={0.85}
            className={`flex-1 rounded-xl py-3 items-center flex-row justify-center gap-2 ${
              matches ? 'bg-red-600' : 'bg-red-200 dark:bg-red-900/40'
            }`}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Trash2 size={14} color="#fff" />
            )}
            <Text className="text-white font-semibold text-[14px]">
              {deleting ? 'Deleting…' : 'Delete trip'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SheetShell>
  );
}

function MutePickerModal({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (hours: number | null) => void;
}) {
  return (
    <SheetShell visible={visible} onClose={onClose}>
      <View className="px-5 pt-2 pb-6">
        <View className="flex-row items-start justify-between mb-4">
          <View>
            <Text className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
              Mute notifications
            </Text>
            <Text className="text-slate-900 dark:text-white text-lg font-bold mt-0.5">
              For how long?
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityLabel="Close">
            <X size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {MUTE_OPTIONS.map((opt, i) => (
          <TouchableOpacity
            key={opt.label}
            onPress={() => onPick(opt.hours)}
            activeOpacity={0.7}
            className={`flex-row items-center justify-between py-3.5 ${
              i === MUTE_OPTIONS.length - 1
                ? ''
                : 'border-b border-border-light dark:border-border-dark'
            }`}
          >
            <Text className="text-slate-900 dark:text-white text-[15px]">{opt.label}</Text>
            <Check size={16} color="transparent" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.7}
          className="mt-3 py-3.5 items-center"
        >
          <Text className="text-primary text-[14px] font-semibold">Cancel</Text>
        </TouchableOpacity>
      </View>
    </SheetShell>
  );
}

function InviteCard({
  groupName,
  inviteCode,
  canRegenerate,
  regenerating,
  onShowQr,
  onShare,
  onRegenerate,
}: {
  groupName: string;
  inviteCode: string;
  canRegenerate: boolean;
  regenerating: boolean;
  onShowQr: () => void;
  onShare: () => void;
  onRegenerate: () => void;
}) {
  return (
    <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 mb-6 border border-border-light dark:border-border-dark">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
          Invite friends
        </Text>
        {canRegenerate && (
          <TouchableOpacity
            onPress={onRegenerate}
            disabled={regenerating}
            activeOpacity={0.7}
            accessibilityLabel="Regenerate invite code"
            className="flex-row items-center gap-1 rounded-full px-2.5 py-1 bg-slate-100 dark:bg-slate-800"
          >
            {regenerating ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <RefreshCw size={12} color="#6366f1" />
            )}
            <Text className="text-primary text-[11px] font-semibold">
              {regenerating ? 'Updating' : 'New code'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-primary font-extrabold text-2xl tracking-widest">
            {inviteCode}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-[12px] mt-1">
            Share this code or QR with friends to join {groupName}.
          </Text>
        </View>
      </View>
      <View className="flex-row gap-2 mt-3.5">
        <TouchableOpacity
          onPress={onShowQr}
          activeOpacity={0.85}
          className="flex-1 bg-primary rounded-xl py-2.5 items-center flex-row justify-center gap-1.5"
        >
          <QrCode size={15} color="#fff" />
          <Text className="text-white font-semibold text-[13px]">Show QR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onShare}
          activeOpacity={0.85}
          className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl py-2.5 items-center flex-row justify-center gap-1.5 border border-border-light dark:border-border-dark"
        >
          <Share2 size={15} color="#6366f1" />
          <Text className="text-slate-800 dark:text-white font-semibold text-[13px]">Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TripSettingsCard({
  membersCanPin,
  saving,
  onTogglePin,
}: {
  membersCanPin: boolean;
  saving: boolean;
  onTogglePin: (value: boolean) => void;
}) {
  return (
    <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 mb-4 border border-border-light dark:border-border-dark">
      <Text className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold mb-3">
        Trip settings
      </Text>
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950 items-center justify-center mr-3">
          <PinIcon size={18} color="#ef4444" />
        </View>
        <View className="flex-1 pr-3">
          <Text className="text-slate-900 dark:text-white text-[15px] font-semibold">
            Members can drop pins
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 leading-4">
            {membersCanPin
              ? 'Anyone in the trip can long-press the map to add a pin.'
              : 'Only owners and admins can add pins.'}
          </Text>
        </View>
        {saving ? (
          <ActivityIndicator size="small" color="#6366f1" />
        ) : (
          <Switch
            value={membersCanPin}
            onValueChange={onTogglePin}
            trackColor={{ false: '#cbd5e1', true: '#6366f1' }}
            thumbColor="#ffffff"
          />
        )}
      </View>
    </View>
  );
}

function QrModal({
  visible,
  groupName,
  inviteCode,
  onClose,
  onShare,
}: {
  visible: boolean;
  groupName: string;
  inviteCode: string;
  onClose: () => void;
  onShare: () => void;
}) {
  const scheme = useRNColorScheme();
  const dark = scheme === 'dark';

  return (
    <SheetShell visible={visible} onClose={onClose}>
      <View className="px-6 pt-2 pb-8">
        <View className="flex-row items-start justify-between mb-4">
          <View className="flex-1 pr-3">
            <Text className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
              Scan to join
            </Text>
            <Text className="text-slate-900 dark:text-white text-lg font-bold mt-0.5" numberOfLines={1}>
              {groupName}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close" hitSlop={10}>
            <X size={20} color={dark ? '#9ca3af' : '#64748b'} />
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-2xl p-5 items-center mb-4">
          <QRCode
            value={buildInviteUrl(inviteCode)}
            size={220}
            color="#0f172a"
            backgroundColor="#ffffff"
          />
        </View>

        <View className="bg-bg-light dark:bg-bg-dark rounded-xl py-3 items-center mb-4 border border-border-light dark:border-border-dark">
          <Text className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider mb-0.5">
            Invite code
          </Text>
          <Text className="text-primary text-2xl font-extrabold tracking-[6px]">
            {inviteCode}
          </Text>
        </View>

        <Button title="Share invite" onPress={onShare} />
      </View>
    </SheetShell>
  );
}

export function GroupDetailScreen() {
  const navigation = useNavigation<RootNavProp>();
  const { params } = useRoute<Route>();
  const { data: group, isLoading, error, refetch, isRefetching } = useGroup(params.groupId);
  const currentUserId = useAuthStore((s) => s.user?._id ?? null);
  const [qrVisible, setQrVisible] = useState(false);
  const [muteVisible, setMuteVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const muteMutation = useMuteGroup();
  const unmuteMutation = useUnmuteGroup();
  const leaveMutation = useLeaveGroup();
  const removeMutation = useRemoveMember(params.groupId);
  const regenMutation = useRegenerateInviteCode(params.groupId);
  const archiveMutation = useArchiveGroup(params.groupId);
  const deleteMutation = useDeleteGroup();
  const updateMutation = useUpdateGroup(params.groupId);

  // Permissions derived from the loaded group + current user.
  const { isOwner, canManage } = useMemo(() => {
    if (!group || !currentUserId) return { isOwner: false, canManage: false };
    const me = group.members.find((m) => m.user._id === currentUserId);
    const owner = group.owner === currentUserId;
    const admin = me?.role === 'admin' || me?.role === 'owner';
    return { isOwner: owner, canManage: owner || admin };
  }, [group, currentUserId]);

  function handlePickMute(hours: number | null) {
    setMuteVisible(false);
    const until = hours ? new Date(Date.now() + hours * 3_600_000) : null;
    muteMutation.mutate({ groupId: params.groupId, until });
  }

  function handleUnmute() {
    unmuteMutation.mutate(params.groupId);
  }

  function handleTogglePin(value: boolean) {
    updateMutation.mutate(
      { membersCanPin: value },
      {
        onError: (err: any) =>
          Alert.alert(
            'Could not update setting',
            err?.response?.data?.message ?? 'Please try again.',
          ),
      },
    );
  }

  function handleRegenerate() {
    if (!group) return;
    Alert.alert(
      'Regenerate invite code?',
      `The current code "${group.inviteCode}" will stop working immediately. Anyone with the old code or QR won't be able to join — you'll need to share the new one.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: () =>
            regenMutation.mutate(undefined, {
              onError: (err: any) =>
                Alert.alert(
                  'Could not regenerate',
                  err?.response?.data?.message ?? 'Please try again.',
                ),
            }),
        },
      ],
    );
  }

  function handleRemoveMember(memberId: string, memberName: string) {
    Alert.alert(
      `Remove ${memberName}?`,
      'They will lose access to this trip immediately. They can rejoin later with a new invite.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            removeMutation.mutate(memberId, {
              onError: (err: any) =>
                Alert.alert(
                  'Could not remove',
                  err?.response?.data?.message ?? 'Please try again.',
                ),
            }),
        },
      ],
    );
  }

  function handleArchive() {
    if (!group) return;
    Alert.alert(
      `Archive ${group.name}?`,
      'The trip will move to your Archived list (Profile → Archived trips). Notifications stop, but the chat, expenses, and itinerary stay viewable. You can restore it any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: () =>
            archiveMutation.mutate(undefined, {
              onSuccess: () => navigation.popToTop(),
              onError: (err: any) =>
                Alert.alert(
                  'Could not archive',
                  err?.response?.data?.message ?? 'Please try again.',
                ),
            }),
        },
      ],
    );
  }

  function handleConfirmDelete() {
    deleteMutation.mutate(params.groupId, {
      onSuccess: () => {
        setDeleteVisible(false);
        navigation.popToTop();
      },
      onError: (err: any) => {
        setDeleteVisible(false);
        Alert.alert(
          'Could not delete',
          err?.response?.data?.message ?? 'Please try again.',
        );
      },
    });
  }

  function handleLeave() {
    if (!group) return;
    Alert.alert(
      `Leave ${group.name}?`,
      "You will lose access to the chat, expenses, itinerary, and live location. You can rejoin later if someone shares the invite.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () =>
            leaveMutation.mutate(params.groupId, {
              onSuccess: () => {
                // Pop back to the tabs stack — the trip is gone for this user.
                navigation.popToTop();
              },
              onError: (err: any) =>
                Alert.alert(
                  'Could not leave',
                  err?.response?.data?.message ?? 'Please try again.',
                ),
            }),
        },
      ],
    );
  }

  async function handleShare() {
    if (!group) return;
    try {
      await Share.share({
        message: `Join my trip "${group.name}" on TripSync.\n\nInvite code: ${group.inviteCode}\n${buildInviteUrl(group.inviteCode)}`,
      });
    } catch {
      // user dismissed share sheet
    }
  }

  if (isLoading) {
    return <ActivityIndicator className="flex-1 bg-bg-light dark:bg-bg-dark" color="#6366f1" size="large" />;
  }

  if (error || !group) {
    const err = error as any;
    const status = err?.response?.status;
    const apiMessage = err?.response?.data?.message;
    const detail = !err?.response
      ? 'Network request failed — backend unreachable'
      : Array.isArray(apiMessage)
        ? apiMessage.join('\n')
        : apiMessage ?? `Server returned ${status ?? 'an error'}`;
    return (
      <View className="flex-1 bg-bg-light dark:bg-bg-dark items-center justify-center p-6">
        <AlertTriangle size={40} color="#ef4444" />
        <Text className="text-slate-900 dark:text-white text-lg font-semibold mt-4 mb-1">
          Couldn't load trip
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-sm text-center mb-6">
          {detail}
        </Text>
        <Button title="Retry" onPress={() => refetch()} loading={isRefetching} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        className="flex-1 bg-bg-light dark:bg-bg-dark"
        contentContainerClassName="p-4 pb-10"
      >
        <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-5 mb-4 border border-border-light dark:border-border-dark">
          <Text className="text-slate-900 dark:text-white text-2xl font-extrabold mb-1.5">
            {group.name}
          </Text>
          {group.destination ? (
            <View className="flex-row items-center gap-1 mb-1.5">
              <MapPin size={16} color="#6366f1" />
              <Text className="text-indigo-700 dark:text-indigo-300 text-[15px]">{group.destination}</Text>
            </View>
          ) : null}
          {group.description ? (
            <Text className="text-slate-600 dark:text-slate-400 text-sm">{group.description}</Text>
          ) : null}
        </View>

        <NotificationsCard
          groupId={group._id}
          onOpenPicker={() => setMuteVisible(true)}
          onUnmute={handleUnmute}
        />

        <InviteCard
          groupName={group.name}
          inviteCode={group.inviteCode}
          canRegenerate={canManage}
          regenerating={regenMutation.isPending}
          onShowQr={() => setQrVisible(true)}
          onShare={handleShare}
          onRegenerate={handleRegenerate}
        />

        {canManage ? (
          <TripSettingsCard
            membersCanPin={group.membersCanPin}
            saving={updateMutation.isPending}
            onTogglePin={handleTogglePin}
          />
        ) : null}

        <Text className="text-slate-700 dark:text-slate-300 text-base font-semibold mb-3">Quick Actions</Text>
        <View className="flex-row flex-wrap gap-3 mb-6">
          <QuickLink
            Icon={MessageCircle}
            label="Chat"
            onPress={() => navigation.navigate('Chat', { groupId: group._id, groupName: group.name })}
          />
          <QuickLink
            Icon={MapIcon}
            label="Map"
            onPress={() => navigation.navigate('Map', { groupId: group._id, groupName: group.name })}
          />
          <QuickLink
            Icon={Calendar}
            label="Itinerary"
            onPress={() => navigation.navigate('Itinerary', { groupId: group._id, groupName: group.name })}
          />
          <QuickLink
            Icon={Wallet}
            label="Expenses"
            onPress={() => navigation.navigate('Expenses', { groupId: group._id, groupName: group.name })}
          />
        </View>

        <Text className="text-slate-700 dark:text-slate-300 text-base font-semibold mb-3">
          Members ({group.members.length})
        </Text>
        <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 border border-border-light dark:border-border-dark">
          {group.members.map((m, idx) => {
            const memberIsOwner = m.role === 'owner';
            const memberIsAdmin = m.role === 'admin';
            const isMe = m.user._id === currentUserId;
            const RoleIcon = memberIsOwner ? Crown : memberIsAdmin ? Shield : null;
            const showRemove = canManage && !memberIsOwner && !isMe;
            const isLast = idx === group.members.length - 1;
            return (
              <View
                key={m.user._id}
                className={`flex-row items-center ${isLast ? '' : 'mb-3.5'}`}
              >
                <Avatar name={m.user.name} uri={m.user.avatar} size={36} />
                <View className="ml-3 flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-slate-900 dark:text-white text-[15px] font-medium">
                      {m.user.name}
                    </Text>
                    {isMe ? (
                      <Text className="text-slate-400 dark:text-slate-500 text-[11px]">· you</Text>
                    ) : null}
                  </View>
                  <View className="flex-row items-center gap-1 mt-0.5">
                    {RoleIcon ? (
                      <RoleIcon size={11} color={memberIsOwner ? '#f59e0b' : '#6366f1'} />
                    ) : null}
                    <Text className="text-slate-500 dark:text-slate-400 text-xs capitalize">
                      {m.role}
                    </Text>
                  </View>
                </View>
                {showRemove ? (
                  <TouchableOpacity
                    onPress={() => handleRemoveMember(m.user._id, m.user.name)}
                    accessibilityLabel={`Remove ${m.user.name}`}
                    hitSlop={10}
                    className="p-1.5 rounded-full"
                  >
                    <UserX size={16} color="#ef4444" />
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}
        </View>

        <View className="mt-6 gap-2.5">
          {canManage ? (
            <TouchableOpacity
              onPress={handleArchive}
              disabled={archiveMutation.isPending}
              activeOpacity={0.85}
              className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark py-3.5 flex-row items-center justify-center gap-2"
            >
              {archiveMutation.isPending ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <Archive size={16} color="#6366f1" />
              )}
              <Text className="text-slate-800 dark:text-white font-semibold text-[14px]">
                {archiveMutation.isPending ? 'Archiving…' : 'Archive trip'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {!isOwner ? (
            <TouchableOpacity
              onPress={handleLeave}
              disabled={leaveMutation.isPending}
              activeOpacity={0.85}
              className="rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 py-3.5 flex-row items-center justify-center gap-2"
            >
              {leaveMutation.isPending ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <LogOut size={16} color="#ef4444" />
              )}
              <Text className="text-red-600 dark:text-red-400 font-semibold text-[14px]">
                {leaveMutation.isPending ? 'Leaving…' : 'Leave trip'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {isOwner ? (
            <TouchableOpacity
              onPress={() => setDeleteVisible(true)}
              activeOpacity={0.85}
              className="rounded-2xl bg-red-600 py-3.5 flex-row items-center justify-center gap-2"
            >
              <Trash2 size={16} color="#fff" />
              <Text className="text-white font-bold text-[14px]">Delete trip</Text>
            </TouchableOpacity>
          ) : null}

          {isOwner ? (
            <Text className="text-slate-400 dark:text-slate-600 text-[12px] text-center mt-1">
              As owner, you can archive (reversible) or delete (permanent). Transfer
              ownership first if you want to leave instead.
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <QrModal
        visible={qrVisible}
        groupName={group.name}
        inviteCode={group.inviteCode}
        onClose={() => setQrVisible(false)}
        onShare={handleShare}
      />

      <MutePickerModal
        visible={muteVisible}
        onClose={() => setMuteVisible(false)}
        onPick={handlePickMute}
      />

      <DeleteTripModal
        visible={deleteVisible}
        groupName={group.name}
        deleting={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteVisible(false)}
      />
    </>
  );
}
