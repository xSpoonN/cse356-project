import random
import requests

route_server = 'http://localhost'

def warmup_cache_for_routes(route_server, locations):
    for i in range (len(locations) * 2):
        start_key, start = random.choice(list(locations.items()))
        temp = dict(filter(lambda x: x[0] != start_key, locations.items()))
        end_key, end = random.choice(list(temp.items()))
        url = f"{route_server}/route"
        payload = {
            "source": {
                "lat": start[0],
                "long": start[1]
            },
            "destination": {
                "lat": end[0],
                "long": end[1]
            }
        }
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            print(f"Warmed: {start_key} to {end_key}")
        else:
            print(f"Failed to load: {start_key} to {end_key}")

locationMap = {
    "SBU": [40.910265, -73.124097],
    "MacArthur": [40.786524, -73.097794],
    "JFK": [40.662105, -73.791171],
    "Empire State Building": [40.748324,-73.9858658],
    "Times Square": [40.7579787,-73.9881175],
    "LGA": [40.768396, -73.865309],
    "Yankee Stadium": [40.8297457,-73.9278642],
    "Adelphi University": [40.7213213,-73.6541323],
    "Port Washington": [40.844299, -73.701570],
    "Riverhead": [40.917360, -72.662288],
    "East Hampton": [40.963758, -72.185137],
    "Callahans Beach": [40.918041, -73.282472],
    "Hicksville": [40.768983, -73.524555],
    "Bohemia": [40.769211, -73.114321],
    "Glen Cove": [40.862148, -73.631744],
    "Flushing": [40.757129, -73.827067]
}


warmup_cache_for_routes(route_server, locationMap)