'use client';

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function Sidebar({ map, bbox }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyInBox, setOnlyInBox] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [source, setSource] = useState('');
  const [dest, setDest] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [register, setRegister] = useState(false); // Register or login
  const [loggedIn, setLoggedIn] = useState(false); // @todo: Temporary, need to check cookies.
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

  const route = async () => {
    // Maybe convert location to coordinates? Need to clarify requirements
    // Or do it like google maps where the box gives a list of search results
    // Fetch route from backend
    // Update map to reflect route
  };

  const loginAccount = async () => {
    // Login logic from backend
    setLoggedIn(true);
  };

  const registerAccount = async () => {
    // Register logic from backend
    setLoggedIn(true);
  };

  const logoutAccount = async () => {
    // Logout logic from backend
    setLoggedIn(false);
  };

  return (
    <div
      className="basis-1/4 bottom-4 right-4 bg-white p-4 rounded-lg shadow-md flex flex-col"
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
      <br />
      <br />
      {loggedIn && (
        <>
          <input
            type="text"
            value={source}
            placeholder="Source"
            className="mt-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={e => setSource(e.target.value)}
          />
          <input
            type="text"
            value={dest}
            placeholder="Destination"
            className="mt-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={e => setDest(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') route();
            }}
          />
          <button
            className="mt-2 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
            onClick={route}
          >
            {' '}
            Route{' '}
          </button>
          <button
            className="mt-2 bg-red-500 text-white p-2 rounded-md hover:bg-red-600 mt-auto"
            onClick={logoutAccount}
          >
            {' '}
            Logout{' '}
          </button>
        </>
      )}
      {!loggedIn && (
        <>
          <input
            type="text"
            value={username}
            placeholder="Username"
            className="mt-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={e => setUsername(e.target.value)}
          />
          {register && (
            <input
              type="email"
              value={email}
              placeholder="Email"
              className="mt-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={e => setEmail(e.target.value)}
            />
          )}
          <input
            type="password"
            value={password}
            placeholder="Password"
            className="mt-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={e => setPassword(e.target.value)}
          />
          <button
            className="mt-2 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
            onClick={() => {
              if (register) registerAccount();
              else loginAccount();
            }}
          >
            {' '}
            {register ? 'Register' : 'Login'}{' '}
          </button>
          <div className="text-center mt-2">
            {register ? (
              <span>
                <button
                  className="text-blue-500 underline"
                  onClick={() => setRegister(false)}
                >
                  Login to an existing account
                </button>
              </span>
            ) : (
              <span>
                <button
                  className="text-blue-500 underline"
                  onClick={() => setRegister(true)}
                >
                  Create Account
                </button>
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
