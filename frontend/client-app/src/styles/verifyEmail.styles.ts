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
    paddingTop: 30,
    paddingBottom: 20,
    justifyContent: "space-between",
  },
  topContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.black,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.black,
    lineHeight: 22,
    marginBottom: 20,
  },
  boxesContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  codeBox: {
    width: 48,
    height: 52,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  codeBoxActive: {
    borderColor: Colors.error, // Because in the mockup, focused error is red. Actually focus is what... wait
  },
  codeBoxError: {
    borderColor: Colors.error,
  },
  codeText: {
    fontSize: 24,
    color: Colors.black,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginBottom: 20,
  },
  pillButton: {
    backgroundColor: Colors.lightGray,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 50,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  pillButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.black,
  },
  codeContainer: {
    position: "relative",
    width: "100%",
  },
  hiddenInput: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 60,
    opacity: 0,
    color: "transparent",
    zIndex: 10,
  },
});
