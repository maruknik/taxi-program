import { useOAuth } from "@clerk/expo";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Alert } from "react-native";
import * as Linking from "expo-linking";
import { useWarmUpBrowser } from "./useWarmUpBrowser";

WebBrowser.maybeCompleteAuthSession();

export const useSSO = (strategy: "oauth_google" | "oauth_apple") => {
  useWarmUpBrowser();
  const router = useRouter();
  const { startOAuthFlow } = useOAuth({ strategy });

  const startSSOFlow = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/(auth)/loader"),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/(app)/main");
      }
    } catch (err: any) {
      console.error(`OAuth (${strategy}) error`, err);
      if (err.message !== "Session canceled by user") {
        Alert.alert("Помилка", err.message || "Помилка авторизації");
      }
    }
  }, [startOAuthFlow, router, strategy]);

  return { startSSOFlow };
};
