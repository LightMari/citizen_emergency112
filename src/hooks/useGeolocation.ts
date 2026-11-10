import { useState, useCallback } from 'react';

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  address: string;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [geoState, setGeoState] = useState<GeolocationState>({
    latitude: 13.0827, // Default fallback to Chennai, Tamil Nadu
    longitude: 80.2707,
    accuracy: null,
    address: 'Anna Salai, Chennai, Tamil Nadu',
    loading: false,
    error: null,
  });

  const reverseGeocode = useCallback(async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
      if (!response.ok) throw new Error('Reverse geocode failed');
      const data = await response.json();
      return data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    } catch (err) {
      console.warn('Reverse geocode error, using coordinates fallback:', err);
      return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    }
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<{ lat: number; lng: number; address: string } | null> => {
    if (!('geolocation' in navigator)) {
      setGeoState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      }));
      return null;
    }

    setGeoState((prev) => ({ ...prev, loading: true, error: null }));

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const accuracy = position.coords.accuracy;

          const address = await reverseGeocode(lat, lon);

          setGeoState({
            latitude: lat,
            longitude: lon,
            accuracy,
            address,
            loading: false,
            error: null,
          });

          resolve({ lat, lng: lon, address });
        },
        (error) => {
          let errorMsg = 'Failed to retrieve location.';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'Location permission was denied. Please select location manually on the map.';
          } else if (error.code === error.TIMEOUT) {
            errorMsg = 'Location request timed out. Please try again or drag the pin.';
          }
          setGeoState((prev) => ({
            ...prev,
            loading: false,
            error: errorMsg,
          }));
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 10000,
        }
      );
    });
  }, [reverseGeocode]);

  const updateLocationManually = useCallback(
    async (lat: number, lon: number) => {
      setGeoState((prev) => ({ ...prev, latitude: lat, longitude: lon, loading: true }));
      const address = await reverseGeocode(lat, lon);
      setGeoState((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lon,
        address,
        loading: false,
      }));
      return address;
    },
    [reverseGeocode]
  );

  return {
    ...geoState,
    getCurrentLocation,
    updateLocationManually,
    reverseGeocode,
  };
}
