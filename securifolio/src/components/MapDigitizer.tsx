'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap, LayersControl } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import * as L from 'leaflet';
import * as turf from '@turf/turf';
import { LocateFixed, Loader2, Search, Upload } from 'lucide-react';
import Papa from 'papaparse';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Fix for leaflet markers in Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function SearchControl() {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', République Démocratique du Congo')}&limit=5`);
      const data = await response.json();
      setResults(data);
      setShowResults(true);
      
      if (data.length > 0) {
        const { lat, lon } = data[0];
        map.flyTo([parseFloat(lat), parseFloat(lon)], 17);
        if (data.length === 1) setShowResults(false);
      } else {
        alert("Aucun résultat trouvé.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la recherche.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (lat: string, lon: string) => {
    map.flyTo([parseFloat(lat), parseFloat(lon)], 18);
    setShowResults(false);
  };

  return (
    <div 
      className="absolute top-[10px] left-[50px] z-[1000] flex flex-col w-[250px] sm:w-[300px]"
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <form onSubmit={handleSearch} className="flex bg-white rounded-lg shadow-sm border-2 border-slate-200/50 overflow-hidden">
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher: Commune, Avenue..."
          className="flex-1 px-3 py-2 text-sm outline-none text-slate-800 bg-transparent placeholder-slate-400 font-medium"
        />
        <button 
          type="submit"
          className="bg-slate-50 px-3 py-2 text-slate-500 hover:text-brand-primary hover:bg-slate-100 transition-colors border-l border-slate-200/50"
          disabled={isSearching}
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </form>
      
      {showResults && results.length > 1 && (
        <div className="mt-1 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden max-h-[200px] overflow-y-auto">
          {results.map((result, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(result.lat, result.lon)}
              className="w-full text-left px-3 py-2.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-0 truncate"
            >
              {result.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LocateControl() {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = () => {
    setIsLocating(true);
    map.locate({ setView: true, maxZoom: 22, enableHighAccuracy: true });
  };

  useEffect(() => {
    map.on('locationfound', () => {
      setIsLocating(false);
    });
    map.on('locationerror', () => {
      setIsLocating(false);
      alert('Impossible de vous localiser. Veuillez vérifier vos permissions GPS.');
    });
    
    return () => {
      map.off('locationfound');
      map.off('locationerror');
    };
  }, [map]);

  return (
    <div className="absolute top-[80px] left-[10px] z-[1000]">
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleLocate();
        }}
        className="bg-white border-2 border-slate-200/50 w-[34px] h-[34px] rounded flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
        title="Me localiser (GPS)"
      >
        {isLocating ? (
          <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
        ) : (
          <LocateFixed className="w-5 h-5 text-slate-700 hover:text-brand-primary" />
        )}
      </button>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RtkUploaderControl({ featureGroupRef, onPolygonDrawn }: { featureGroupRef: any, onPolygonDrawn: any }) {
  const map = useMap();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processRtkFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length < 3) {
          alert('Le fichier doit contenir au moins 3 points pour former un polygone.');
          return;
        }

        const originalHeaders = results.meta.fields || [];
        const headers = originalHeaders.map(f => f.toLowerCase().trim());
        
        let latIndex = headers.findIndex(h => h.includes('lat') || h === 'y' || h.includes('latitude'));
        let lngIndex = headers.findIndex(h => h.includes('lon') || h.includes('lng') || h === 'x' || h.includes('longitude'));

        if (latIndex === -1 || lngIndex === -1) {
           // Fallback to first two columns if no clear headers
           latIndex = 0;
           lngIndex = 1;
        }

        const latKey = originalHeaders[latIndex];
        const lngKey = originalHeaders[lngIndex];

        if (!latKey || !lngKey) {
           alert('Impossible de détecter les colonnes de coordonnées dans le fichier CSV.');
           return;
        }

        const coordinates: [number, number][] = [];
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const row of results.data as any[]) {
           if (!row[latKey] || !row[lngKey]) continue;
           
           // Replace commas with dots for French locales
           const latStr = String(row[latKey]).trim().replace(',', '.');
           const lngStr = String(row[lngKey]).trim().replace(',', '.');
           
           const lat = parseFloat(latStr);
           const lng = parseFloat(lngStr);
           if (!isNaN(lat) && !isNaN(lng)) {
             coordinates.push([lng, lat]);
           }
        }

        if (coordinates.length < 3) {
          alert('Pas assez de coordonnées valides trouvées.');
          return;
        }

        const first = coordinates[0];
        const last = coordinates[coordinates.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
           coordinates.push([...first]); 
        }

        const geojson = {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [coordinates]
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const layer = L.geoJSON(geojson as any, {
          style: {
            color: '#10b981',
            fillOpacity: 0.5,
            weight: 3
          }
        });

        featureGroupRef.current.clearLayers();
        layer.eachLayer((l) => {
          featureGroupRef.current.addLayer(l);
        });

        map.fitBounds(featureGroupRef.current.getBounds(), { padding: [50, 50] });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const area = turf.area(geojson as any);
        onPolygonDrawn(geojson, area);
      },
      error: (error) => {
        alert('Erreur lors de la lecture du fichier : ' + error.message);
      }
    });
  };

  return (
    <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 z-[1000]">
      <input 
        type="file" 
        accept=".csv,.txt"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            processRtkFile(file);
          }
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        className="hidden"
      />
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          fileInputRef.current?.click();
        }}
        className="bg-brand-primary text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 hover:bg-emerald-400 transition-all border border-emerald-500"
      >
        <Upload className="w-4 h-4" />
        Importer Levé RTK (CSV)
      </button>
    </div>
  );
}

interface MapDigitizerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPolygonDrawn: (geojson: any, areaSqm: number) => void;
}

export default function MapDigitizer({ onPolygonDrawn }: MapDigitizerProps) {
  const [mounted, setMounted] = useState(false);
  const featureGroupRef = useRef<L.FeatureGroup>(null);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-[400px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 font-medium">Chargement de la carte spatiale...</div>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreated = (e: any) => {
    const layer = e.layer;
    if (!featureGroupRef.current) return;
    
    // Si l'utilisateur dessine un nouveau polygone, on efface les anciens
    featureGroupRef.current.clearLayers();
    featureGroupRef.current.addLayer(layer);
    
    updateData(layer);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEdited = (e: any) => {
    const layers = e.layers;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lastLayer: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layers.eachLayer((layer: any) => {
      lastLayer = layer;
    });
    
    if (lastLayer) {
      updateData(lastLayer);
    }
  };

  const handleDeleted = () => {
    onPolygonDrawn(null, 0);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData = (layer: any) => {
    const geojson = layer.toGeoJSON();
    const area = turf.area(geojson);
    onPolygonDrawn(geojson, area);
  };

  return (
    <div className="w-full h-[400px] rounded-2xl overflow-hidden border border-slate-200 dark:border-brand-border relative z-0">
      <style>{`
        .leaflet-left .leaflet-control-layers {
          margin-top: 50px !important;
        }
      `}</style>
      <MapContainer 
        center={[-4.32758, 15.31357]} // Kinshasa by default
        zoom={14} 
        maxZoom={24}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <LayersControl position="topleft">
          <LayersControl.BaseLayer checked name="Satellite (Haute Précision)">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={19}
              maxZoom={24}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Plan (Avenues & Rues)">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxNativeZoom={19}
              maxZoom={24}
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        <SearchControl />
        <LocateControl />
        <RtkUploaderControl featureGroupRef={featureGroupRef} onPolygonDrawn={onPolygonDrawn} />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <FeatureGroup ref={featureGroupRef as any}>
          <EditControl
            position="topright"
            onCreated={handleCreated}
            onEdited={handleEdited}
            onDeleted={handleDeleted}
            draw={{
              rectangle: false,
              circle: false,
              circlemarker: false,
              polyline: false,
              polygon: false,
              marker: {
                icon: new L.Icon.Default()
              }
            }}
          />
        </FeatureGroup>
      </MapContainer>
      {mounted && featureGroupRef.current && (
        // We render it outside MapContainer but it needs access to useMap? No, RtkUploaderControl uses useMap so it must be inside MapContainer
        <div className="hidden"></div>
      )}
    </div>
  );
}
