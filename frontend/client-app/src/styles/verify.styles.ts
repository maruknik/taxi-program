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
  },
  backButton: {
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
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.darkGray,
    lineHeight: 20,
    marginBottom: 10,
  },
  linkText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "500",
    marginBottom: 30,
  },
  codeContainer: {
    marginBottom: 20,
    position: "relative",
    height: 60,
    justifyContent: "center",
  },
  hiddenInput: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0,
    zIndex: 1,
  },
  boxesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  codeBox: {
    width: "14.5%",
    height: 60,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  codeBoxActive: {
    borderColor: Colors.primary,
  },
  codeBoxError: {
    borderColor: Colors.error,
  },
  codeText: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.black,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginBottom: 20,
  },
  pillButton: {
    backgroundColor: Colors.lightGray,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 12,
  },
  pillButtonText: {
    fontSize: 14,
    color: Colors.black,
    fontWeight: "500",
  },
});
