import { Alert, NativeModules } from "react-native";
import api, { backendUrl } from "./axios";
import { saveToken, saveUser } from "../utils/Storage";

/**
 * Google Sign-In is a native module, so it only exists in a real build — not in
 * Expo Go and not on web. Every caller must check this before offering the button,
 * otherwise requiring the module throws and takes the whole screen down.
 */
export const isGoogleSignInAvailable = (): boolean =>
  Boolean(NativeModules.RNGoogleSignin);

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

let configured = false;

const getGoogleSignin = () => {
  const { GoogleSignin } = require("@react-native-google-signin/google-signin");

  if (!configured) {
    GoogleSignin.configure({
      // The backend verifies the returned idToken against Google's tokeninfo
      // endpoint, and that only succeeds when the token was minted for this
      // web client id.
      webClientId: WEB_CLIENT_ID,
      offlineAccess: false,
    });
    configured = true;
  }

  return GoogleSignin;
};

export type GoogleSignInResult =
  | { status: "success"; idToken: string }
  | { status: "cancelled" }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string };

/**
 * Opens the native Google account chooser and returns the ID token for the
 * account the resident picked. The token is what `/auth/google-login` verifies.
 */
export const signInWithGoogle = async (): Promise<GoogleSignInResult> => {
  if (!isGoogleSignInAvailable()) {
    // Expo Go does not bundle this native module, so the button is visible but
    // inert there. Saying so plainly beats hiding the button and leaving the
    // tester wondering why Google Sign-In "isn't implemented".
    return {
      status: "unavailable",
      message:
        "Google Sign-In needs a development build — it cannot run inside Expo Go. " +
        "Sign in with your mobile number to continue testing, or build with " +
        "'eas build --profile development' to try Google.",
    };
  }

  if (!WEB_CLIENT_ID) {
    return {
      status: "unavailable",
      message: "Google Sign-In is not configured for this app build.",
    };
  }

  try {
    const GoogleSignin = getGoogleSignin();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Signing out first keeps the account chooser from silently reusing a stale
    // account, which is confusing on a shared or borrowed phone.
    try {
      await GoogleSignin.signOut();
    } catch {
      // No previous session to clear.
    }

    const response = await GoogleSignin.signIn();

    if (response?.type === "cancelled") {
      return { status: "cancelled" };
    }

    const idToken = response?.data?.idToken;
    if (!idToken) {
      return {
        status: "error",
        message: "Google did not return a valid sign-in token. Please try again.",
      };
    }

    return { status: "success", idToken };
  } catch (err: any) {
    // The library reports user-initiated dismissal as an error code on some
    // Android versions rather than a cancelled response.
    const code = err?.code ? String(err.code) : "";
    if (code.includes("CANCEL") || code === "12501") {
      return { status: "cancelled" };
    }
    return {
      status: "error",
      message: err?.message || "Google Sign-In failed. Please try again or use your mobile number.",
    };
  }
};

/** Clears the cached Google session so the next sign-in shows the account chooser. */
export const signOutFromGoogle = async (): Promise<void> => {
  if (!isGoogleSignInAvailable()) return;
  try {
    await getGoogleSignin().signOut();
  } catch {
    // Nothing to sign out of.
  }
};

type GoogleFlowNavigation = {
  navigate: (screen: any, params?: any) => void;
  replace: (screen: any, params?: any) => void;
};

/**
 * The complete one-tap journey, shared by every screen that offers the button:
 * pick a Google account, exchange the token with the backend, then either land
 * the returning resident on the dashboard or send a brand new one to the short
 * profile-completion form.
 */
export const runGoogleSignInFlow = async (
  navigation: GoogleFlowNavigation
): Promise<void> => {
  const result = await signInWithGoogle();

  if (result.status === "cancelled") return;
  if (result.status !== "success") {
    Alert.alert("Google Sign-In", result.message);
    return;
  }

  try {
    const res = await api.post("/auth/google-login", { idToken: result.idToken });

    if (res.data?.isNewResident) {
      navigation.navigate("Register", {
        googleRegistrationToken: res.data.googleRegistrationToken,
        googleUser: res.data.googleUser,
      });
      return;
    }

    await saveToken(res.data.token);
    await saveUser(res.data.user);
    navigation.replace(res.data.termsAccepted === false ? "UserAgreement" : "Home");
  } catch (error: any) {
    const errorMsg =
      error.response?.data?.message ||
      (error.message === "Network Error"
        ? `Cannot connect to server at ${backendUrl}. Please check your network connection.`
        : error.message || "Google Sign-In failed. Please try again.");
    Alert.alert("Google Sign-In Failed", errorMsg);
  }
};
