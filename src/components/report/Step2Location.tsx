import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Compass, AlertCircle, RefreshCw } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useI18n } from '../../i18n';

// Clean, precise SVG emergency map marker
const emergencyPinIcon = L.divIcon({
  className: 'custom-emergency-pin',
  html: `
    <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 24px; height: 24px; background: rgba(229, 72, 77, 0.2); border-radius: 50%;"></div>
      <div style="width: 14px; height: 14px; background: #e5484d; border: 2px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5); z-index: 2;"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

interface LocationProps {
  latitude: number | null;
  longitude: number | null;
  address: string;
  landmark: string;
  onChangeCoordinates: (lat: number, lng: number) => void;
  onChangeAddress: (address: string) => void;
  onChangeLandmark: (landmark: string) => void;
  onUseCurrentLocation: () => Promise<{ lat: number; lng: number; address: string } | null>;
  isLocating: boolean;
  locationError?: string | null;
}

// Helper component to recenter map view
const MapController: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
};

// Component to handle map clicks for pin relocation
const MapClickHandler: React.FC<{ onPositionChange: (lat: number, lng: number) => void }> = ({
  onPositionChange,
}) => {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export const Step2Location: React.FC<LocationProps> = ({
  latitude,
  longitude,
  address,
  landmark,
  onChangeCoordinates,
  onChangeAddress,
  onChangeLandmark,
  onUseCurrentLocation,
  isLocating,
  locationError,
}) => {
  const { t } = useI18n();
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const markerRef = useRef<L.Marker | null>(null);

  const defaultLat = latitude || 13.0827; // Chennai, Tamil Nadu
  const defaultLng = longitude || 80.2707;

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {
          headers: { 'Accept-Language': 'en' },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          onChangeAddress(data.display_name);
        }
      }
    } catch (err) {
      console.warn('Reverse geocode error:', err);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const handleMarkerDragEnd = (e: any) => {
    const marker = e.target;
    if (marker) {
      const position = marker.getLatLng();
      onChangeCoordinates(position.lat, position.lng);
      reverseGeocode(position.lat, position.lng);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    onChangeCoordinates(lat, lng);
    reverseGeocode(lat, lng);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Location action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h3 className="text-xs font-medium text-graphite-secondary flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-emergency-accent stroke-[1.75]" />
            <span>{t('locationTitle')}</span>
          </h3>
          <p className="text-[11px] text-graphite-muted mt-0.5">{t('dragPinNotice')}</p>
        </div>

        {/* GPS Button */}
        <button
          type="button"
          onClick={onUseCurrentLocation}
          disabled={isLocating}
          className="group h-9 px-3 bg-graphite-raised hover:bg-emerald-500/5 hover:border-emerald-500/40 active:bg-graphite-card border border-graphite-border-strong text-graphite-text font-medium rounded-control text-xs flex items-center justify-center space-x-2 transition-colors duration-150 disabled:opacity-50"
        >
          {isLocating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400 stroke-[1.5]" />
              <span className="text-emerald-300">{t('locating')}</span>
            </>
          ) : (
            <>
              <Navigation className="w-3.5 h-3.5 text-emerald-400 stroke-[1.5] group-hover:scale-105 transition-transform" />
              <span className="group-hover:text-emerald-200 transition-colors">{t('useMyLocation')}</span>
            </>
          )}
        </button>
      </div>

      {/* Interactive Map View */}
      <div className="relative rounded-card overflow-hidden border border-graphite-border bg-graphite-deep h-[280px] sm:h-[320px]">
        <MapContainer
          center={[defaultLat, defaultLng]}
          zoom={15}
          scrollWheelZoom={true}
          className="w-full h-full z-10"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={[defaultLat, defaultLng]} />
          <MapClickHandler onPositionChange={handleMapClick} />
          <Marker
            position={[defaultLat, defaultLng]}
            draggable={true}
            icon={emergencyPinIcon}
            eventHandlers={{
              dragend: handleMarkerDragEnd,
            }}
            ref={markerRef}
          />
        </MapContainer>

        {/* Floating coordinates badge */}
        <div className="absolute bottom-2.5 left-2.5 z-20 bg-graphite-deep/90 backdrop-blur-sm border border-graphite-border px-2.5 py-1 rounded-control text-[11px] font-mono tabular-nums text-graphite-secondary flex items-center space-x-1.5 shadow-sm">
          <Compass className="w-3 h-3 text-emergency-accent stroke-[1.5]" />
          <span>
            {defaultLat.toFixed(5)}, {defaultLng.toFixed(5)}
          </span>
        </div>
      </div>

      {locationError && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-control text-xs text-amber-200 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 stroke-[1.5]" />
          <span>{locationError}</span>
        </div>
      )}

      {/* Address & Landmark Inputs */}
      <div className="space-y-3 pt-1">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-medium text-graphite-secondary">
              {t('addressLabel')}
            </label>
            {isReverseGeocoding && (
              <span className="text-[11px] text-graphite-muted flex items-center space-x-1">
                <RefreshCw className="w-3 h-3 animate-spin stroke-[1.5]" />
                <span>Geocoding coordinates...</span>
              </span>
            )}
          </div>
          <input
            type="text"
            value={address}
            onChange={(e) => onChangeAddress(e.target.value)}
            placeholder="Street address or nearest intersection"
            className="w-full bg-graphite-card border border-graphite-border focus:border-graphite-border-strong focus:outline-none focus:ring-1 focus:ring-graphite-border-strong rounded-control px-3 py-2 text-xs sm:text-sm text-graphite-text placeholder:text-graphite-muted"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-graphite-secondary mb-1">
            {t('landmarkLabel')}
          </label>
          <input
            type="text"
            value={landmark}
            onChange={(e) => onChangeLandmark(e.target.value)}
            placeholder={t('landmarkPlaceholder')}
            className="w-full bg-graphite-card border border-graphite-border focus:border-graphite-border-strong focus:outline-none focus:ring-1 focus:ring-graphite-border-strong rounded-control px-3 py-2 text-xs sm:text-sm text-graphite-text placeholder:text-graphite-muted"
          />
        </div>
      </div>
    </div>
  );
};
