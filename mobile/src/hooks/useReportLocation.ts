import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Linking, Platform } from "react-native";
import * as Location from "expo-location";
import CALBAYOG_BARANGAYS from "../constants/calbayogBarangays";
import type { LatLng } from "../components/LeafletMap";

type Fix = Location.LocationObject;

/** "checking" until we know; "off" when GPS is disabled or permission is denied. */
export type LocationStatus = "checking" | "off" | "ready";

/**
 * How old the newest watched fix may be and still be sent as-is. A reporter who
 * has been on this screen for even a few seconds already has a fix this fresh,
 * so submit costs no GPS wait at all.
 */
const FRESH_FIX_MAX_AGE_MS = 30 * 1000;

/**
 * Ceiling on how long submit may block waiting for a brand-new fix when no fresh
 * one exists. getCurrentPositionAsync has no timeout of its own: indoors or under
 * cover it can wait for a satellite lock indefinitely, which is what made SEND
 * feel frozen. After this we fall back to whatever position we already have.
 */
const SUBMIT_FIX_TIMEOUT_MS = 8 * 1000;

/** Oldest cached fix we will accept as a last resort. */
const LAST_KNOWN_MAX_AGE_MS = 5 * 60 * 1000;

/** Resolves to null instead of hanging, so a slow GPS cannot block the report. */
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([
    promise.catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);

// Android names an unnamed spot by its Plus Code ("3H9V+8H2"); that is not a street.
const PLUS_CODE = /^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]*$/i;

const findBarangay = (value?: string | null) =>
  CALBAYOG_BARANGAYS.find((bgy) => bgy.toLowerCase() === (value || "").trim().toLowerCase());

interface ResolvedPlace {
  street: string;
  barangay: string;
  purok: string;
}

const GENERIC_AREA = /^(district|calbayog( city)?|samar)$/i;
const PUROK = /purok\s*([\w-]+)/i;

/** The phone's own geocoder (Google Play Services / Apple): best Philippine coverage. */
async function deviceReverseGeocode(point: LatLng): Promise<ResolvedPlace | null> {
  if (Platform.OS === "web") return null; // Not available in the browser build.
  const [place] = await Location.reverseGeocodeAsync(point).catch(() => []);
  if (!place) return null;

  // Android usually reports the barangay in `district`. `subregion` is the
  // province ("Samar") in the Philippines, so it only counts when it names an
  // actual barangay — otherwise reports were labelled "Brgy. Samar".
  const district = (place.district || "").trim();
  const barangay =
    findBarangay(district) || findBarangay(place.subregion) || (GENERIC_AREA.test(district) ? "" : district);
  // Some geocoders return the purok inside the district/subregion string.
  const purok = `${place.district || ""} ${place.subregion || ""}`.match(PUROK);
  const street = (place.street || "").trim();
  if (!street && !barangay) return null;
  return { street, barangay, purok: purok ? purok[0].trim() : "" };
}

/**
 * Fallback for the browser build and for when the phone's geocoder finds nothing:
 * the same OpenStreetMap Nominatim service the backend uses at submit time.
 */
async function nominatimReverseGeocode(point: LatLng): Promise<ResolvedPlace | null> {
  const url =
    "https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=en" +
    `&lat=${point.latitude}&lon=${point.longitude}`;
  // Browsers send their own User-Agent; native apps must identify themselves.
  const headers: Record<string, string> = Platform.OS === "web" ? {} : { "User-Agent": "AlertoCalbayog/1.0" };
  const response = await fetch(url, { headers });
  if (!response.ok) return null;
  const address = (await response.json())?.address || {};

  // Most specific first: in Calbayog's OpenStreetMap data the barangay is usually the
  // `quarter`, while `suburb` is the wider "Calbayog District".
  const areas: string[] = [
    address.quarter,
    address.neighbourhood,
    address.village,
    address.suburb,
    address.city_district,
    address.hamlet,
  ]
    .filter((a): a is string => typeof a === "string" && a.trim() !== "")
    .map((a) => a.replace(/^(brgy\.?|barangay)\s+/i, "").trim());
  const barangay = areas.map(findBarangay).find(Boolean) || areas.find((a) => !GENERIC_AREA.test(a) && !PUROK.test(a)) || "";
  const purok = areas.map((a) => a.match(PUROK)).find(Boolean);
  const street = (address.road || address.pedestrian || address.footway || "").trim();
  return { street, barangay, purok: purok ? purok[0].trim() : "" };
}

export interface SubmitPosition {
  position: LatLng;
  /** Null when the resident placed the pin by hand: GPS accuracy no longer applies. */
  accuracy: number | null;
}

/**
 * @param watch Keep a GPS fix warm for instant sending. Off for screens that only
 *              show where the resident is, to spare the battery.
 */
export function useReportLocation({ watch = true }: { watch?: boolean } = {}) {
  const [status, setStatus] = useState<LocationStatus>("checking");
  const [gps, setGps] = useState<{ position: LatLng; accuracy: number | null } | null>(null);
  const [pin, setPin] = useState<LatLng | null>(null);
  const [street, setStreet] = useState("");
  const [barangay, setBarangay] = useState("");
  const [purok, setPurok] = useState("");
  const [resolvingAddress, setResolvingAddress] = useState(false);

  /**
   * The newest position the device has produced since this screen opened, kept
   * warm by the watcher below. Submit reads this instead of asking for a fresh
   * fix, which is the whole reason SEND does not wait on GPS.
   */
  const latestFixRef = useRef<Fix | null>(null);
  // A barangay the resident picked by hand is never overwritten by the geocoder.
  const barangayChosenRef = useRef(false);

  const rememberFix = useCallback((fix: Fix | null) => {
    if (!fix) return;
    const previous = latestFixRef.current;
    // Keep the newer reading. Watch updates and one-shot reads can interleave.
    if (previous && fix.timestamp < previous.timestamp) return;
    latestFixRef.current = fix;
    setGps({
      position: { latitude: fix.coords.latitude, longitude: fix.coords.longitude },
      accuracy: typeof fix.coords.accuracy === "number" ? Math.round(fix.coords.accuracy) : null,
    });
  }, []);

  const check = useCallback(async () => {
    try {
      if (!(await Location.hasServicesEnabledAsync())) {
        setStatus("off");
        return;
      }
      let { status: permission } = await Location.getForegroundPermissionsAsync();
      if (permission !== "granted") {
        ({ status: permission } = await Location.requestForegroundPermissionsAsync());
      }
      setStatus(permission === "granted" ? "ready" : "off");
    } catch {
      setStatus("off");
    }
  }, []);

  /** Turns GPS on (Android prompt) or asks for permission, falling back to Settings. */
  const enableLocation = useCallback(async () => {
    try {
      if (!(await Location.hasServicesEnabledAsync())) {
        if (Platform.OS === "android") {
          await Location.enableNetworkProviderAsync().catch(() => Linking.openSettings());
        } else {
          await Linking.openSettings();
          return;
        }
      }
      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        if (permission.canAskAgain) await Location.requestForegroundPermissionsAsync();
        else await Linking.openSettings();
      }
    } finally {
      await check();
    }
  }, [check]);

  useEffect(() => {
    check();
    // Re-check on return from Settings, where the resident may have just enabled GPS.
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") check();
    });
    return () => sub.remove();
  }, [check]);

  /** Street, barangay and purok for a point. Everything stays editable — a wrong barangay is worse than none. */
  const geocode = useCallback(async (point: LatLng) => {
    setResolvingAddress(true);
    try {
      const place = (await deviceReverseGeocode(point)) || (await nominatimReverseGeocode(point));
      if (!place) return;

      setStreet(PLUS_CODE.test(place.street) ? "" : place.street);
      if (!barangayChosenRef.current) setBarangay(place.barangay);
      setPurok(place.purok);
    } catch {
      // Non-fatal: the report still sends with coordinates and the server geocodes.
    } finally {
      setResolvingAddress(false);
    }
  }, []);

  // First fix: show a cached one instantly, then take a good one (bounded).
  useEffect(() => {
    if (status !== "ready") return;
    let cancelled = false;
    (async () => {
      const cached = await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS }).catch(() => null);
      if (cancelled) return;
      rememberFix(cached);
      const fresh = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        SUBMIT_FIX_TIMEOUT_MS
      );
      if (cancelled) return;
      rememberFix(fresh);
      const first = fresh || cached;
      if (first) geocode({ latitude: first.coords.latitude, longitude: first.coords.longitude });
    })();
    return () => {
      cancelled = true;
    };
  }, [status, rememberFix, geocode]);

  /**
   * Keeps a fix warm for the whole time the reporter spends photographing the
   * scene, so the position is ready the instant SEND is pressed.
   */
  useEffect(() => {
    if (status !== "ready" || !watch) return;
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
      rememberFix
    )
      .then((sub) => {
        if (cancelled) sub.remove();
        else subscription = sub;
      })
      .catch(() => {
        // Non-fatal: submit still falls back to a one-shot read.
      });
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [status, watch, rememberFix]);

  /** Moves the incident to a hand-placed pin, or back to GPS with null. */
  const placePin = useCallback(
    (next: LatLng | null) => {
      setPin(next);
      const point = next || (latestFixRef.current
        ? { latitude: latestFixRef.current.coords.latitude, longitude: latestFixRef.current.coords.longitude }
        : null);
      if (point) geocode(point);
    },
    [geocode]
  );

  const chooseBarangay = useCallback((value: string) => {
    barangayChosenRef.current = true;
    setBarangay(value);
  }, []);

  /**
   * The position the report is sent with, in order of preference:
   *
   *   0. A pin the resident placed by hand.
   *   1. The warm fix the watcher has been maintaining — returns instantly.
   *   2. A fresh read, but capped so it cannot block the report indefinitely.
   *   3. Any fix we already hold, even a slightly stale one.
   *   4. A cached OS fix from the last five minutes.
   *
   * Only an unbounded stale position is refused outright: sending responders to
   * where the phone was hours ago is worse than reporting no location at all.
   */
  const resolveSubmitPosition = useCallback(async (): Promise<SubmitPosition | null> => {
    if (pin) return { position: pin, accuracy: null };

    const toSubmit = (fix: Fix): SubmitPosition => ({
      position: { latitude: fix.coords.latitude, longitude: fix.coords.longitude },
      accuracy: typeof fix.coords.accuracy === "number" ? Math.round(fix.coords.accuracy) : null,
    });

    const warm = latestFixRef.current;
    if (warm && Date.now() - warm.timestamp < FRESH_FIX_MAX_AGE_MS) return toSubmit(warm);

    const fresh = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      SUBMIT_FIX_TIMEOUT_MS
    );
    if (fresh) {
      rememberFix(fresh);
      return toSubmit(fresh);
    }
    if (latestFixRef.current) return toSubmit(latestFixRef.current);

    const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS }).catch(() => null);
    return lastKnown ? toSubmit(lastKnown) : null;
  }, [pin, rememberFix]);

  return {
    status,
    gps,
    pin,
    /** Where the incident is: the hand-placed pin, else the GPS fix. */
    position: pin || gps?.position || null,
    accuracy: pin ? null : gps?.accuracy ?? null,
    street,
    barangay,
    purok,
    resolvingAddress,
    enableLocation,
    placePin,
    chooseBarangay,
    resolveSubmitPosition,
  };
}
