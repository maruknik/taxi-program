import { StyleSheet } from "react-native";
import { Colors } from "../constants/theme";

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
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
  closeButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.black,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.darkGray,
    lineHeight: 22,
    marginBottom: 24,
  },
  inputContainer: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    height: 52,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    fontSize: 16,
    color: Colors.black,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 8,
  },
  primaryButton: {
    height: 52,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
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
  // Success states
  successImageContainer: {
    width: "100%",
    height: 250,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    overflow: "hidden",
  },
  successImage: {
    width: "100%",
    height: "100%",
  },
  successDescription: {
    fontSize: 15,
    color: Colors.black,
    lineHeight: 22,
    marginBottom: 16,
  },
  successSubDescription: {
    fontSize: 15,
    color: Colors.black,
    lineHeight: 22,
  },
});
