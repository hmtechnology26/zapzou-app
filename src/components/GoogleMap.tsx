'use client';

import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { useState, useEffect, useRef } from 'react';
import { Icon } from '@/components/Icon';

interface MapComponentProps {
  center: { lat: number; lng: number };
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
  markers?: Array<{
    position: { lat: number; lng: number };
    title?: string;
  }>;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: -23.5505,
  lng: -46.6333,
};

export function MapComponent({ center, onLocationUpdate, markers = [] }: MapComponentProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ['marker'],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState(center || defaultCenter);

  const mainMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const extraMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  useEffect(() => {
    if (center) {
      setMapCenter(center);
    }
  }, [center]);

  const onLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  };

  const onUnmount = () => {
    if (mainMarkerRef.current) {
      mainMarkerRef.current.map = null;
      mainMarkerRef.current = null;
    }

    extraMarkersRef.current.forEach((marker) => {
      marker.map = null;
    });
    extraMarkersRef.current = [];

    setMap(null);
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (onLocationUpdate && e.latLng) {
      const newCenter = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      onLocationUpdate(newCenter);
    }
  };

  useEffect(() => {
    if (!isLoaded || !map || !google.maps?.marker) return;

    if (mainMarkerRef.current) {
      mainMarkerRef.current.map = null;
    }

    mainMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: mapCenter,
      title: 'Localização selecionada',
    });

    return () => {
      if (mainMarkerRef.current) {
        mainMarkerRef.current.map = null;
      }
    };
  }, [isLoaded, map, mapCenter]);

  useEffect(() => {
    if (!isLoaded || !map || !google.maps?.marker) return;

    extraMarkersRef.current.forEach((marker) => {
      marker.map = null;
    });
    extraMarkersRef.current = [];

    extraMarkersRef.current = markers.map(
      (marker) =>
        new google.maps.marker.AdvancedMarkerElement({
          map,
          position: marker.position,
          title: marker.title,
        })
    );

    return () => {
      extraMarkersRef.current.forEach((marker) => {
        marker.map = null;
      });
      extraMarkersRef.current = [];
    };
  }, [isLoaded, map, markers]);

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-surface-container-high">
        <div className="text-center">
          <Icon icon="error_outline" size={32} className="text-error mx-auto mb-2" />
          <p className="text-sm text-on-surface-variant">Erro ao carregar mapa</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-surface-container-high">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={mapCenter}
      zoom={15}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={handleMapClick}
      options={{
        mapId: 'DEMO_MAP_ID',
        disableDefaultUI: false,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      }}
    />
  );
}

export default function GoogleMapComponent() {
  return null;
}