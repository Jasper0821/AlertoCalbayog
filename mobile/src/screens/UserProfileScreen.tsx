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
import {
  DOCUMENT_LABELS,
  getVoterIdAvailable,
  submitVoterId,
  withdrawVoterId,
  type VoterIdDocument,
  type VoterIdReview,
} from "../api/voterId";
import VoterIdForm, { emptyVoterIdDraft, voterIdMissing, type VoterIdDraft } from "../components/VoterIdForm";
import { showDialog } from "../utils/dialog";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

// How the resident got the "Verified resident" tag. "voters_list" is from the check Voter's ID replaced.
const METHOD_LABELS: Record<string, string> = {
  voters_id: " · Voter's ID",
  admin: " · confirmed by the City",
  voters_list: " · voters list",
};

const normalizeName = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();
const asSentence = (text = "") => (!text || /[.!?]$/.test(text) ? text : `${text}.`);
const formatDay = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "";

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

  // Voter's ID verification.
  const [voterIdAvailable, setVoterIdAvailable] = useState<boolean>(false);
  const [voterId, setVoterId] = useState<VoterIdDraft>(emptyVoterIdDraft);
  const [sendingVoterId, setSendingVoterId] = useState<boolean>(false);
  const [withdrawing, setWithdrawing] = useState<boolean>(false);

  const isVerified =
    (user?.residentVerificationStatus || user?.resident_verification_status) === "verified";
  const review: VoterIdReview = user?.voterIdReview || { status: "" };
  const documentName = DOCUMENT_LABELS[review.documentType as VoterIdDocument] || "Voter's ID";

  useEffect(() => {
    loadUserData();
    getVoterIdAvailable().then(setVoterIdAvailable);
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

  const handleSaveProfile = () => {
    if (!fullName.trim()) {
      Alert.alert("Input Required", "Full Name is required.");
      return;
    }

    // The server removes the "Verified resident" tag when the name changes, so say so first.
    if (isVerified && normalizeName(fullName) !== normalizeName(user?.fullName || user?.full_name || "")) {
      showDialog(
        "Change your name?",
        "Your Verified resident tag will be removed, and you'll need to send your Voter's ID again.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Change name", onPress: () => saveProfile() },
        ]
      );
      return;
    }
    saveProfile();
  };

  const saveProfile = async () => {
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

  const updateReview = async (next: VoterIdReview) => {
    const updated = { ...user, voterIdReview: next };
    setUser(updated);
    await saveUser(updated);
  };

  const handleSendVoterId = async () => {
    const missing = voterIdMissing(voterId);
    if (missing || !voterId.front || !voterId.selfie) {
      showDialog("Almost there", missing);
      return;
    }
    setSendingVoterId(true);
    try {
      const result = await submitVoterId({
        documentType: voterId.documentType,
        front: voterId.front,
        selfie: voterId.selfie,
      });
      if (result.ok) {
        if (result.review) await updateReview(result.review);
        setVoterId(emptyVoterIdDraft);
        showDialog(
          "Voter's ID sent",
          "The City will check your photos and notify you. Once approved, responders will see you as a verified resident."
        );
      } else {
        showDialog("Voter's ID not sent", result.message);
        // e.g. an administrator verified the account in the meantime.
        if (result.review) loadUserData();
      }
    } finally {
      setSendingVoterId(false);
    }
  };

  const handleWithdrawVoterId = () => {
    showDialog(
      "Cancel your request?",
      "Your photos will be deleted and the City won't review them. You can send new ones anytime.",
      [
        { text: "Keep request", style: "cancel" },
        {
          text: "Cancel request",
          style: "destructive",
          onPress: async () => {
            setWithdrawing(true);
            const result = await withdrawVoterId();
            setWithdrawing(false);
            if (result.ok) await updateReview(result.review || { status: "" });
            else showDialog("Couldn't cancel", result.message);
          },
        },
      ]
    );
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

        {/* Resident verification: the "Verified resident" tag responders see on reports */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Resident verification</Text>
          {isVerified ? (
            <Text style={[styles.infoVal, styles.verifiedText]} accessibilityLiveRegion="polite">
              ✓ Verified resident{METHOD_LABELS[user?.verificationMethod] || ""}
            </Text>
          ) : review.status === "pending" ? (
            <View accessibilityLiveRegion="polite">
              <Text style={styles.pendingText}>Waiting for review</Text>
              <Text style={styles.voterHint}>
                Your {documentName} is with the City{review.submittedAt ? ` since ${formatDay(review.submittedAt)}` : ""}.
                You'll get a notification once it's checked.
              </Text>
              <TouchableOpacity onPress={handleWithdrawVoterId} disabled={withdrawing} accessibilityRole="button">
                <Text style={styles.cancelLink}>{withdrawing ? "CANCELLING…" : "CANCEL REQUEST"}</Text>
              </TouchableOpacity>
            </View>
          ) : !voterIdAvailable ? (
            <Text style={styles.voterHint}>
              Not verified. Sending a Voter's ID isn't available right now. Please try again later.
            </Text>
          ) : (
            <View style={styles.form}>
              {review.status === "rejected" ? (
                <Text style={styles.rejectedText}>
                  Your last {documentName} wasn't accepted. {asSentence(review.rejectionReason)} Send new photos below.
                </Text>
              ) : (
                <Text style={styles.voterHint}>Not verified yet.</Text>
              )}
              <VoterIdForm value={voterId} onChange={setVoterId} disabled={sendingVoterId} />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSendVoterId} disabled={sendingVoterId}>
                {sendingVoterId ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>SEND FOR REVIEW</Text>
                )}
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
  pendingText: {
    marginTop: 10,
    color: "#FBBF24",
    fontSize: 14,
    fontWeight: "800",
  },
  rejectedText: {
    marginTop: 8,
    color: "#FCA5A5",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  cancelLink: {
    color: "#F87171",
    fontSize: 12,
    fontWeight: "900",
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
