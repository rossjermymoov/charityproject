"use client";

import { GoogleMap } from "./google-map";

interface SingleLocationMapProps {
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  height?: string;
}

export function SingleLocationMap({
  name,
  address,
  latitude,
  longitude,
  height = "250px",
}: SingleLocationMapProps) {
  const markers = [
    {
      id: "location",
      lat: latitude,
      lng: longitude,
      title: name,
      info: address || undefined,
    },
  ];

  return (
    <GoogleMap
      markers={markers}
      center={{ lat: latitude, lng: longitude }}
      zoom={15}
      height={height}
    />
  );
}
