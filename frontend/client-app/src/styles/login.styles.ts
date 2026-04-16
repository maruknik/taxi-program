import { StyleSheet, Platform } from "react-native";
import { Colors } from "../constants/theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.black,
    marginBottom: 30,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  countryPicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 18,
    height: 52,
    borderRadius: 8,
    marginRight: 10,
  },
  flag: {
    fontSize: 20,
  },
  caret: {
    marginLeft: 8,
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
    height: 52,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  countryCode: {
    fontSize: 16,
    color: Colors.black,
    marginRight: 8,
    fontWeight: "500",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
  },
  primaryButton: {
    height: 52,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  primaryButtonInactive: {
    backgroundColor: Colors.mediumGray,
  },
  primaryButtonActive: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButtonTextInactive: {
    color: Colors.grayText,
  },
  primaryButtonTextActive: {
    color: Colors.white,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  dividerText: {
    marginHorizontal: 10,
    color: Colors.grayText,
    fontSize: 14,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 16,
  },
  socialIcon: {
    marginRight: 10,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: Colors.black,
    fontWeight: "500",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 20 : 30,
  },
  footerText: {
    textAlign: "center",
    fontSize: 12,
    color: Colors.darkGray,
    lineHeight: 18,
  },
});
