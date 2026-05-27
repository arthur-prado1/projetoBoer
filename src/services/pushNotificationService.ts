import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { User } from "firebase/auth";
import { Platform } from "react-native";
import { ref, set } from "firebase/database";
import { database } from "./connectionFirebase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function getProjectId() {
  const fromEas = Constants.easConfig?.projectId;
  const fromExpo = (Constants.expoConfig?.extra as any)?.eas?.projectId;
  return fromEas || fromExpo;
}

export async function registerPushForUser(user: User) {
  if (Platform.OS === "web") return { ok: false, reason: "web_not_supported" };
  if (!Device.isDevice) return { ok: false, reason: "physical_device_required" };

  let finalStatus: Notifications.PermissionStatus = "undetermined";
  try {
    const { status: currentStatus } = await Notifications.getPermissionsAsync();
    finalStatus = currentStatus;
  } catch {
    return { ok: false, reason: "permission_check_failed" };
  }

  if (finalStatus !== "granted") {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    } catch {
      return { ok: false, reason: "permission_request_failed" };
    }
  }

  if (finalStatus !== "granted") {
    return { ok: false, reason: "permission_denied" };
  }

  if (Device.osName === "Android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#38bdf8",
    });
  }

  try {
    const projectId = getProjectId();
    const expoToken = (
      await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)
    ).data;
    const nativeToken = (await Notifications.getDevicePushTokenAsync()).data;

    await set(ref(database, `notificationTokens/${user.uid}`), {
      userId: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      expoPushToken: expoToken ?? null,
      nativePushToken: nativeToken ?? null,
      platform: Device.osName ?? null,
      updatedAt: new Date().toISOString(),
    });

    return { ok: true };
  } catch {
    return { ok: false, reason: "token_registration_failed" };
  }
}

export function subscribeNotificationListeners(onTapNotification: () => void) {
  const receivedSub = Notifications.addNotificationReceivedListener(() => {
    // foreground notification hook (reserved for future use)
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener(() => {
    onTapNotification();
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
