import os
import requests
import math
import time

def deg2num(lat_deg, lon_deg, zoom):
    lat_rad = math.radians(lat_deg)
    n = 2.0 ** zoom
    xtile = int((lon_deg + 180.0) / 360.0 * n)
    ytile = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    return (xtile, ytile)

def download_tiles(min_lat, max_lat, min_lon, max_lon, min_z, max_z, output_dir):
    print(f"Downloading tiles to {output_dir}")
    os.makedirs(output_dir, exist_ok=True)
    
    # Use standard OSM to avoid CartoDB API key requirement
    base_url = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    
    total_tiles = 0
    downloaded = 0
    
    # Pre-calculate total
    for z in range(min_z, max_z + 1):
        x_min, y_max = deg2num(min_lat, min_lon, z)
        x_max, y_min = deg2num(max_lat, max_lon, z)
        total_tiles += (x_max - x_min + 1) * (y_max - y_min + 1)
        
    print(f"Total tiles to download: {total_tiles}")
    
    for z in range(min_z, max_z + 1):
        x_min, y_max = deg2num(min_lat, min_lon, z)
        x_max, y_min = deg2num(max_lat, max_lon, z)
        
        for x in range(x_min, x_max + 1):
            for y in range(y_min, y_max + 1):
                url = base_url.format(z=z, x=x, y=y)
                tile_dir = os.path.join(output_dir, str(z), str(x))
                os.makedirs(tile_dir, exist_ok=True)
                
                filepath = os.path.join(tile_dir, f"{y}.png")
                
                if not os.path.exists(filepath):
                    headers = {"User-Agent": "MarineVisionAI/1.0"}
                    try:
                        response = requests.get(url, headers=headers, timeout=5)
                        if response.status_code == 200:
                            with open(filepath, 'wb') as f:
                                f.write(response.content)
                            downloaded += 1
                        else:
                            print(f"Failed {url}: {response.status_code}")
                    except Exception as e:
                        print(f"Error {url}: {e}")
                    time.sleep(0.1) # Be nice to the server
                else:
                    downloaded += 1
                    
                if downloaded % 10 == 0:
                    print(f"Progress: {downloaded}/{total_tiles}")
                    
    print("Tile download complete.")

if __name__ == "__main__":
    # Pure Ocean bounding box (Bay of Bengal, East of Chennai)
    # Center: 12.5000, 80.5000
    MIN_LAT = 12.4500
    MAX_LAT = 12.5500
    MIN_LON = 80.4500
    MAX_LON = 80.5500
    
    # Store directly in frontend public directory so Vite can serve it
    OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/public/tiles"))
    
    download_tiles(MIN_LAT, MAX_LAT, MIN_LON, MAX_LON, 14, 16, OUT_DIR)
