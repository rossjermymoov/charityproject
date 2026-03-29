"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  label?: string;
  info?: string;
  href?: string;
}

interface GoogleMapProps {
  markers: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  className?: string;
}

// Loads the Google Maps script once globally
let mapsLoaded = false;
let mapsLoading = false;
const loadCallbacks: (() => void)[] = [];

function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    if (mapsLoaded) {
      resolve();
      return;
    }

    loadCallbacks.push(resolve);

    if (mapsLoading) return;
    mapsLoading = true;

    (window as any).initGoogleMaps = () => {
      mapsLoaded = true;
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
}

export function GoogleMap({
  markers,
  center,
  zoom,
  height = "400px",
  className = "",
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const initMap = useCallback(() => {
    const g = (window as any).google;
    if (!mapRef.current || !g) return;

    const defaultCenter = center || { lat: 52.5, lng: -1.5 };
    const defaultZoom = zoom || (markers.length === 1 ? 15 : 6);

    const map = new g.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    });

    mapInstanceRef.current = map;
    infoWindowRef.current = new g.maps.InfoWindow();

    // Clear old markers
    markersRef.current.forEach((m: any) => m.setMap(null));
    markersRef.current = [];

    const typeColors: Record<string, string> = {
      SHOP: "#3B82F6",
      PUB: "#F59E0B",
      RESTAURANT: "#F97316",
      OFFICE: "#6B7280",
      SCHOOL: "#22C55E",
      CHURCH: "#A855F7",
      OTHER: "#6B7280",
    };

    const bounds = new g.maps.LatLngBounds();

    markers.forEach((m) => {
      const marker = new g.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map,
        title: m.title,
        icon: m.label
          ? {
              path: g.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: typeColors[m.label] || "#6B7280",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            }
          : undefined,
      });

      bounds.extend(marker.getPosition());

      if (m.info || m.href) {
        marker.addListener("click", () => {
          const content = m.href
            ? `<div style="padding:4px"><strong><a href="${m.href}" style="color:#2563EB;text-decoration:none">${m.title}</a></strong>${m.info ? `<br/><span style="color:#6B7280;font-size:12px">${m.info}</span>` : ""}</div>`
            : `<div style="padding:4px"><strong>${m.title}</strong>${m.info ? `<br/><span style="color:#6B7280;font-size:12px">${m.info}</span>` : ""}</div>`;
          infoWindowRef.current?.setContent(content);
          infoWindowRef.current?.open(map, marker);
        });
      }

      markersRef.current.push(marker);
    });

    if (markers.length > 1) {
      map.fitBounds(bounds);
      const listener = g.maps.event.addListener(map, "idle", () => {
        const z = map.getZoom();
        if (z !== undefined && z > 16) map.setZoom(16);
        g.maps.event.removeListener(listener);
      });
    } else if (markers.length === 1) {
      map.setCenter({ lat: markers[0].lat, lng: markers[0].lng });
      map.setZoom(15);
    }
  }, [markers, center, zoom]);

  useEffect(() => {
    if (!apiKey) {
      setError("Google Maps API key not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment.");
      setLoading(false);
      return;
    }

    loadGoogleMaps(apiKey)
      .then(() => {
        setLoading(false);
        initMap();
      })
      .catch(() => {
        setError("Failed to load Google Maps");
        setLoading(false);
      });
  }, [apiKey, initMap]);

  useEffect(() => {
    if (mapInstanceRef.current && !loading) {
      initMap();
    }
  }, [markers, loading, initMap]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 ${className}`}
        style={{ height }}
      >
        <div className="text-center px-4">
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden border border-gray-200 ${className}`} style={{ height }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
