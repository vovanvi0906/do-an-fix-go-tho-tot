import { useCallback, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../../auth";
import { faceIdentityService } from "../services/faceIdentityService";

export function useWorkerFaceStatus() {
  const { user } = useAuth();
  const identity = user?.id;
  const [state, setState] = useState({
    owner: null,
    loading: true,
    profile: null,
    status: null,
    error: "",
  });
  const generation = useRef(0),
    request = useRef(null),
    focused = useRef(false);
  const reload = useCallback(async () => {
    if (!identity || !focused.current) return;
    const attempt = ++generation.current;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setState({
      owner: identity,
      loading: true,
      profile: null,
      status: null,
      error: "",
    });
    const [profile, status] = await Promise.allSettled([
      faceIdentityService.profile(controller.signal),
      faceIdentityService.status(controller.signal),
    ]);
    if (
      controller.signal.aborted ||
      attempt !== generation.current ||
      !focused.current
    )
      return;
    setState({
      owner: identity,
      loading: false,
      profile: profile.status === "fulfilled" ? profile.value : null,
      status: status.status === "fulfilled" ? status.value : null,
      error:
        status.status === "rejected" || profile.status === "rejected"
          ? "Chưa tải đầy đủ hồ sơ và FaceID. Kiểm tra kết nối rồi thử lại."
          : "",
    });
  }, [identity]);
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      void reload();
      const listener = AppState.addEventListener("change", (state) => {
        if (state === "active") void reload();
        else {
          request.current?.abort();
          generation.current++;
        }
      });
      return () => {
        focused.current = false;
        generation.current++;
        request.current?.abort();
        listener.remove();
      };
    }, [reload]),
  );
  return {
    ...(state.owner === identity
      ? state
      : { loading: true, profile: null, status: null, error: "" }),
    reload,
  };
}
