'use client';

import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const strToObj = str => {
  const pairs = str.split(', ');
  const obj = {};
  for (let i = 0; i < pairs.length; i++) {
    let pair = pairs[i].split('"=>"');
    obj[pair[0].trim().replace(/"/g, '')] = pair[1]?.trim().replace(/"/g, '');
  }
  return obj;
};

const parseOSMPointRes = data => {
  return data.map(d => {
    const tags = strToObj(d.tags);
    const houseName = d['addr:housename'] || '';
    const houseNumber = d['addr:housenumber'] || '';
    const street = tags['addr:street'] || '';
    const city = tags['addr:city'] || '';
    const postcode = tags['addr:postcode'] || '';
    const state = tags['addr:state'] || '';
    return `${houseName ? houseName + ' ' : ''}${houseNumber} ${street}, ${city}, ${state} ${postcode}`;
  });
};

export default function Map() {
  const [map, setMap] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyInBox, setOnlyInBox] = useState(true); // Not used yet
  const [searchResults, setSearchResults] = useState([]);
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
    newMap.on('dragend', () => {
      const bounds = newMap.getBounds();
      setBbox({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLong: bounds.getWest(),
        maxLong: bounds.getEast(),
      });
    });
    setMap(newMap);

    return () => newMap.remove();
  }, []);

  const search = async () => {
    const res = await fetch('http://localhost:3000/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bbox, onlyInBox, searchTerm }),
    });
    const data = await res.json();
    console.log(data); // Parse the data and add markers to the map
    const parsedData = parseOSMPointRes(data);
    setSearchResults(parsedData);
  };

  return (
    <div>
      <div id="map" style={{ height: '100vh', width: '100%' }} />
      <div
        className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-md flex flex-col"
        style={{ zIndex: 9999 }}
      >
        {/* Search Results */}
        <div className="max-h-64 overflow-y-auto">
          {searchResults.length
            ? searchResults.map((result, index) => (
                <div key={index} className="p-2 bg-gray-100 rounded-md mb-2">
                  {result}
                </div>
              ))
            : 'No results'}
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
      </div>
    </div>
  );
}
