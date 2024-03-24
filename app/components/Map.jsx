'use client';

import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function Map() {
  useEffect(() => {
    const map = L.map('map').setView([42, -74], 7);
    L.tileLayer('http://localhost:8080/tile/{z}/{x}/{y}.png', {
      maxZoom: 25,
      minZoom: 4,
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      id: 'base',
    }).addTo(map);

    return () => map.remove();
  }, []);

  return <div id="map" style={{ height: '100vh', width: '100%' }} />;
}
