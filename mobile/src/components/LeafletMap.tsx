import React, { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { colors, fonts, fontSize } from "../theme";

export interface LatLng {
  latitude: number;
  longitude: number;
}

// The map page is given this origin so its tile requests carry a Referer naming the
// app, which OpenStreetMap's tile usage policy asks for.
const MAP_ORIGIN = "https://alertocalbayog-mcms.onrender.com";

const PIN_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">' +
  '<path d="M15 0C6.7 0 0 6.6 0 14.8 0 25.9 15 40 15 40s15-14.1 15-25.2C30 6.6 23.3 0 15 0z" fill="#C2361E"/>' +
  '<circle cx="15" cy="15" r="5.5" fill="#fff"/></svg>';

/**
 * Same Leaflet + OpenStreetMap stack the web dashboards use, so residents and
 * dispatchers see the same map. No API key or billing account is involved.
 */
function buildHtml(start: LatLng, interactive: boolean): string {
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#map{margin:0;height:100%;background:${colors.muted}}.leaflet-control-attribution{font-size:9px}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  function send(m) {
    var data = JSON.stringify(m);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(data);
    else if (window.parent !== window) window.parent.postMessage(data, "*");
  }
  if (!window.L) { send({ type: "error" }); return; }
  var interactive = ${interactive ? "true" : "false"};
  var map = L.map("map", {
    zoomControl: interactive, dragging: interactive, touchZoom: interactive,
    doubleClickZoom: interactive, scrollWheelZoom: false, boxZoom: false, keyboard: false, tap: interactive
  }).setView([${start.latitude}, ${start.longitude}], 17);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19, attribution: "&copy; OpenStreetMap"
  }).addTo(map);
  var icon = L.divIcon({ className: "", html: '${PIN_SVG}', iconSize: [30, 40], iconAnchor: [15, 38] });
  var marker = L.marker([${start.latitude}, ${start.longitude}], { icon: icon, draggable: interactive }).addTo(map);
  var circle = L.circle([${start.latitude}, ${start.longitude}], {
    radius: 1, color: "${colors.medical}", weight: 1, fillColor: "${colors.medical}", fillOpacity: 0.15, opacity: 0
  }).addTo(map);
  function report(p) { send({ type: "pin", latitude: p.lat, longitude: p.lng }); }
  marker.on("dragend", function () { report(marker.getLatLng()); });
  if (interactive) map.on("click", function (e) { marker.setLatLng(e.latlng); report(e.latlng); });
  window.setPosition = function (lat, lng, acc) {
    var moved = marker.getLatLng().distanceTo([lat, lng]) > 1;
    marker.setLatLng([lat, lng]);
    circle.setLatLng([lat, lng]);
    circle.setRadius(acc > 0 ? acc : 1);
    circle.setStyle({ opacity: acc > 0 ? 0.6 : 0, fillOpacity: acc > 0 ? 0.15 : 0 });
    if (!interactive && acc > 40) map.fitBounds(circle.getBounds(), { padding: [12, 12], maxZoom: 17 });
    else if (moved || !interactive) map.setView([lat, lng], map.getZoom());
  };
  send({ type: "ready" });
})();
</script></body></html>`;
}

interface Props {
  position: LatLng;
  /** GPS accuracy radius in metres, drawn as a circle. Omit for a hand-placed pin. */
  accuracy?: number | null;
  /** Full-screen "Adjust pin" mode: draggable marker, tap to move, zoom. */
  interactive?: boolean;
  onPinMove?: (position: LatLng) => void;
  style?: StyleProp<ViewStyle>;
}

export default function LeafletMap({ position, accuracy, interactive = false, onPinMove, style }: Props) {
  const webRef = useRef<WebView>(null);
  // Browser build only: react-native-webview has no web support, so the same page
  // runs in an iframe instead.
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const readyRef = useRef(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  // Built once: a new HTML string would reload the whole map on every GPS update.
  const [html] = useState(() => buildHtml(position, interactive));

  const push = () => {
    if (!readyRef.current) return;
    const acc = accuracy ?? 0;
    if (Platform.OS === "web") {
      (frameRef.current?.contentWindow as any)?.setPosition?.(position.latitude, position.longitude, acc);
    } else {
      webRef.current?.injectJavaScript(
        `window.setPosition && window.setPosition(${position.latitude}, ${position.longitude}, ${acc}); true;`
      );
    }
  };

  useEffect(push, [position.latitude, position.longitude, accuracy]);

  const handleMessage = (data: string) => {
    let message: any;
    try {
      message = JSON.parse(data);
    } catch {
      return;
    }
    if (message.type === "ready") {
      readyRef.current = true;
      setState("ready");
      push();
    } else if (message.type === "error") {
      setState("error");
    } else if (message.type === "pin" && onPinMove) {
      onPinMove({ latitude: message.latitude, longitude: message.longitude });
    }
  };
  // Keeps the iframe listener pointed at the latest props without re-subscribing.
  const handleMessageRef = useRef(handleMessage);
  handleMessageRef.current = handleMessage;

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const listener = (event: MessageEvent) => {
      if (event.source === frameRef.current?.contentWindow && typeof event.data === "string") {
        handleMessageRef.current(event.data);
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);

  return (
    <View style={[styles.container, style]}>
      {Platform.OS === "web" ? (
        React.createElement("iframe", {
          ref: frameRef,
          srcDoc: html,
          title: interactive ? "Map: drag the pin to the emergency location" : "Map preview",
          style: { border: 0, width: "100%", height: "100%", display: "block" },
        })
      ) : (
        <WebView
          ref={webRef}
          originWhitelist={["*"]}
          source={{ html, baseUrl: MAP_ORIGIN }}
          onMessage={(event: WebViewMessageEvent) => handleMessage(event.nativeEvent.data)}
          onError={() => setState("error")}
          scrollEnabled={false}
          style={styles.web}
          accessibilityElementsHidden={!interactive}
          importantForAccessibility={interactive ? "auto" : "no-hide-descendants"}
        />
      )}
      {state !== "ready" && (
        <View style={styles.overlay} pointerEvents="none">
          <Text style={styles.overlayText}>
            {state === "error"
              ? `Map unavailable · ${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`
              : "Loading map…"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: colors.muted,
  },
  web: {
    flex: 1,
    backgroundColor: colors.muted,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.muted,
    padding: 12,
  },
  overlayText: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
