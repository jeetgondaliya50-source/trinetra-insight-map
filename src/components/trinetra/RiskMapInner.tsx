import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, LayersControl, Polyline } from "react-leaflet";
import type { RiskResult } from "@/lib/trinetra/engine";

const NAGPUR: [number, number] = [21.1458, 79.0882];

function color(band: RiskResult["band"]) {
  return band === "high" ? "#ff4d3d" : band === "medium" ? "#ffb020" : "#25d07a";
}

interface Props {
  results: RiskResult[];
  selectedId?: string | undefined;
  onSelect?: (id: string) => void;
  showHeat?: boolean;
  showRoutes?: boolean;
}

export default function RiskMapInner({ results, selectedId, onSelect, showHeat = true, showRoutes = true }: Props) {
  const high = results.filter((r) => r.band === "high").slice(0, 6);
  const hub = results.find((r) => r.junction.id === "J01");

  return (
    <MapContainer
      center={NAGPUR}
      zoom={12}
      scrollWheelZoom
      className="h-full w-full"
      zoomControl
      preferCanvas
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Tactical Dark">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap &copy; CARTO'
            maxZoom={20}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Street">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap &copy; CARTO'
            maxZoom={20}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri, Maxar, Earthstar Geographics"
            maxZoom={19}
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      {showRoutes &&
        hub &&
        high.map((r) => (
          <Polyline
            key={`route-${r.junction.id}`}
            positions={[
              [hub.junction.lat, hub.junction.lon],
              [r.junction.lat, r.junction.lon],
            ]}
            pathOptions={{ color: "#39d6e0", weight: 1, opacity: 0.35, dashArray: "6 10" }}
          />
        ))}

      {showHeat &&
        results.map((r) => (
          <CircleMarker
            key={`heat-${r.junction.id}`}
            center={[r.junction.lat, r.junction.lon]}
            radius={12 + (r.score / 100) * 30}
            pathOptions={{
              color: color(r.band),
              fillColor: color(r.band),
              fillOpacity: 0.12 + (r.score / 100) * 0.18,
              weight: 0,
            }}
            interactive={false}
          />
        ))}

      {results.map((r) => (
        <CircleMarker
          key={r.junction.id}
          center={[r.junction.lat, r.junction.lon]}
          radius={selectedId === r.junction.id ? 11 : 6 + (r.score / 100) * 4}
          pathOptions={{
            color: selectedId === r.junction.id ? "#ffffff" : color(r.band),
            fillColor: color(r.band),
            fillOpacity: 0.95,
            weight: selectedId === r.junction.id ? 3 : 1.5,
          }}
          eventHandlers={{ click: () => onSelect?.(r.junction.id) }}
        >
          <Tooltip direction="top" offset={[0, -6]} opacity={1}>
            <span className="font-mono text-xs">
              {r.junction.name} — {r.score}
            </span>
          </Tooltip>
          <Popup className="tn-popup" minWidth={250}>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-base font-semibold">{r.junction.name}</p>
                <span
                  className="rounded px-2 py-0.5 font-mono text-xs font-bold"
                  style={{ background: color(r.band), color: "#0d1117" }}
                >
                  {r.score}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{r.explanation}</p>
              <div className="grid grid-cols-2 gap-1 font-mono text-[11px] text-muted-foreground">
                <span>Congestion {(r.congestionIndex * 100).toFixed(0)}%</span>
                <span>Violations/hr {r.violationsPerHour}</span>
                <span>Officers {r.officersPresent}/{r.officersRecommended}</span>
                <span>Priority {r.priority}</span>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
