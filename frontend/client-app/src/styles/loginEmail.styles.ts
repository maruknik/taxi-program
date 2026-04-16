import { StyleSheet } from "react-native";
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
    paddingTop: 10,
    paddingBottom: 20,
    justifyContent: "space-between",
  },
  topContent: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  forgotPasswordButton: {
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.black,
    fontWeight: "500",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.black,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginBottom: 16,
    marginTop: -4,
  },
  primaryButton: {
    height: 52,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
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
});
