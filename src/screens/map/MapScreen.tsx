import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { WebView, type WebViewMessageEvent } from "react-native-webview"
import * as Location from "expo-location"
import {
  MapPin,
  Maximize2,
  Map as MapIcon,
  Satellite,
  Mountain,
  Pin as PinIcon,
  Lock,
  Users,
  Locate,
  type LucideIcon,
} from "lucide-react-native"
import { useRoute, type RouteProp } from "@react-navigation/native"
import { useQueryClient } from "@tanstack/react-query"
import type { RootStackParams } from "../../navigation/types"
import { useSocketStore } from "../../store/socket.store"
import { useAuthStore } from "../../store/auth.store"
import { locationApi } from "../../api/location.api"
import { useGroup } from "../../hooks/useGroups"
import { useCreatePin, useDeletePin, usePins } from "../../hooks/usePins"
import type { MemberLocation } from "../../types/location.types"
import type { Pin } from "../../types/pin.types"
import { Input } from "../../components/ui/Input"
import { Button } from "../../components/ui/Button"
import { formatRelativeTime } from "../../utils/format"

type Route = RouteProp<RootStackParams, "Map">
type MapType = "standard" | "satellite" | "terrain"

const MAP_TYPES: { type: MapType; label: string; Icon: LucideIcon }[] = [
  { type: "standard", label: "Map", Icon: MapIcon },
  { type: "satellite", label: "Satellite", Icon: Satellite },
  { type: "terrain", label: "Terrain", Icon: Mountain },
]

function MapTypeSelector({
  value,
  onChange,
}: {
  value: MapType
  onChange: (t: MapType) => void
}) {
  return (
    <View
      className="bg-surface-light/95 dark:bg-surface-dark/95 rounded-full p-1 flex-row border border-border-light dark:border-border-dark"
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.16,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 14,
        elevation: 8,
      }}
    >
      {MAP_TYPES.map(({ type, label, Icon }) => {
        const active = value === type
        return (
          <TouchableOpacity
            key={type}
            onPress={() => onChange(type)}
            activeOpacity={0.7}
            accessibilityLabel={label}
            accessibilityRole="button"
            className={`flex-row items-center justify-center gap-1.5 ${
              active ? "px-3.5 py-2 rounded-full bg-primary" : "px-3 py-2"
            }`}
          >
            <Icon size={15} color={active ? "#ffffff" : "#64748b"} />
            {active && (
              <Text className="text-white text-[12px] font-semibold tracking-tight">
                {label}
              </Text>
            )}
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

function StatusChip({
  sharingCount,
  pinCount,
  canPlacePin,
}: {
  sharingCount: number
  pinCount: number
  canPlacePin: boolean
}) {
  const idle = sharingCount === 0 && pinCount === 0
  return (
    <View
      className="bg-surface-light/95 dark:bg-surface-dark/95 rounded-full px-3.5 py-1.5 border border-border-light dark:border-border-dark flex-row items-center gap-2"
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 3,
      }}
    >
      {idle ? (
        <Text className="text-slate-500 dark:text-slate-400 text-[11.5px] font-medium tracking-tight">
          No activity yet
        </Text>
      ) : (
        <>
          <View className="flex-row items-center gap-1">
            <Users size={11} color="#10b981" />
            <Text className="text-slate-700 dark:text-slate-200 text-[11.5px] font-semibold">
              {sharingCount}
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-[11.5px]">
              sharing
            </Text>
          </View>
          <View className="w-px h-3 bg-border-light dark:bg-border-dark" />
          <View className="flex-row items-center gap-1">
            <PinIcon size={11} color="#dc2626" />
            <Text className="text-slate-700 dark:text-slate-200 text-[11.5px] font-semibold">
              {pinCount}
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-[11.5px]">
              {pinCount === 1 ? "pin" : "pins"}
            </Text>
          </View>
        </>
      )}
      <View className="w-px h-3 bg-border-light dark:bg-border-dark" />
      {canPlacePin ? (
        <Text className="text-slate-500 dark:text-slate-400 text-[11px] tracking-tight">
          Long-press to drop
        </Text>
      ) : (
        <View className="flex-row items-center gap-1">
          <Lock size={10} color="#94a3b8" />
          <Text className="text-slate-500 dark:text-slate-400 text-[11px] tracking-tight">
            Admins only
          </Text>
        </View>
      )}
    </View>
  )
}

function FloatingIconButton({
  Icon,
  onPress,
  accessibilityLabel,
}: {
  Icon: LucideIcon
  onPress: () => void
  accessibilityLabel: string
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className="w-11 h-11 rounded-full bg-surface-light/95 dark:bg-surface-dark/95 border border-border-light dark:border-border-dark items-center justify-center"
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.14,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <Icon size={18} color="#475569" />
    </TouchableOpacity>
  )
}

function ShareButton({
  sharing,
  onPress,
}: {
  sharing: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      className={`rounded-2xl py-4 items-center flex-row justify-center gap-2 flex-1 ${
        sharing ? "bg-red-600" : "bg-primary"
      }`}
      style={{
        shadowColor: sharing ? "#dc2626" : "#4f46e5",
        shadowOpacity: 0.32,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 14,
        elevation: 7,
      }}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
    >
      {sharing ? (
        <View className="w-3.5 h-3.5 rounded-sm bg-white" />
      ) : (
        <MapPin size={16} color="#fff" />
      )}
      <Text className="text-white font-bold text-[15px] tracking-tight">
        {sharing ? "Stop sharing" : "Share my location"}
      </Text>
    </TouchableOpacity>
  )
}

// Static HTML — gets a one-time injection of OWN_USER_ID, then receives marker
// updates via window.postMessage (RN side calls webViewRef.injectJavaScript).
// Self-contained: Leaflet from unpkg, tiles from OSM / Esri / OpenTopoMap.
function buildMapHtml(ownUserId: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%;
      background: #eef2f7;
      -webkit-touch-callout: none; -webkit-user-select: none; user-select: none;
      -webkit-tap-highlight-color: transparent;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif;
    }

    /* === Member marker — avatar circle with anchor tail === */
    .member-pin { position: relative; width: 44px; height: 52px; }
    .member-pin .body {
      position: absolute; top: 0; left: 2px;
      width: 40px; height: 40px; border-radius: 9999px;
      background: #ffffff; border: 2px solid #ffffff;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18), 0 1px 2px rgba(15, 23, 42, 0.12);
      display: flex; align-items: center; justify-content: center;
    }
    .member-pin .ring {
      position: absolute; inset: 2px;
      border-radius: 9999px; border: 2.5px solid #6366f1;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px; color: #1e293b; letter-spacing: -0.2px;
    }
    .member-pin.own .ring { border-color: #10b981; color: #065f46; }
    /* Tail: small colored dot anchored to the actual coord */
    .member-pin .tail {
      position: absolute; bottom: 0; left: 50%;
      width: 8px; height: 8px; margin-left: -4px;
      border-radius: 9999px; background: #6366f1;
      box-shadow: 0 0 0 2px #ffffff, 0 2px 4px rgba(0,0,0,0.25);
    }
    .member-pin.own .tail { background: #10b981; }

    /* === Saved place pin — clean SVG drop pin === */
    .place-pin { width: 30px; height: 40px;
      filter: drop-shadow(0 4px 6px rgba(15, 23, 42, 0.28))
              drop-shadow(0 1px 1px rgba(15, 23, 42, 0.2));
    }
    .place-pin svg { display: block; width: 100%; height: 100%; }

    /* === Popups === */
    .leaflet-popup-content-wrapper {
      border-radius: 14px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18), 0 2px 6px rgba(15, 23, 42, 0.08);
      padding: 0;
    }
    .leaflet-popup-tip { box-shadow: 0 4px 8px rgba(15, 23, 42, 0.1); }
    .leaflet-popup-content { margin: 12px 14px; min-width: 160px; }
    .popup-name { font-weight: 600; font-size: 14px; color: #0f172a;
      letter-spacing: -0.2px; line-height: 1.3; }
    .popup-meta { font-size: 11.5px; color: #64748b; margin-top: 3px;
      font-variant-numeric: tabular-nums; }
    .popup-divider { height: 1px; background: #e2e8f0; margin: 10px -14px 8px; }
    .popup-delete { display: inline-flex; align-items: center; gap: 4px;
      padding: 5px 11px; background: #fef2f2; color: #b91c1c;
      border-radius: 8px; font-size: 12px; font-weight: 600;
      text-decoration: none; letter-spacing: -0.1px;
    }
    .popup-delete:active { background: #fee2e2; }

    /* Tile crossfade */
    .leaflet-tile { transition: opacity 240ms ease-out; }

    /* Hide Leaflet's default zoom control; we render our own RN-side */
    .leaflet-control-zoom { display: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const OWN_USER_ID = ${JSON.stringify(ownUserId)};
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true,
      zoomAnimation: true,
    }).setView([48.8566, 2.3522], 3);

    const TILE_PROVIDERS = {
      standard: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: { maxZoom: 19, subdomains: 'abc' },
      },
      satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        options: { maxZoom: 19 },
      },
      terrain: {
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        options: { maxZoom: 17, subdomains: 'abc' },
      },
    };

    let currentTileLayer = null;
    let currentMapType = null;
    function setMapType(type) {
      if (type === currentMapType) return;
      const provider = TILE_PROVIDERS[type];
      if (!provider) return;
      const next = L.tileLayer(provider.url, provider.options);
      next.addTo(map);
      if (currentTileLayer) {
        const old = currentTileLayer;
        // Wait for the new layer's first tiles before yanking the old one,
        // so users never see a flash of the gray background.
        next.once('load', () => map.removeLayer(old));
        // Safety net — if 'load' never fires (offline, slow tiles) drop the
        // old layer after 1.2s so memory doesn't keep climbing.
        setTimeout(() => { if (map.hasLayer(old)) map.removeLayer(old); }, 1200);
      }
      currentTileLayer = next;
      currentMapType = type;
    }
    setMapType('standard');

    const markers = new Map(); // userId -> { marker, lat, lng }
    const pinMarkers = new Map(); // pinId -> marker
    let canPlace = false; // toggled by RN once permissions are known

    function initial(name) {
      return (name || '?').trim().charAt(0).toUpperCase();
    }
    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
      })[c]);
    }
    function buildIcon(name, isOwn) {
      var html =
        '<div class="member-pin ' + (isOwn ? 'own' : '') + '">'
        + '  <div class="body"><div class="ring">' + escapeHtml(initial(name)) + '</div></div>'
        + '  <div class="tail"></div>'
        + '</div>';
      return L.divIcon({
        className: '',
        html: html,
        iconSize: [44, 52],
        iconAnchor: [22, 50],
        popupAnchor: [0, -44],
      });
    }
    function buildPlaceIcon() {
      // Two-tone SVG drop pin — silhouette + inner dot, no rotation hacks.
      var svg =
        '<svg viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">'
        + '<path d="M15 1.2c-7.18 0-13 5.82-13 13 0 9.62 11.43 23.5 12.4 24.66a.78.78 0 0 0 1.2 0C16.57 37.7 28 23.82 28 14.2c0-7.18-5.82-13-13-13z" fill="#dc2626" stroke="#ffffff" stroke-width="2"/>'
        + '<circle cx="15" cy="14" r="4.6" fill="#ffffff"/>'
        + '</svg>';
      return L.divIcon({
        className: '',
        html: '<div class="place-pin">' + svg + '</div>',
        iconSize: [30, 40],
        iconAnchor: [15, 38],
        popupAnchor: [0, -34],
      });
    }

    function upsert(loc) {
      const isOwn = loc.userId === OWN_USER_ID;
      const displayName = isOwn ? escapeHtml(loc.name) + ' (you)' : escapeHtml(loc.name);
      const popup = '<div class="popup-name">' + displayName + '</div>'
        + (loc.meta ? '<div class="popup-meta">Updated ' + escapeHtml(loc.meta) + '</div>' : '')
        + (loc.accuracy ? '<div class="popup-meta">Accuracy ±' + Math.round(loc.accuracy) + 'm</div>' : '');
      const existing = markers.get(loc.userId);
      if (existing) {
        existing.marker.setLatLng([loc.latitude, loc.longitude]);
        existing.marker.setPopupContent(popup);
        existing.lat = loc.latitude; existing.lng = loc.longitude;
      } else {
        const marker = L.marker([loc.latitude, loc.longitude], { icon: buildIcon(loc.name, isOwn) })
          .addTo(map).bindPopup(popup);
        markers.set(loc.userId, { marker, lat: loc.latitude, lng: loc.longitude });
      }
    }
    function removeMarker(userId) {
      const e = markers.get(userId);
      if (!e) return;
      map.removeLayer(e.marker);
      markers.delete(userId);
    }
    function setAll(list) {
      const incoming = new Set(list.map((l) => l.userId));
      for (const id of Array.from(markers.keys())) if (!incoming.has(id)) removeMarker(id);
      list.forEach(upsert);
    }

    function buildPinPopup(pin) {
      var html = '<div class="popup-name">' + escapeHtml(pin.label || 'Pinned location') + '</div>'
        + '<div class="popup-meta">Dropped by ' + escapeHtml(pin.creator || 'Unknown') + '</div>';
      if (pin.canDelete) {
        // Inline onclick so the popup HTML stays self-contained — Leaflet
        // re-renders the popup DOM each time it's opened.
        html += '<div class="popup-divider"></div>'
          + '<a href="javascript:void(0)" class="popup-delete" onclick="onPinDelete(\\'' + pin.pinId + '\\')">Remove pin</a>';
      }
      return html;
    }
    function upsertPin(pin) {
      const existing = pinMarkers.get(pin.pinId);
      if (existing) {
        existing.setLatLng([pin.latitude, pin.longitude]);
        existing.setPopupContent(buildPinPopup(pin));
      } else {
        const marker = L.marker([pin.latitude, pin.longitude], { icon: buildPlaceIcon() })
          .addTo(map).bindPopup(buildPinPopup(pin));
        pinMarkers.set(pin.pinId, marker);
      }
    }
    function removePin(pinId) {
      const m = pinMarkers.get(pinId);
      if (!m) return;
      map.removeLayer(m);
      pinMarkers.delete(pinId);
    }
    function setPins(list) {
      const incoming = new Set(list.map((p) => p.pinId));
      for (const id of Array.from(pinMarkers.keys())) if (!incoming.has(id)) removePin(id);
      list.forEach(upsertPin);
    }
    function onPinDelete(pinId) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pin:delete', pinId: pinId }));
      }
    }

    // Long-press detection — we register BOTH Leaflet's normalized 'mousedown'
    // (which fires for mouse and pointer) AND raw touchstart on the map
    // element, because some Android WebView versions don't bubble touch through
    // Leaflet's pipeline. The first one to trigger wins; clearPress on the
    // others. We also send a debug ping back to RN so we can prove the
    // event actually fired (visible in metro / on-screen alert).
    const LONG_PRESS_MS = 500;
    const MOVE_TOLERANCE_PX = 15;
    const mapEl = document.getElementById('map');
    let pressTimer = null;
    let pressLatLng = null;
    let pressXY = null;
    function postRN(payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }
    function clearPress() {
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      pressLatLng = null;
      pressXY = null;
    }
    function startPress(latlng, xy, source) {
      if (!canPlace) { postRN({ type: 'debug', msg: 'press blocked: canPlace=false' }); return; }
      if (pressTimer) return; // already armed
      pressLatLng = latlng;
      pressXY = xy;
      postRN({ type: 'debug', msg: 'press start ' + source });
      pressTimer = setTimeout(() => {
        if (!pressLatLng) return;
        postRN({
          type: 'pin:longpress',
          latitude: pressLatLng.lat,
          longitude: pressLatLng.lng,
        });
        clearPress();
      }, LONG_PRESS_MS);
    }
    // Path A: Leaflet's normalized mousedown (works for mouse + some touches).
    map.on('mousedown', (e) => {
      const cp = e.containerPoint;
      startPress(e.latlng, { x: cp.x, y: cp.y }, 'leaflet');
    });
    map.on('mouseup', clearPress);
    map.on('movestart', clearPress);
    map.on('zoomstart', clearPress);
    map.on('drag', clearPress);
    // Path B: raw touchstart on the map element (fallback for Android WebView).
    mapEl.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) { clearPress(); return; }
      const t = e.touches[0];
      const rect = mapEl.getBoundingClientRect();
      const cx = t.clientX - rect.left;
      const cy = t.clientY - rect.top;
      const latlng = map.containerPointToLatLng(L.point(cx, cy));
      startPress(latlng, { x: cx, y: cy }, 'touch');
    }, { passive: true });
    mapEl.addEventListener('touchmove', (e) => {
      if (!pressXY) return;
      const t = e.touches[0];
      const rect = mapEl.getBoundingClientRect();
      const dx = (t.clientX - rect.left) - pressXY.x;
      const dy = (t.clientY - rect.top) - pressXY.y;
      if (dx * dx + dy * dy > MOVE_TOLERANCE_PX * MOVE_TOLERANCE_PX) clearPress();
    }, { passive: true });
    mapEl.addEventListener('touchend', clearPress, { passive: true });
    mapEl.addEventListener('touchcancel', clearPress, { passive: true });
    // Block the native context menu so iOS doesn't show the callout on top.
    mapEl.addEventListener('contextmenu', (e) => e.preventDefault());

    function fitAll() {
      const all = []
        .concat(Array.from(markers.values()).map((m) => [m.lat, m.lng]))
        .concat(Array.from(pinMarkers.values()).map((m) => {
          const ll = m.getLatLng(); return [ll.lat, ll.lng];
        }));
      if (all.length === 0) return;
      const bounds = L.latLngBounds(all);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: true, duration: 0.6 });
    }
    function focusOwn() {
      const own = markers.get(OWN_USER_ID);
      if (own) map.flyTo([own.lat, own.lng], 14, { duration: 0.6 });
    }

    function handleCommand(raw) {
      try {
        const msg = JSON.parse(raw);
        if (msg.type === 'set') setAll(msg.locations);
        else if (msg.type === 'setPins') setPins(msg.pins);
        else if (msg.type === 'canPlace') canPlace = !!msg.value;
        else if (msg.type === 'fit') fitAll();
        else if (msg.type === 'focusOwn') focusOwn();
        else if (msg.type === 'mapType') setMapType(msg.value);
      } catch (e) {}
    }
    // RN posts messages two ways depending on platform; handle both.
    document.addEventListener('message', (e) => handleCommand(e.data));
    window.addEventListener('message', (e) => handleCommand(e.data));

    // Tell RN the map booted so it can flush any queued locations / map type.
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
    }
  </script>
</body>
</html>`
}

export function MapScreen() {
  const { params } = useRoute<Route>()
  const { groupId } = params
  const user = useAuthStore((s) => s.user)
  const locationSocket = useSocketStore((s) => s.locationSocket)
  const qc = useQueryClient()
  const webRef = useRef<WebView>(null)
  const webReady = useRef(false)

  const [locations, setLocations] = useState<MemberLocation[]>([])
  const [sharing, setSharing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mapType, setMapType] = useState<MapType>("standard")
  const [pendingPin, setPendingPin] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [pinLabel, setPinLabel] = useState("")
  const locationWatcher = useRef<Location.LocationSubscription | null>(null)

  const { data: group } = useGroup(groupId)
  const { data: pins = [] } = usePins(groupId)
  const { mutate: createPin, isPending: creatingPin } = useCreatePin(groupId)
  const { mutate: deletePin } = useDeletePin(groupId)

  const ownUserId = user?._id ?? ""
  const html = useMemo(() => buildMapHtml(ownUserId), [ownUserId])

  // Derive permissions from the group membership.
  const myRole = useMemo(() => {
    if (!group || !user) return null
    return group.members.find((m) => m.user._id === user._id)?.role ?? null
  }, [group, user])
  const isAdmin = myRole === "owner" || myRole === "admin"
  const canPlacePin = isAdmin || (group?.membersCanPin ?? false)

  useEffect(() => {
    locationApi
      .getGroupLocations(groupId)
      .then(setLocations)
      .finally(() => setLoading(false))
  }, [groupId])

  useEffect(() => {
    if (!locationSocket) return
    locationSocket.emit("location:join", { groupId })

    const onLocationNew = (loc: MemberLocation) => {
      setLocations((prev) => {
        const idx = prev.findIndex((l) => l.user._id === loc.user._id)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = loc
          return updated
        }
        return [...prev, loc]
      })
    }
    const onLocationRemoved = (data: { userId: string }) => {
      setLocations((prev) => prev.filter((l) => l.user._id !== data.userId))
    }
    // Pin sockets push into the TanStack cache so the WebView-render effect
    // below picks them up via the same code path as the initial query.
    const onPinNew = (pin: Pin) => {
      qc.setQueryData<Pin[]>(["pins", groupId], (prev) => {
        if (!prev) return [pin]
        const without = prev.filter((p) => p._id !== pin._id)
        return [pin, ...without]
      })
    }
    const onPinRemoved = (data: { pinId: string }) => {
      qc.setQueryData<Pin[]>(["pins", groupId], (prev) =>
        prev ? prev.filter((p) => p._id !== data.pinId) : prev,
      )
    }

    locationSocket.on("location:new", onLocationNew)
    locationSocket.on("location:removed", onLocationRemoved)
    locationSocket.on("pin:new", onPinNew)
    locationSocket.on("pin:removed", onPinRemoved)
    return () => {
      locationSocket.off("location:new", onLocationNew)
      locationSocket.off("location:removed", onLocationRemoved)
      locationSocket.off("pin:new", onPinNew)
      locationSocket.off("pin:removed", onPinRemoved)
    }
  }, [locationSocket, groupId, qc])

  // Push the latest set into the WebView whenever locations change (and only
  // after the WebView signals it's ready, so we don't lose the first batch).
  useEffect(() => {
    if (!webReady.current) return
    pushLocations()
  }, [locations])

  useEffect(() => {
    if (!webReady.current) return
    pushPins()
  }, [pins, ownUserId, isAdmin])

  useEffect(() => {
    if (!webReady.current) return
    sendCommand({ type: "canPlace", value: canPlacePin })
  }, [canPlacePin])

  // Sync map type into the WebView whenever it changes (post-ready only).
  useEffect(() => {
    if (!webReady.current) return
    sendCommand({ type: "mapType", value: mapType })
  }, [mapType])

  function sendCommand(msg: Record<string, unknown>) {
    const payload = JSON.stringify(msg)
    webRef.current?.injectJavaScript(
      `handleCommand(${JSON.stringify(payload)}); true;`,
    )
  }

  function pushLocations() {
    sendCommand({
      type: "set",
      locations: locations.map((l) => ({
        userId: l.user._id,
        name: l.user.name,
        latitude: l.latitude,
        longitude: l.longitude,
        accuracy: l.accuracy,
        meta: formatRelativeTime(l.updatedAt),
      })),
    })
  }

  function pushPins() {
    sendCommand({
      type: "setPins",
      pins: pins.map((p) => ({
        pinId: p._id,
        latitude: p.latitude,
        longitude: p.longitude,
        label: p.label ?? "",
        creator: p.createdBy?.name ?? "Unknown",
        canDelete: isAdmin || p.createdBy?._id === ownUserId,
      })),
    })
  }

  function fitToMarkers() {
    sendCommand({ type: "fit" })
  }

  function centerOnSelf() {
    sendCommand({ type: "focusOwn" })
  }

  function onWebMessage(event: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(event.nativeEvent.data)
      // TEMP diagnostic — proves the WebView→RN bridge is delivering events.
      // Remove once long-press is confirmed working end-to-end.
      console.log("[MapScreen] msg:", msg.type, msg)
      if (msg.type === "ready") {
        webReady.current = true
        pushLocations()
        pushPins()
        sendCommand({ type: "mapType", value: mapType })
        sendCommand({ type: "canPlace", value: canPlacePin })
      } else if (msg.type === "pin:longpress") {
        if (!canPlacePin) {
          Alert.alert(
            "Pins disabled",
            "Only admins can drop pins on this trip. Ask an admin to enable it for everyone.",
          )
          return
        }
        // TEMP diagnostic so the user can confirm the long-press fired even
        // if the bottom sheet itself fails to present. Remove once confirmed.
        // Alert.alert(
        //   "Long-press detected",
        //   `lat ${msg.latitude.toFixed(4)}, lng ${msg.longitude.toFixed(4)} — opening sheet…`,
        // )
        setPendingPin({ latitude: msg.latitude, longitude: msg.longitude })
        setPinLabel("")
      } else if (msg.type === "pin:delete") {
        confirmDeletePin(String(msg.pinId))
      } else if (msg.type === "debug") {
        // TEMP — surfaces WebView-side debug pings to the RN console.
        console.log("[MapScreen webview]", msg.msg)
      }
    } catch {
      // ignore malformed messages
    }
  }

  function confirmDeletePin(pinId: string) {
    Alert.alert(
      "Delete this pin?",
      "This will remove it for everyone in the trip.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            deletePin(pinId, {
              onError: (err: any) => {
                const msg =
                  err?.response?.data?.message ??
                  "Could not delete the pin. Try again."
                Alert.alert("Delete failed", String(msg))
              },
            }),
        },
      ],
    )
  }

  function submitPin() {
    if (!pendingPin) return
    createPin(
      {
        latitude: pendingPin.latitude,
        longitude: pendingPin.longitude,
        label: pinLabel.trim() || undefined,
      },
      {
        onSuccess: () => {
          setPendingPin(null)
          setPinLabel("")
        },
        onError: (err: any) => {
          const msg =
            err?.response?.data?.message ?? "Could not add the pin. Try again."
          Alert.alert("Pin failed", String(msg))
        },
      },
    )
  }

  async function startSharing() {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== "granted") {
      Alert.alert(
        "Permission denied",
        "Location access is required to share your position.",
      )
      return
    }
    setSharing(true)
    locationWatcher.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (loc) => {
        locationSocket?.emit("location:update", {
          groupId,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy,
        })
      },
    )
  }

  function stopSharing() {
    locationWatcher.current?.remove()
    locationSocket?.emit("location:stop", { groupId })
    setSharing(false)
  }

  if (loading) {
    return (
      <ActivityIndicator
        className="flex-1 bg-bg-light dark:bg-bg-dark"
        color="#6366f1"
        size="large"
      />
    )
  }

  const totalMarkers = locations.length + pins.length

  return (
    <View className="flex-1 bg-bg-light dark:bg-bg-dark">
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html }}
        onMessage={onWebMessage}
        javaScriptEnabled
        domStorageEnabled
        style={{ flex: 1, backgroundColor: "#e2e8f0" }}
      />

      <View className="absolute top-3 left-0 right-0 items-center px-4 gap-2">
        <MapTypeSelector value={mapType} onChange={setMapType} />
        <StatusChip
          sharingCount={locations.length}
          pinCount={pins.length}
          canPlacePin={canPlacePin}
        />
      </View>

      <View className="absolute right-4 bottom-32 gap-2.5">
        <FloatingIconButton
          Icon={Locate}
          onPress={centerOnSelf}
          accessibilityLabel="Center on me"
        />
        {totalMarkers > 1 && (
          <FloatingIconButton
            Icon={Maximize2}
            onPress={fitToMarkers}
            accessibilityLabel="Fit all markers"
          />
        )}
      </View>

      <View className="absolute bottom-8 left-4 right-4 flex-row gap-2.5">
        <ShareButton
          sharing={sharing}
          onPress={sharing ? stopSharing : startSharing}
        />
      </View>

      <PinSheet
        pendingPin={pendingPin}
        pinLabel={pinLabel}
        setPinLabel={setPinLabel}
        onCancel={() => setPendingPin(null)}
        onSubmit={submitPin}
        creating={creatingPin}
      />
    </View>
  )
}

function PinSheet({
  pendingPin,
  pinLabel,
  setPinLabel,
  onCancel,
  onSubmit,
  creating,
}: {
  pendingPin: { latitude: number; longitude: number } | null
  pinLabel: string
  setPinLabel: (v: string) => void
  onCancel: () => void
  onSubmit: () => void
  creating: boolean
}) {
  const visible = pendingPin !== null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end"
      >
        <Pressable
          className="absolute inset-0 bg-black/60"
          onPress={onCancel}
        />
        <View className="bg-surface-light dark:bg-surface-dark rounded-t-3xl">
          <View className="items-center py-2">
            <View className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          </View>
          <View className="px-6 pt-2 pb-8">
            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-900/30 items-center justify-center">
                <PinIcon size={20} color="#dc2626" />
              </View>
              <View className="flex-1">
                <Text className="text-slate-900 dark:text-white text-[17px] font-bold tracking-tight">
                  Drop a pin
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-[12.5px] mt-0.5">
                  Visible to everyone in the trip
                </Text>
              </View>
            </View>

            {pendingPin && (
              <View className="bg-bg-light dark:bg-bg-dark rounded-xl px-3 py-2.5 border border-border-light dark:border-border-dark mb-4 flex-row items-center gap-2">
                <MapPin size={13} color="#64748b" />
                <Text
                  className="text-slate-600 dark:text-slate-300 text-[12px]"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {pendingPin.latitude.toFixed(5)},{" "}
                  {pendingPin.longitude.toFixed(5)}
                </Text>
              </View>
            )}

            <Input
              label="Label (optional)"
              value={pinLabel}
              onChangeText={setPinLabel}
              placeholder="e.g. Meeting point"
              maxLength={60}
              autoFocus
            />
            <Button title="Add pin" onPress={onSubmit} loading={creating} />
            <Button
              title="Cancel"
              variant="secondary"
              onPress={onCancel}
              className="mt-2"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
