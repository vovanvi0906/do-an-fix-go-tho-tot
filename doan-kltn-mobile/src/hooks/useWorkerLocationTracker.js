import { useState, useRef, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { socketService } from '../services/socket/socketService';

export function useWorkerLocationTracker(orderId, workerId) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const locationSubRef = useRef(null);

  const startTracking = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('⚠️ [LocationTracker] Quyen truy cap vi tri bi tu choi');
        return false;
      }

      // Lay toa do khoi dau
      const initialLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (initialLoc) {
        setCurrentLocation(initialLoc.coords);
        socketService.emit('worker:update_location', {
          orderId,
          lat: initialLoc.coords.latitude,
          lng: initialLoc.coords.longitude,
          workerId,
        });
      }

      // Bat theo doi di chuyen lien tuc
      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 10,
        },
        (loc) => {
          setCurrentLocation(loc.coords);
          socketService.emit('worker:update_location', {
            orderId,
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            workerId,
          });
        }
      );

      setIsTracking(true);
      return true;
    } catch (err) {
      console.warn('⚠️ [LocationTracker] Loi khoi dong GPS:', err.message);
      return false;
    }
  }, [orderId, workerId]);

  const stopTracking = useCallback(() => {
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
    setIsTracking(false);
  }, []);

  useEffect(() => {
    return () => {
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
    };
  }, []);

  return { isTracking, currentLocation, startTracking, stopTracking };
}

