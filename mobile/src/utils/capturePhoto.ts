import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { showDialog } from "./dialog";

export async function ensureCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status === "granted") return true;
  showDialog(
    "Camera permission needed",
    "Allow camera access to take photos of the scene for responders."
  );
  return false;
}

/**
 * Opens the camera and returns the shot as a compressed JPEG data URI, or null if
 * the resident backed out. Resized to 1000px so a weak signal can still carry it.
 */
export async function captureScenePhoto(): Promise<string | null> {
  const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.6 });
  if (result.canceled || !result.assets?.length) return null;

  const manipulated = await ImageManipulator.manipulateAsync(
    result.assets[0].uri,
    [{ resize: { width: 1000 } }],
    { compress: 0.55, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  return manipulated.base64 ? `data:image/jpeg;base64,${manipulated.base64}` : manipulated.uri;
}
