import { StyleSheet, Platform } from "react-native";
import { Colors } from "../constants/theme";

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === "android" ? 40 : 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
    marginHorizontal: 20,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 46,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: Colors.black,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  countryItemFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  countryItemName: {
    fontSize: 16,
    color: Colors.black,
  },
});
