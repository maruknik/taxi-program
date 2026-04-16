import { StyleSheet, Platform } from "react-native";
import { Colors } from "../constants/theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },

  // ─── Map Area ────────────────────────────────────────────────────────────────
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#E8EAE0",
  },

  // ─── Map grid lines (decorative) ─────────────────────────────────────────────
  mapGridH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(200, 200, 190, 0.6)",
  },
  mapGridV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(200, 200, 190, 0.6)",
  },
  mapRoad: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
  },

  // ─── Top Controls ─────────────────────────────────────────────────────────────
  topBar: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  // ─── My Location Button ───────────────────────────────────────────────────────
  myLocationButton: {
    position: "absolute",
    bottom: 24,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  // ─── Bottom Panel ─────────────────────────────────────────────────────────────
  bottomPanel: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 32 : 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.mediumGray,
    alignSelf: "center",
    marginBottom: 16,
  },

  // ─── Search Row ───────────────────────────────────────────────────────────────
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  searchText: {
    flex: 1,
    fontSize: 16,
    color: Colors.grayText,
    fontWeight: "400",
  },
  scheduleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    gap: 6,
  },
  scheduleText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.darkGray,
  },

  // ─── Quick Actions ────────────────────────────────────────────────────────────
  quickActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  quickActionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.darkGray,
  },
  quickActionSublabel: {
    fontSize: 12,
    color: Colors.grayText,
    marginTop: 1,
  },
});
