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
  const [onlyInBox, setOnlyInBox] = useState(false); // Not used yet
  const [searchResults, setSearchResults] = useState([]);
  const markerLayerRef = useRef(null);
  const [bbox, setBbox] = useState({
    minLat: null,
    maxLat: null,
    minLong: null,
    maxLong: null,
  });

  useEffect(() => {
    const newMap = L.map('map', { attributionControl: false }).setView(
      [42, -74],
      7
    );
    L.tileLayer('http://localhost:3000/tiles/l{z}/{x}/{y}.png', {
      maxZoom: 25,
      minZoom: 4,
      id: 'base',
    }).addTo(newMap);
    markerLayerRef.current = L.featureGroup().addTo(newMap);

    updateBbox(newMap);

    newMap.on('dragend', () => {
      updateBbox(newMap);
    });
    newMap.on('moveend', () => {
      updateBbox(newMap);
    });

    setMap(newMap);

    return () => newMap.remove();
  }, []);

  function updateBbox(map) {
    const bounds = map.getBounds();
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();

    setBbox({
      minLat: southWest.lat,
      maxLat: northEast.lat,
      minLon: southWest.lng,
      maxLon: northEast.lng,
    });
  }

  function calcFlyDuration(lat, lon) {
    return Math.min(
      2,
      (map.getCenter().distanceTo([lat, lon]) / 1000000) * 3 +
        1 +
        Math.abs(map.getZoom() - 15) * 0.5
    );
  }

  const search = async () => {
    const res = await fetch('http://localhost:3000/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bbox, onlyInBox, searchTerm }),
    });
    const data = await res.json();
    console.log('data: ', data);
    setSearchResults(Object.values(data));
  };

  useEffect(() => {
    markerLayerRef.current.clearLayers();
    if (onlyInBox) {
      searchResults.forEach(result => {
        L.marker([result.coordinates.lat, result.coordinates.lon])
          .addTo(markerLayerRef.current)
          .bindPopup(result.name);
      });
      return;
    }
    if (searchResults.length === 1) {
      map.flyTo(
        [searchResults[0].coordinates.lat, searchResults[0].coordinates.lon],
        15,
        {
          duration: calcFlyDuration(
            searchResults[0].coordinates.lat,
            searchResults[0].coordinates.lon
          ),
          easeLinearity: 0.5,
          animate: true,
        }
      );
    }
  }, [searchResults]);

  return (
    <div className="flex w-full">
      <div
        className="basis-1/3 bottom-4 right-4 bg-white p-4 rounded-lg shadow-md flex flex-col"
        style={{ zIndex: 9999 }}
      >
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
        {/* Search Results */}
        <div className="max-h-144 overflow-y-auto">
          {searchTerm &&
            (searchResults.length
              ? searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-2 bg-gray-100 rounded-md mb-2 cursor-pointer hover:bg-gray-200"
                    onClick={() => {
                      map.flyTo(
                        [result.coordinates.lat, result.coordinates.lon],
                        15,
                        {
                          duration: calcFlyDuration(
                            result.coordinates.lat,
                            result.coordinates.lon
                          ),
                          easeLinearity: 0.5,
                          animate: true,
                        }
                      );
                    }}
                  >
                    {result.name}
                  </div>
                ))
              : 'No results')}
        </div>
      </div>

      <div id="map" className="basis-2/3" style={{ height: '100vh' }} />
    </div>
  );
}
