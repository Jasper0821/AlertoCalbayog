import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import Header from "../components/Header";
import { COLORS } from "../styles/colors";
import api from "../api/axios";
import { getToken } from "../utils/Storage";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "UserAgreement">;
};

export default function UserAgreementScreen({ navigation }: Props): React.JSX.Element {
  const [agreedTerms, setAgreedTerms] = useState<boolean>(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Modal view for full text
  const [modalType, setModalType] = useState<"terms" | "privacy" | null>(null);

  const canContinue = agreedTerms && agreedPrivacy && !submitting;

  const handleAcceptAndContinue = async () => {
    if (!canContinue) return;

    setSubmitting(true);
    try {
      const token = await getToken();
      if (token) {
        await api.post(
          "/auth/accept-terms",
          { termsVersion: "1.0", privacyPolicyVersion: "1.0" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      navigation.replace("Home");
    } catch (err: any) {
      console.error("Failed to save terms acceptance:", err);
      // Even if offline, allow continuing to Home if authenticated token exists
      navigation.replace("Home");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <Header title="User Agreement" showBack={false} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.badgeLabel}>REQUIRED USER AGREEMENT · VERSION 1.0</Text>

          <Text style={styles.headerTitle}>Welcome to Alerto Calbayog</Text>

          <Text style={styles.introText}>
            Before accessing the Alerto Calbayog Emergency Reporting System, you must review and agree to our Terms and Conditions and Privacy Policy.
          </Text>

          {/* Key Obligations Highlight Box */}
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ EMERGENCY RESPONSIBILITY NOTICE</Text>
            <Text style={styles.warningText}>
              • <Text style={{ fontWeight: "800" }}>Strict Zero Tolerance for Prank / Fake Reports:</Text> Submitting false emergency reports diverts real emergency services (CDRRMO, BFP, PNP) and endangers lives.
            </Text>
            <Text style={styles.warningText}>
              • <Text style={{ fontWeight: "800" }}>Legal Accountability:</Text> Every emergency report logs your authenticated Google ID, device IP address, and location. Prank reporting is punishable by law under Philippine jurisprudence.
            </Text>
          </View>

          {/* Detailed Points */}
          <View style={styles.pointsList}>
            {[
              {
                title: "1. Genuine Emergency Use Only",
                detail: "Use this application exclusively to report actual fires, medical emergencies, crimes, floods, or public safety incidents in Calbayog City.",
              },
              {
                title: "2. Real-Time Location & Data Tracking",
                detail: "You consent to sharing your precise GPS location and contact information with official dispatchers during an emergency report.",
              },
              {
                title: "3. Account Ownership & Identity Verification",
                detail: "Your Google authentication identity is linked to your account to ensure genuine user accountability across all reports.",
              },
              {
                title: "4. System Integrity & Security",
                detail: "Unauthorized attempts to reverse-engineer, flood, or bypass safety mechanisms are strictly prohibited and monitored.",
              },
            ].map((item, idx) => (
              <View key={idx} style={styles.pointItem}>
                <Text style={styles.pointTitle}>{item.title}</Text>
                <Text style={styles.pointDetail}>{item.detail}</Text>
              </View>
            ))}
          </View>

          {/* Checkboxes Section */}
          <View style={styles.checkboxSection}>
            {/* Checkbox 1: Terms */}
            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={[styles.checkbox, agreedTerms && styles.checkboxChecked]}
                onPress={() => setAgreedTerms(!agreedTerms)}
                activeOpacity={0.8}
              >
                {agreedTerms && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              <View style={styles.checkboxLabelWrapper}>
                <Text style={styles.checkboxLabelText}>
                  I agree to the{" "}
                  <Text
                    style={styles.linkText}
                    onPress={() => setModalType("terms")}
                  >
                    Terms and Conditions
                  </Text>
                </Text>
              </View>
            </View>

            {/* Checkbox 2: Privacy Policy */}
            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={[styles.checkbox, agreedPrivacy && styles.checkboxChecked]}
                onPress={() => setAgreedPrivacy(!agreedPrivacy)}
                activeOpacity={0.8}
              >
                {agreedPrivacy && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              <View style={styles.checkboxLabelWrapper}>
                <Text style={styles.checkboxLabelText}>
                  I acknowledge and accept the{" "}
                  <Text
                    style={styles.linkText}
                    onPress={() => setModalType("privacy")}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Accept & Continue Button */}
          <TouchableOpacity
            style={[styles.submitButton, !canContinue && styles.submitButtonDisabled]}
            onPress={handleAcceptAndContinue}
            disabled={!canContinue}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Accept & Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Full Document Modal */}
      <Modal
        visible={modalType !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setModalType(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setModalType(null)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === "terms" ? "Terms & Conditions" : "Privacy Policy"}
              </Text>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator>
              {modalType === "terms" ? (
                <Text style={styles.modalBodyText}>
                  {`ALERTO CALBAYOG TERMS AND CONDITIONS (v1.0)

1. ACCEPTANCE OF TERMS
By accessing or using the Alerto Calbayog mobile application, you agree to be legally bound by these Terms and Conditions.

2. PURPOSE OF APPLICATION
Alerto Calbayog is a civic emergency response reporting tool created to assist residents of Calbayog City in reporting urgent situations to relevant responders (CDRRMO, BFP, PNP).

3. ZERO TOLERANCE FOR FALSE OR FRAUDULENT REPORTS
Filing false, frivolous, or prank emergency reports is strictly prohibited. Every submission records device metadata, user authentication records, and precise location. Violators will be banned and referred to law enforcement authorities.

4. USER CONDUCT & ACCOUNT SECURITY
You are responsible for maintaining the confidentiality of your account credentials. You agree not to upload malicious software, interfere with app services, or impersonate emergency officials.

5. LIMITATION OF LIABILITY
While emergency services strive to respond rapidly, the app developer and municipal authorities do not guarantee response speeds or uninterrupted app availability during severe network or disaster outages.`}
                </Text>
              ) : (
                <Text style={styles.modalBodyText}>
                  {`ALERTO CALBAYOG PRIVACY POLICY (v1.0)

1. INFORMATION WE COLLECT
We collect verified account details (Name, Email, Profile Picture via Google Sign-In), device IP address, contact phone numbers, and precise GPS location during incident reporting.

2. HOW WE USE YOUR DATA
Your personal data and GPS coordinates are used exclusively to dispatch emergency responders to your location and notify you regarding incident updates.

3. DATA SHARING & PROTECTION
Your location and contact details are shared only with authorized emergency responders (BFP, PNP, CDRRMO). We do not sell or monetize user data.

4. USER RIGHTS & RETENTION
You have the right to request deletion of your account. Emergency audit logs are archived securely in compliance with legal retention policies.`}
                </Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setModalType(null)}
            >
              <Text style={styles.modalDoneBtnText}>Close & Return</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginBottom: 8,
    opacity: 0.7,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 10,
  },
  introText: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 21,
    marginBottom: 16,
  },
  warningBox: {
    backgroundColor: "rgba(185, 28, 28, 0.06)",
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.red,
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.red,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: "#7F1D1D",
    lineHeight: 19,
    marginBottom: 6,
  },
  pointsList: {
    gap: 14,
    marginBottom: 24,
  },
  pointItem: {
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pointTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 4,
  },
  pointDetail: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 19,
  },
  checkboxSection: {
    gap: 14,
    marginBottom: 24,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "#FFFFFF",
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  checkboxLabelWrapper: {
    flex: 1,
  },
  checkboxLabelText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    fontWeight: "600",
  },
  linkText: {
    color: COLORS.blue,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#94A3B8",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(4, 17, 43, 0.7)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.primary,
  },
  modalCloseIcon: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textMuted,
    padding: 4,
  },
  modalBodyText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  modalDoneBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalDoneBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
