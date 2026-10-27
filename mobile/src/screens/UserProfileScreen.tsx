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
  TextInput,
  StatusBar,
  Modal,
  Pressable,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Header from "../components/Header";
import { getUser, saveUser, getToken } from "../utils/Storage";
import api from "../api/axios";
import { getVoterRequirements, verifyVoter, voterFollowUp, type VoterRequirements } from "../api/voters";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type UserProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "UserProfile"
>;

interface Props {
  navigation: UserProfileScreenNavigationProp;
}

export default function UserProfileScreen({ navigation }: Props): React.JSX.Element {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const [fullName, setFullName] = useState<string>("");
  const [barangay, setBarangay] = useState<string>("");
  const [completeAddress, setCompleteAddress] = useState<string>("");
  const [emergencyContactNumber, setEmergencyContactNumber] = useState<string>("");
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);

  // Voters-list verification.
  const [voterReq, setVoterReq] = useState<VoterRequirements>({ available: false, needsBirthdate: false });
  const [voterLast, setVoterLast] = useState<string>("");
  const [voterFirst, setVoterFirst] = useState<string>("");
  const [voterMiddle, setVoterMiddle] = useState<string>("");
  const [voterBirthdate, setVoterBirthdate] = useState<string>("");
  const [verifying, setVerifying] = useState<boolean>(false);

  useEffect(() => {
    loadUserData();
    getVoterRequirements().then(setVoterReq);
  }, []);

  const handleTakePhoto = async () => {
    setShowAvatarPicker(false);
    try {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission Required", "Camera access is required to take a profile photo.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        const base64Image = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        await saveAvatarToServer(base64Image);
      }
    } catch (err) {
      console.error("Camera error:", err);
      Alert.alert("Camera Error", "Failed to capture photo.");
    }
  };

  const handleChooseFromGallery = async () => {
    setShowAvatarPicker(false);
    try {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission Required", "Gallery access is required to choose a profile photo.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        const base64Image = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        await saveAvatarToServer(base64Image);
      }
    } catch (err) {
      console.error("Gallery error:", err);
      Alert.alert("Gallery Error", "Failed to select image.");
    }
  };

  const saveAvatarToServer = async (avatarUri: string) => {
    setUploadingAvatar(true);
    try {
      const token = await getToken();
      const res = await api.put(
        "/users/profile",
        { avatar: avatarUri },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = res.data.user || res.data;
      setUser(updated);
      await saveUser(updated);
      Alert.alert("Profile Photo Updated", "Your profile photo has been saved.");
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      Alert.alert("Upload Failed", error.response?.data?.message || "Failed to update profile photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const stored = await getUser();
      if (stored) {
        setUser(stored);
        setFullName(stored.fullName || stored.full_name || "");
        setBarangay(stored.barangay || "");
        setCompleteAddress(stored.completeAddress || stored.complete_address || "");
        setEmergencyContactNumber(stored.emergencyContactNumber || stored.emergency_contact_number || "");
      }

      const token = await getToken();
      if (token) {
        const res = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.user) {
          setUser(res.data.user);
          await saveUser(res.data.user);
          setFullName(res.data.user.fullName || res.data.user.full_name || "");
          setBarangay(res.data.user.barangay || "");
          setCompleteAddress(res.data.user.completeAddress || res.data.user.complete_address || "");
          setEmergencyContactNumber(res.data.user.emergencyContactNumber || res.data.user.emergency_contact_number || "");
        }
      }
    } catch (err) {
      console.error("Failed to load user data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert("Input Required", "Full Name is required.");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const res = await api.put(
        "/users/profile",
        {
          fullName: fullName.trim(),
          barangay: barangay.trim(),
          completeAddress: completeAddress.trim(),
          emergencyContactNumber: emergencyContactNumber.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updated = res.data.user || res.data;
      setUser(updated);
      await saveUser(updated);
      setIsEditing(false);
      Alert.alert("Profile Updated", "Your profile details have been saved.");
    } catch (error: any) {
      console.error("Save profile error:", error);
      Alert.alert("Update Error", error.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const isVerified =
    (user?.residentVerificationStatus || user?.resident_verification_status) === "verified";

  const handleVerifyVoter = async () => {
    if (!voterLast.trim() || !voterFirst.trim()) {
      Alert.alert("Input Required", "Enter your last and first name as on your voter's record.");
      return;
    }
    if (!user?.barangay) {
      Alert.alert("Barangay needed", "Add your barangay under Account Details first.");
      return;
    }
    if (voterReq.needsBirthdate && !/^\d{4}-\d{2}-\d{2}$/.test(voterBirthdate.trim())) {
      Alert.alert("Birthdate needed", "Enter your birthdate as YYYY-MM-DD, for example 1990-05-17.");
      return;
    }
    setVerifying(true);
    try {
      const result = await verifyVoter({
        lastName: voterLast.trim(),
        firstName: voterFirst.trim(),
        middleName: voterMiddle.trim(),
        birthdate: voterBirthdate.trim(),
      });
      if (result.status === "verified") {
        const updated = { ...user, residentVerificationStatus: "verified", verificationMethod: "voters_list" };
        setUser(updated);
        await saveUser(updated);
        Alert.alert("You're verified", "Responders will see you as a verified resident of Calbayog.");
      } else {
        Alert.alert("Not verified yet", voterFollowUp(result));
      }
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#040C1A" />
      <Header title="Resident Profile" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card Header */}
        <View style={styles.headerCard}>
          <View style={styles.avatarCircle}>
            {user?.avatar || user?.profilePicture ? (
              <Image source={{ uri: user.avatar || user.profilePicture }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitial}>{user?.fullName?.charAt(0) || "R"}</Text>
            )}
          </View>

          <Text style={styles.userName}>{user?.fullName || "Resident User"}</Text>
          <Text style={styles.userPhone}>{user?.mobileNumber || user?.phoneNumber || "N/A"}</Text>
          <Text style={styles.statusBadge}>STATUS: {user?.accountStatus || "ACTIVE"}</Text>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Account Details</Text>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <Text style={styles.editToggle}>{isEditing ? "CANCEL" : "EDIT"}</Text>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <View style={styles.form}>
              <Text style={styles.fieldLabel}>FULL NAME</Text>
              <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

              <Text style={styles.fieldLabel}>BARANGAY</Text>
              <TextInput style={styles.input} value={barangay} onChangeText={setBarangay} />

              <Text style={styles.fieldLabel}>COMPLETE ADDRESS</Text>
              <TextInput style={styles.input} value={completeAddress} onChangeText={setCompleteAddress} />

              <Text style={styles.fieldLabel}>EMERGENCY CONTACT</Text>
              <TextInput style={styles.input} value={emergencyContactNumber} onChangeText={setEmergencyContactNumber} keyboardType="phone-pad" />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>SAVE CHANGES</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoVal}>{user?.role || "RESIDENT"}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Barangay</Text>
                <Text style={styles.infoVal}>Brgy. {user?.barangay || "N/A"}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Complete Address</Text>
                <Text style={styles.infoVal}>{user?.completeAddress || user?.address || "N/A"}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Emergency Contact</Text>
                <Text style={styles.infoVal}>{user?.emergencyContactNumber || "N/A"}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Voter verification: a "Verified resident" badge responders see on reports */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Resident verification</Text>
          {isVerified ? (
            <Text style={[styles.infoVal, styles.verifiedText]} accessibilityLiveRegion="polite">
              ✓ Verified resident
              {user?.verificationMethod === "admin" ? " · confirmed by the City" : " · voters list"}
            </Text>
          ) : !voterReq.available ? (
            <Text style={styles.voterHint}>
              Not verified. Voter verification isn't available yet; the City hasn't loaded its voters list.
            </Text>
          ) : (
            <View style={styles.form}>
              <Text style={styles.voterHint}>
                Not verified. Enter your name exactly as on your voter's record. It's checked once against the
                City's voters list for Brgy. {user?.barangay || "(add your barangay above)"} and not stored.
              </Text>
              <Text style={styles.fieldLabel}>LAST NAME</Text>
              <TextInput style={styles.input} value={voterLast} onChangeText={setVoterLast} autoCapitalize="words" />
              <Text style={styles.fieldLabel}>FIRST NAME</Text>
              <TextInput style={styles.input} value={voterFirst} onChangeText={setVoterFirst} autoCapitalize="words" />
              <Text style={styles.fieldLabel}>MIDDLE NAME</Text>
              <TextInput style={styles.input} value={voterMiddle} onChangeText={setVoterMiddle} autoCapitalize="words" />
              {voterReq.needsBirthdate && (
                <>
                  <Text style={styles.fieldLabel}>BIRTHDATE (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.input}
                    value={voterBirthdate}
                    onChangeText={setVoterBirthdate}
                    keyboardType="numbers-and-punctuation"
                    maxLength={10}
                    placeholder="1990-05-17"
                    placeholderTextColor="#64748B"
                  />
                </>
              )}
              <TouchableOpacity style={styles.saveBtn} onPress={handleVerifyVoter} disabled={verifying}>
                {verifying ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>VERIFY NOW</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#040C1A",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#040C1A",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 20,
  },
  headerCard: {
    backgroundColor: "#0B192C",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 20,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#0A1D38",
    borderWidth: 2,
    borderColor: "#38BDF8",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 12,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  userPhone: {
    color: "#38BDF8",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  statusBadge: {
    color: "#10B981",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 8,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailsCard: {
    backgroundColor: "#0B192C",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  editToggle: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "900",
  },
  infoList: {
    gap: 14,
  },
  infoRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#16273E",
    paddingBottom: 10,
  },
  infoLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  infoVal: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },
  verifiedText: {
    marginTop: 10,
    color: "#34D399",
    fontWeight: "800",
  },
  voterHint: {
    marginTop: 8,
    marginBottom: 10,
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
  },
  form: {
    gap: 12,
  },
  fieldLabel: {
    color: "#64748B",
    fontSize: 9.5,
    fontWeight: "900",
  },
  input: {
    backgroundColor: "#040C1A",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1E293B",
    color: "#FFFFFF",
    fontSize: 13,
    height: 44,
    paddingHorizontal: 12,
  },
  saveBtn: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
});
