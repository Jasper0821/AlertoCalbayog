import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { showDialog } from "./dialog";

export async function ensureCameraPermission(
  reason = "Allow camera access to take photos of the scene for responders."
): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status === "granted") return true;
  showDialog("Camera permission needed", reason);
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

/**
 * A photo for Voter's ID verification, as a JPEG data URI, or null if cancelled.
 * Kept sharper than scene photos so the admin can read the name on the document.
 * The selfie always comes from the front camera, never the gallery, so it shows
 * the person sending it.
 */
export async function captureIdPhoto({ selfie = false, fromGallery = false } = {}): Promise<string | null> {
  let result: ImagePicker.ImagePickerResult;
  if (fromGallery && !selfie) {
    result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
  } else {
    const allowed = await ensureCameraPermission("Allow camera access to take photos for your Voter's ID verification.");
    if (!allowed) return null;
    result = await ImagePicker.launchCameraAsync({
      cameraType: selfie ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
      quality: 0.8,
    });
  }
  if (result.canceled || !result.assets?.length) return null;

  const manipulated = await ImageManipulator.manipulateAsync(
    result.assets[0].uri,
    [{ resize: { width: 1400 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  return manipulated.base64 ? `data:image/jpeg;base64,${manipulated.base64}` : null;
}
