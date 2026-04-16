import { ActivityIndicator, View } from "react-native";

export default function LoaderScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
      }}
    >
      <ActivityIndicator size="large" color={"#000000"} />
    </View>
  );
}
