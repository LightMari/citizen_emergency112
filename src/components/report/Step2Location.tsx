import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Compass, AlertCircle, RefreshCw } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useI18n } from '../../i18n';

// High-precision SVG teardrop emergency map marker with needle anchor at [16, 42]
const emergencyPinIcon = L.divIcon({
  className: 'custom-emergency-pin',
  html: `
    <div style="position: relative; width: 34px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: grab;">
      <!-- Ground pulse ring at coordinate point -->
      <div style="position: absolute; bottom: 0px; left: 17px; transform: translateX(-50%); width: 22px; height: 11px; background: rgba(229, 72, 77, 0.5); border-radius: 50%; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite; pointer-events: none;"></div>
      <!-- Teardrop Pin SVG -->
      <svg viewBox="0 0 34 44" width="34" height="44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.6));">
        <path d="M17 42C17 42 32 27 32 16C32 7.716 25.284 1 17 1C8.716 1 2 7.716 2 16C2 27 17 42 17 42Z" 
              fill="#e5484d" 
              stroke="#ffffff" 
              stroke-width="2"/>
        <circle cx="17" cy="16" r="10" fill="#0f1115"/>
        <circle cx="17" cy="16" r="4.5" fill="#e5484d"/>
      </svg>
    </div>
  `,
  iconSize: [34, 44],
  iconAnchor: [17, 42],
  popupAnchor: [0, -42],
});

interface LocationProps {
  latitude: number | null;
  longitude: number | null;
  area: string;
  address: string;
  landmark: string;
  onChangeCoordinates: (lat: number, lng: number) => void;
  onChangeArea: (area: string) => void;
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
  area,
  address,
  landmark,
  onChangeCoordinates,
  onChangeArea,
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

      {/* Area, Address & Landmark Inputs */}
      <div className="space-y-3 pt-1">
        <div>
          <label className="block text-xs font-medium text-graphite-secondary mb-1">
            Area / Locality <span className="text-emergency-accent">*</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={area}
              onChange={(e) => onChangeArea(e.target.value)}
              placeholder="e.g. T. Nagar, Guindy, Velachery, Central"
              className="flex-1 bg-graphite-card border border-graphite-border focus:border-graphite-border-strong focus:outline-none focus:ring-1 focus:ring-graphite-border-strong rounded-control px-3 py-2 text-xs sm:text-sm text-graphite-text placeholder:text-graphite-muted"
            />
            <select
              value={['T. Nagar', 'Guindy', 'Velachery', 'Central', 'Mylapore', 'Anna Nagar', 'Koyambedu', 'Manali'].includes(area) ? area : ''}
              onChange={(e) => {
                if (e.target.value) onChangeArea(e.target.value);
              }}
              className="bg-graphite-raised border border-graphite-border text-xs rounded-control px-2.5 py-2 text-graphite-secondary focus:outline-none shrink-0"
            >
              <option value="">Quick select area...</option>
              <option value="T. Nagar">T. Nagar</option>
              <option value="Guindy">Guindy</option>
              <option value="Velachery">Velachery</option>
              <option value="Central">Central</option>
              <option value="Mylapore">Mylapore</option>
              <option value="Anna Nagar">Anna Nagar</option>
              <option value="Koyambedu">Koyambedu</option>
              <option value="Manali">Manali</option>
            </select>
          </div>
        </div>

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
