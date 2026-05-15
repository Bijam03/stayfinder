import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import L from "leaflet";

// ── Fix Leaflet icons ─────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ── Custom rose pin ───────────────────────────────────────
const pinIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      position: relative;
      width: 40px;
      height: 52px;
    ">
      <div style="
        width: 40px;
        height: 40px;
        background: #f43f5e;
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 14px rgba(244,63,94,0.45);
      "></div>
      <div style="
        position: absolute;
        top: 10px;
        left: 10px;
        width: 16px;
        height: 16px;
        background: white;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize:   [40, 52],
  iconAnchor: [20, 52],
});

// ── Main Component ────────────────────────────────────────
const PropertyLocationMap = ({ property }) => {
  const lat = property?.location?.latitude;
  const lng = property?.location?.longitude;

  if (!lat || !lng) return null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">

      {/* Section header */}
      <h2 className="text-xl font-semibold text-gray-900 mb-1">
        Where you'll be
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        {property.location?.address && `${property.location.address}, `}
        {property.location?.city}, {property.location?.state},{" "}
        {property.location?.country}
      </p>

      {/* Map */}
      <div
        className="rounded-xl overflow-hidden border border-gray-100"
        style={{ height: "320px" }}
      >
        <MapContainer
          center={[lat, lng]}
          zoom={14}
          style={{ width: "100%", height: "100%" }}
          scrollWheelZoom={false}
          dragging={true}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Exact pin */}
          <Marker position={[lat, lng]} icon={pinIcon} />

          {/* Soft circle around pin — approximate area */}
          <Circle
            center={[lat, lng]}
            radius={200}
            pathOptions={{
              fillColor:   "#f43f5e",
              fillOpacity: 0.08,
              color:       "#f43f5e",
              weight:      1.5,
              opacity:     0.3,
            }}
          />
        </MapContainer>
      </div>

      {/* Location note */}
      <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
        <span>📍</span>
        Exact location is shown on the map above
      </p>
    </div>
  );
};

export default PropertyLocationMap;