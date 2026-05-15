import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";

// ── Fix Leaflet broken icons in Vite ─────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ── Custom rose pin icon ──────────────────────────────────
const pinIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:32px;height:44px;">
      <div style="
        width:32px;height:32px;
        background:#f43f5e;
        border:3px solid white;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 3px 10px rgba(244,63,94,0.5);
      "></div>
      <div style="
        position:absolute;top:8px;left:8px;
        width:12px;height:12px;
        background:white;border-radius:50%;
        transform:rotate(45deg);
      "></div>
    </div>
  `,
  iconSize:   [32, 44],
  iconAnchor: [16, 44],
});

// ── Click anywhere to drop/move pin ──────────────────────
const ClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationSelect(
        Math.round(lat * 1000000) / 1000000,
        Math.round(lng * 1000000) / 1000000
      );
    },
  });
  return null;
};

// ── Fly map to new coordinates smoothly ──────────────────
const MapFlyTo = ({ center, zoom = 13 }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center, zoom]);
  return null;
};

// ── Geocode city using free Nominatim API ─────────────────
const geocodeCity = async (query) => {
  if (!query || query.trim().length < 2) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=1&countrycodes=in`,
      {
        headers: {
          // Nominatim requires a user-agent
          "Accept-Language": "en",
        },
      }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        name: data[0].display_name,
      };
    }
    return null;
  } catch {
    return null;
  }
};

// ── Main LocationPicker Component ────────────────────────
const LocationPicker = ({
  latitude,
  longitude,
  onLocationSelect,
  city,       // ← receives city value from parent form
  address,    // ← receives address value from parent form
}) => {
  const hasPin = latitude && longitude;
  const [geocoding, setGeocoding] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);
  const lastGeocodedCity = useRef("");

  // Default center — India
  const defaultCenter = [20.5937, 78.9629];
  const defaultZoom   = 5;

  // ── Auto-geocode when city changes ───────────────────
  // Called when host finishes typing in the city input
  const autoGeocode = useCallback(async () => {
    const query = [address, city].filter(Boolean).join(", ");

    if (!query || query === lastGeocodedCity.current) return;
    lastGeocodedCity.current = query;

    setGeocoding(true);
    try {
      const result = await geocodeCity(query);
      if (result) {
        const lat = Math.round(result.lat * 1000000) / 1000000;
        const lng = Math.round(result.lng * 1000000) / 1000000;

        // Set the pin automatically
        onLocationSelect(lat, lng);

        // Fly map to that location
        setFlyTarget([lat, lng]);
      }
    } finally {
      setGeocoding(false);
    }
  }, [city, address, onLocationSelect]);

  // ── Trigger geocode when city prop changes ────────────
  useEffect(() => {
    if (!city || city.trim().length < 2) return;

    // Debounce — wait 800ms after user stops typing
    const timer = setTimeout(() => {
      autoGeocode();
    }, 800);

    return () => clearTimeout(timer);
  }, [city, autoGeocode]);

  return (
    <div>
      {/* Instructions card */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
        <span className="text-lg mt-0.5">📍</span>
        <div>
          <p className="text-sm font-medium text-blue-700">
            {geocoding
              ? "Finding location on map..."
              : hasPin
              ? "Pin set! Drag it or click map to adjust"
              : "Type city name above — map will auto-locate"}
          </p>
          <p className="text-xs text-blue-500 mt-0.5">
            You can click anywhere on the map to move the pin to the exact spot
          </p>
        </div>
        {/* Spinner while geocoding */}
        {geocoding && (
          <div className="ml-auto flex-shrink-0">
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Map container */}
      <div
        className="rounded-xl overflow-hidden border border-gray-200"
        style={{ height: "300px" }}
      >
        <MapContainer
          center={
            hasPin ? [latitude, longitude] : defaultCenter
          }
          zoom={hasPin ? 14 : defaultZoom}
          style={{ width: "100%", height: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Fly to geocoded location */}
          {flyTarget && (
            <MapFlyTo center={flyTarget} zoom={14} />
          )}

          {/* Click to place/move pin */}
          <ClickHandler onLocationSelect={onLocationSelect} />

          {/* Show pin if set */}
          {hasPin && (
            <Marker
              position={[latitude, longitude]}
              icon={pinIcon}
              draggable={true}
              eventHandlers={{
                // Host can also drag the pin
                dragend(e) {
                  const { lat, lng } = e.target.getLatLng();
                  onLocationSelect(
                    Math.round(lat * 1000000) / 1000000,
                    Math.round(lng * 1000000) / 1000000
                  );
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Coordinates display / status */}
      {hasPin ? (
        <div className="mt-2 flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-sm">✅</span>
            <span className="text-sm text-gray-600">
              Location pinned
            </span>
            <span className="text-xs text-gray-400 font-mono">
              ({latitude}, {longitude})
            </span>
          </div>
          <button
            type="button"
            onClick={() => onLocationSelect(null, null)}
            className="text-xs text-red-400 hover:text-red-600 transition"
          >
            Remove pin
          </button>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
          <span className="text-gray-400 text-sm">🗺️</span>
          <span className="text-xs text-gray-400">
            {geocoding
              ? "Searching for location..."
              : "No pin set yet — type your city above or click the map"}
          </span>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;