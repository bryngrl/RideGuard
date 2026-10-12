import { useEffect, useState } from "react";

export function useRideTimer(
  isRideActive: boolean,
  rideStartedAt: Date | null,
) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isRideActive || !rideStartedAt) {
      setElapsedSeconds(0);
      return;
    }

    const updateDuration = () => {
      setElapsedSeconds(
        Math.floor((Date.now() - rideStartedAt.getTime()) / 1000),
      );
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [isRideActive, rideStartedAt]);

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const remainingSeconds = elapsedSeconds % 60;

  const formattedDuration =
    !isRideActive || !rideStartedAt
      ? "Not started"
      : hours > 0
        ? `${hours}h ${minutes}m`
        : minutes > 0
          ? `${minutes}m ${remainingSeconds}s`
          : `${remainingSeconds}s`;

  return { elapsedSeconds, formattedDuration };
}
