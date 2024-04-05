'use client';

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function Sidebar({ map, bbox }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyInBox, setOnlyInBox] = useState(false); // Not used yet
  const [searchResults, setSearchResults] = useState([]);
  const markerLayerRef = useRef(null);

  useEffect(() => {
    if (map) markerLayerRef.current = L.featureGroup().addTo(map);
  }, [map]);

  useEffect(() => {
    if (!map) return;
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

  function calcFlyDuration(lat, lon) {
    return Math.min(
      2,
      (map.getCenter().distanceTo([lat, lon]) / 1000000) * 3 +
        1 +
        Math.abs(map.getZoom() - 15) * 0.5
    );
  }

  const search = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/api/search`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bbox, onlyInBox, searchTerm }),
      }
    );
    const data = await res.json();
    console.log('data: ', data);
    setSearchResults(Object.values(data));
  };

  return (
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
  );
}
