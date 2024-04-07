'use client';

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function Sidebar({ map, bbox }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyInBox, setOnlyInBox] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [routeResults, setRouteResults] = useState([]); // [ {description: '', coordinates: {lat: 0, lon: 0}} ]
  const [source, setSource] = useState({ name: '', lat: 0, lon: 0 });
  const [dest, setDest] = useState({ name: '', lat: 0, lon: 0 });
  const [mode, setMode] = useState('search'); // search or route
  const [selecting, setSelecting] = useState('dst'); // Selecting src or dst

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [register, setRegister] = useState(false); // Register or login
  const [loggedIn, setLoggedIn] = useState(false); // @todo: Temporary, need to check cookies.
  const markerLayerRef = useRef(null);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/api/user`,
          { method: 'POST' }
        );
        const data = await res.json();
        if (res.ok && data.loggedin) setLoggedIn(true);
      } catch (error) {
        console.error(error);
      }
    };
    checkLogin();
  }, []);

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

  useEffect(() => {
    if (!map || !routeResults) return;
    markerLayerRef.current.clearLayers();
    routeResults.forEach(result => {
      L.marker([result.coordinates.lat, result.coordinates.lon])
        .addTo(markerLayerRef.current)
        .bindPopup(result.description);

      // Debugging /turn api
      console.log(
        `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/turn/lat,lon/lat,lon`
      );
    });
    const stepNumbers = routeResults.map(entry => {
      return { ...entry, order: entry.description.split(' ')[1] };
    });
    const sortedSteps = stepNumbers.sort((a, b) => a.order - b.order);
    const routeLineCoords = [
      [source.lat, source.lon],
      ...sortedSteps.map(result => {
        return [result.coordinates.lat, result.coordinates.lon];
      }),
      [dest.lat, dest.lon],
    ];
    console.log(routeLineCoords);
    L.polyline(routeLineCoords, { color: 'blue' }).addTo(
      markerLayerRef.current
    );

    L.marker([source.lat, source.lon], {
      icon: L.icon({ iconUrl: '/icon-red.png', iconSize: [25, 38] }),
    }).addTo(markerLayerRef.current);

    L.marker([dest.lat, dest.lon], {
      icon: L.icon({ iconUrl: '/icon-red.png', iconSize: [25, 38] }),
    }).addTo(markerLayerRef.current);

    const boundingBox = [
      {
        lat: Math.min(source.lat, dest.lat),
        lon: Math.min(source.lon, dest.lon),
      },
      {
        lat: Math.max(source.lat, dest.lat),
        lon: Math.max(source.lon, dest.lon),
      },
    ];

    map.fitBounds(
      [
        [boundingBox[0].lat, boundingBox[0].lon], // Southwest corner
        [boundingBox[1].lat, boundingBox[1].lon], // Northeast corner
      ],
      {
        animate: true,
        duration: 2,
        easeLinearity: 0.5,
        padding: [50, 50], // Padding in pixels (y, x)
      }
    );
  }, [routeResults]);

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
    try {
      const [turns, full] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/api/route`, {
          method: 'POST',
          body: JSON.stringify({
            source: {
              lat: source.lat,
              lon: source.lon,
            },
            destination: {
              lat: dest.lat,
              lon: dest.lon,
            },
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }).then(res => res.json()),
        fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/api/route/full`,
          {
            method: 'POST',
            body: JSON.stringify({
              source: {
                lat: source.lat,
                lon: source.lon,
              },
              destination: {
                lat: dest.lat,
                lon: dest.lon,
              },
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          }
        ).then(res => res.json()),
      ]);
      console.log('route data: ', { turns, full });

      setRouteResults(full);
      setSearchResults([]);
    } catch (error) {
      console.error(error);
    }
  };

  const loginAccount = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/api/login`,
        {
          method: 'POST',
          body: JSON.stringify({
            username,
            password,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) throw Error('Failed to login');
      setLoggedIn(true);
    } catch (error) {
      console.error(error);
    }
  };

  const registerAccount = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/api/adduser`,
        {
          method: 'POST',
          body: JSON.stringify({
            username,
            password,
            email,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) throw Error('Failed to register');
      setRegister(false);
    } catch (error) {
      console.error(error);
    }
  };

  const logoutAccount = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_ENDPOINT}/api/logout`, {
      method: 'POST',
    });
    setLoggedIn(false);
  };

  return (
    <div
      className="basis-4/12 bottom-4 right-4 bg-white p-4 rounded-lg shadow-md flex flex-col"
      style={{ zIndex: 9999 }}
    >
      {mode === 'route' && (
        <button
          className="text-sm ml-auto"
          onClick={() => {
            setMode('search');
            setSource({ name: '', lat: 0, lon: 0 });
            setDest({ name: '', lat: 0, lon: 0 });
          }}
        >
          &#x26CC;
        </button>
      )}
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={mode === 'search' ? searchTerm : source.name}
          placeholder="Search"
          className="w-full mt-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={e => {
            if (mode === 'route')
              setSource(prev => ({ ...prev, name: e.target.value }));
            setSearchTerm(e.target.value);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') search();
          }}
          onClick={() => mode === 'route' && setSelecting('src')}
        />
        {mode === 'search' ? (
          <input
            type="checkbox"
            name="onlyInBox"
            id="onlyInBox"
            className="absolute top-5 right-2 transform scale-125 mr-2"
            onChange={e => setOnlyInBox(e.target.checked)}
          />
        ) : (
          <>
            <input
              type="text"
              value={dest.name}
              placeholder="Search"
              className="w-full mt-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={e => {
                setSearchTerm(e.target.value);
                setDest(prev => ({ ...prev, name: e.target.value }));
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') search();
              }}
              onClick={() => mode === 'route' && setSelecting('dst')}
            />
            <button
              className="my-4 w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
              onClick={route}
            >
              {' '}
              Route{' '}
            </button>
          </>
        )}
      </div>
      {/* Search Results */}
      <div className="max-h-144 overflow-y-auto">
        {searchTerm &&
          (searchResults.length
            ? searchResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center mr-auto p-2 bg-gray-100 rounded-md mb-2 cursor-pointer hover:bg-gray-200 gap-2"
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
                    if (selecting === 'src') {
                      setSource({
                        name: result.name,
                        lat: result.coordinates.lat,
                        lon: result.coordinates.lon,
                      });
                    } else {
                      setDest({
                        name: result.name,
                        lat: result.coordinates.lat,
                        lon: result.coordinates.lon,
                      });
                    }

                    if (mode === 'route') {
                      setSearchTerm('');
                      setSearchResults([]);
                    }
                  }}
                >
                  {result.name}
                  {loggedIn && mode === 'search' && (
                    <button
                      className="p-2 h-1/2 border text-sm border-blue-500 rounded z-20 hover:bg-white"
                      onClick={() => {
                        setMode('route');
                        setSearchTerm('');
                        setSearchResults([]);
                      }}
                    >
                      Directions
                    </button>
                  )}
                </div>
              ))
            : 'No results')}
      </div>
      <br />
      <br />
      {loggedIn && (
        <button
          className="mt-2 bg-red-500 text-white p-2 rounded-md hover:bg-red-600 mt-auto"
          onClick={logoutAccount}
        >
          {' '}
          Logout{' '}
        </button>
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
