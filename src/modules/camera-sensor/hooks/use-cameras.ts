import { useCallback, useEffect, useRef, useState } from "react";

import { useAuthStore } from "@/modules/auth/store/auth.store";

import { getMyCameras } from "../services/cameras.api";
import type { LiveCamera } from "../types/live-camera.types";

/**
 * Loads the signed-in user's cameras and exposes a refresh so the screen can
 * re-check stream URLs (they change when a camera's IP changes). The screen
 * just renders whatever this returns.
 */
export function useCameras() {
  const user = useAuthStore((state) => state.user);

  const [cameras, setCameras] = useState<LiveCamera[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);

  const loadCameras = useCallback(async () => {
    if (!user || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setError(null);

    try {
      const token = await user.getIdToken();
      const list = await getMyCameras(token);
      setCameras(list);
    } catch (err) {
      console.error("Failed to load cameras:", err);
      setError("Could not load your cameras.");
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCameras([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    loadCameras();
  }, [user, loadCameras]);

  return {
    cameras,
    isLoading,
    error,
    refresh: loadCameras,
  };
}
