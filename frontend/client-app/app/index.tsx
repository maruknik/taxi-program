import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";

export default function Index() {
  const { isSignedIn } = useAuth();

  // Залогований → головний екран, ні → екран входу
  return <Redirect href={isSignedIn ? "/(app)/main" : "/(auth)/login"} />;
}
