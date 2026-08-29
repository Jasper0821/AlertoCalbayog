import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Header from "../components/Header";
import CustomInput from "../components/CustomInput";
import { COLORS } from "../styles/colors";
import { UserIcon, CameraIcon, LockIcon } from "../components/SvgIcons";
import api from "../api/axios";
import { getUser, getToken, saveUser } from "../utils/Storage";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Settings"
>;

interface Props {
  navigation: SettingsScreenNavigationProp;
}

export default function SettingsScreen({ navigation }: Props): React.JSX.Element {
  // Profile State
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [avatar, setAvatar] = useState<string>("");

  // Password State
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  // UI States
  const [loading, setLoading] = useState<boolean>(true);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [savingPassword, setSavingPassword] = useState<boolean>(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await getUser();
      if (user) {
        setFullName(user.fullName || user.full_name || "");
        setEmail(user.email || user.google_email || "");
        setPhoneNumber(user.phoneNumber || user.phone_number || "");
        setAvatar(user.avatar || user.profile_picture || "");
      }
    } catch (err) {
      console.error("Failed to load user data:", err);
    } finally {
      setLoading(false);
    }
  };

  // 📷 Take photo with Camera
  const handleTakePhoto = async () => {
    setShowAvatarPicker(false);
    try {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission Required", "Camera access permission is required to take a profile photo.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Image = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setAvatar(base64Image);
      }
    } catch (err) {
      console.error("Camera error:", err);
      Alert.alert("Camera Error", "Failed to capture photo using camera.");
    }
  };

  // 🖼️ Pick photo from Gallery
  const handleChooseFromGallery = async () => {
    setShowAvatarPicker(false);
    try {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission Required", "Gallery permission is required to choose a profile photo.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Image = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setAvatar(base64Image);
      }
    } catch (err) {
      console.error("Gallery error:", err);
      Alert.alert("Gallery Error", "Failed to select image from photo library.");
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert("Validation Error", "Full Name and Email address are required.");
      return;
    }

    setSavingProfile(true);
    try {
      const token = await getToken();
      const res = await api.put(
        "/users/profile",
        {
          fullName: fullName.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim(),
          avatar,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updatedUser = res.data.user || res.data;
      if (updatedUser) {
        await saveUser(updatedUser);
        // Refresh local form state to match the saved data
        setFullName(updatedUser.fullName || updatedUser.full_name || "");
        setEmail(updatedUser.email || "");
        setPhoneNumber(updatedUser.phoneNumber || updatedUser.phone_number || "");
        setAvatar(updatedUser.avatar || updatedUser.profile_picture || "");
      }
      Alert.alert("Success", "Profile details & avatar updated successfully!");
    } catch (error: any) {
      console.error("Update profile error:", error);
      const msg = error.response?.data?.message || "Failed to update profile";
      Alert.alert("Update Failed", msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Validation Error", "Please fill in your new password fields.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Validation Error", "New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Validation Error", "New password and Confirm Password do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const token = await getToken();
      await api.put(
        "/users/profile",
        {
          password: newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      Alert.alert("Success", "Your password has been changed successfully!");
    } catch (error: any) {
      console.error("Change password error:", error);
      const msg = error.response?.data?.message || "Failed to update password";
      Alert.alert("Error", msg);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Header title="Account Settings" showBack showActions={false} />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── 1. Profile Picture Avatar Section ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <UserIcon size={44} color={COLORS.primary} />
              </View>
            )}

            {/* Camera badge button */}
            <TouchableOpacity
              style={styles.cameraBadge}
              onPress={() => setShowAvatarPicker(true)}
              activeOpacity={0.8}
            >
              <CameraIcon size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setShowAvatarPicker(true)}>
            <Text style={styles.changeAvatarText}>Take or Choose Profile Photo</Text>
          </TouchableOpacity>
        </View>

        {/* ── 2. Profile Details Form ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          <View style={styles.divider} />

          <Text style={styles.fieldLabel}>Full Name</Text>
          <CustomInput
            placeholder="Enter full name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <Text style={styles.fieldLabel}>Phone Number</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <CustomInput
                placeholder="Enter phone number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
            {phoneNumber.trim().length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    "Remove Phone Number",
                    "Are you sure you want to delete your phone number?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Delete", style: "destructive", onPress: () => setPhoneNumber("") },
                    ]
                  );
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: "#FEF2F2",
                  borderWidth: 1,
                  borderColor: "#FCA5A5",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ color: "#DC2626", fontSize: 16, fontWeight: "900" }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.fieldLabel}>Email Address</Text>
          <CustomInput
            placeholder="Enter email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSaveProfile}
            disabled={savingProfile}
            activeOpacity={0.8}
          >
            {savingProfile ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save Profile Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── 3. Change Password Form ── */}
        <View style={styles.card}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <LockIcon size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Change Password</Text>
          </View>
          <View style={styles.divider} />

          <Text style={styles.fieldLabel}>Current Password</Text>
          <CustomInput
            placeholder="Enter current password"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />

          <Text style={styles.fieldLabel}>New Password</Text>
          <CustomInput
            placeholder="Enter new password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <Text style={styles.fieldLabel}>Confirm New Password</Text>
          <CustomInput
            placeholder="Re-enter new password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.primary }]}
            onPress={handleChangePassword}
            disabled={savingPassword}
            activeOpacity={0.8}
          >
            {savingPassword ? (
              <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
              <Text style={[styles.saveBtnText, { color: COLORS.primary }]}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Camera / Photo Library Picker Modal */}
      <Modal
        visible={showAvatarPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAvatarPicker(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAvatarPicker(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Update Profile Photo</Text>
            <Text style={styles.modalSub}>Take a new photo or select from library</Text>

            <View style={{ width: "100%", gap: 12, marginBottom: 16 }}>
              {/* Take Photo button */}
              <TouchableOpacity
                style={styles.optionBtn}
                onPress={handleTakePhoto}
                activeOpacity={0.8}
              >
                <CameraIcon size={22} color="#FFFFFF" />
                <Text style={styles.optionBtnText}>Take Photo with Camera</Text>
              </TouchableOpacity>

              {/* Choose from Library button */}
              <TouchableOpacity
                style={[styles.optionBtn, styles.optionBtnSecondary]}
                onPress={handleChooseFromGallery}
                activeOpacity={0.8}
              >
                <UserIcon size={22} color={COLORS.primary} />
                <Text style={[styles.optionBtnText, { color: COLORS.primary }]}>Choose from Photo Gallery</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowAvatarPicker(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  /* ── Avatar Section ── */
  avatarSection: {
    alignItems: "center",
    marginVertical: 16,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 8,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.surface,
    borderWidth: 3,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  changeAvatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 4,
  },

  /* ── Card Containers ── */
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
  },
  divider: {
    height: 2,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  saveBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  /* ── Modal ── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.primary,
  },
  modalSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 20,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 14,
    marginBottom: 20,
  },
  avatarGridItem: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
  },
  avatarGridSelected: {
    borderColor: COLORS.primary,
  },
  avatarGridImg: {
    width: "100%",
    height: "100%",
  },
  modalCloseBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.red,
  },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 10,
  },
  optionBtnSecondary: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  optionBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
