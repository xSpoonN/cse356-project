'use client';

import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerIcon from 'leaflet/dist/images/marker-icon.png';
import MarkerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import MarkerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: MarkerIcon2x.src,
  iconUrl: MarkerIcon.src,
  shadowUrl: MarkerShadow.src,
});

export default function Map() {
  const [map, setMap] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyInBox, setOnlyInBox] = useState(true); // Not used yet
  const [searchResults, setSearchResults] = useState([]);
  const markerLayerRef = useRef(null);
  const [bbox, setBbox] = useState({
    minLat: null,
    maxLat: null,
    minLong: null,
    maxLong: null,
  });

  useEffect(() => {
    const newMap = L.map('map').setView([42, -74], 7);
    L.tileLayer('http://localhost:3000/tiles/l{z}/{x}/{y}.png', {
      maxZoom: 25,
      minZoom: 4,
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      id: 'base',
    }).addTo(newMap);
    markerLayerRef.current = L.featureGroup().addTo(newMap);

    const updateBbox = () => {
      const bounds = newMap.getBounds();
      const southWest = bounds.getSouthWest();
      const northEast = bounds.getNorthEast();

      setBbox({
        minLat: southWest.lat,
        maxLat: northEast.lat,
        minLon: southWest.lng,
        maxLon: northEast.lng,
      });
    };

    updateBbox();

    newMap.on('dragend', () => {
      updateBbox();
    });
    setMap(newMap);

    return () => newMap.remove();
  }, []);

  const search = async () => {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bbox, onlyInBox, searchTerm }),
    });
    const data = await res.json();
    setSearchResults(Object.values(data));
  };

  useEffect(() => {
    if (onlyInBox) {
      markerLayerRef.current.clearLayers();
      searchResults.forEach(result => {
        L.marker([result.coordinates.lat, result.coordinates.lon])
          .addTo(markerLayerRef.current)
          .bindPopup(result.name);
      });
    } else {
      if (searchResults.length === 1) {
        // map.setView([searchResults[0].coordinates.lat, searchResults[0].coordinates.lon], 10);
      }
    }
  }, [searchResults]);

  return (
    <div>
      <div
        className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-md flex flex-col"
        style={{ zIndex: 9999 }}
      >
        {/* Search Results */}
        <div className="max-h-144 overflow-y-auto">
          {searchTerm &&
            (searchResults.length
              ? searchResults.map((result, index) => (
                  <div key={index} className="p-2 bg-gray-100 rounded-md mb-2">
                    {result.name}
                  </div>
                ))
              : 'No results')}
        </div>
        {/* Search Input */}
        <input
          type="text"
          value={searchTerm}
          placeholder="Search"
          className="mt-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={e => setSearchTerm(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') search();
          }}
        />

        <div className="flex justify-between items-center mt-2">
          <label htmlFor="onlyInBox">Only in Box</label>
          <input
            type="checkbox"
            name="onlyInBox"
            id="onlyInBox"
            className="transform scale-125 mr-2"
            onChange={e => setOnlyInBox(e.target.checked)}
          />
        </div>
      </div>

      <div id="map" style={{ height: '100vh', width: '100%' }} />
    </div>
  );
}
