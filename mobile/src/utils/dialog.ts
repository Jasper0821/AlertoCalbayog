import { Alert, Platform, type AlertButton } from "react-native";

/**
 * Alert.alert, but working in the browser build too. react-native-web implements
 * Alert as a no-op, so on the web every prompt was silently swallowed — including
 * confirmations that gate an action, which left those actions unreachable.
 *
 * On the web the last non-cancel button becomes the browser's OK and the cancel
 * button its Cancel; with no action buttons it is a plain window.alert.
 */
export function showDialog(title: string, message: string, buttons: AlertButton[] = [{ text: "OK" }]): void {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons);
    return;
  }

  const cancel = buttons.find((b) => b.style === "cancel");
  const actions = buttons.filter((b) => b.style !== "cancel");
  const primary = actions[actions.length - 1];

  if (!primary || (actions.length === 1 && !cancel && !primary.onPress)) {
    window.alert(`${title}\n\n${message}`);
    primary?.onPress?.();
    cancel?.onPress?.();
    return;
  }

  const hint = `\n\nOK: ${primary.text}${cancel ? ` · Cancel: ${cancel.text}` : ""}`;
  if (window.confirm(`${title}\n\n${message}${hint}`)) primary.onPress?.();
  else cancel?.onPress?.();
}
