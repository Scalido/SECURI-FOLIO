'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import * as L from 'leaflet';
import * as turf from '@turf/turf';
import { LocateFixed, Loader2 } from 'lucide-react';

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
      <MapContainer 
        center={[-4.32758, 15.31357]} // Kinshasa by default
        zoom={14} 
        maxZoom={24}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxNativeZoom={19}
          maxZoom={24}
        />
        <LocateControl />
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
              marker: false,
              polyline: false,
              polygon: {
                allowIntersection: false,
                drawError: {
                  color: '#e1e100',
                  message: '<strong>Erreur:</strong> Les arêtes ne peuvent pas se croiser!'
                },
                shapeOptions: {
                  color: '#10b981',
                  fillOpacity: 0.5
                }
              }
            }}
          />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
}
