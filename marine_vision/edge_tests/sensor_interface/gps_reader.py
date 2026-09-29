import socket
import json

def parse_nmea(sentence):
    parts = sentence.split(',')
    if parts[0] == '$GPGGA':
        try:
            # Lat: 1300.9000 -> 13 deg 00.9000 min
            lat_str = parts[2]
            lat_dir = parts[3]
            lon_str = parts[4]
            lon_dir = parts[5]
            
            lat_deg = float(lat_str[:2])
            lat_min = float(lat_str[2:])
            lat = lat_deg + (lat_min / 60.0)
            if lat_dir == 'S': lat = -lat
            
            lon_deg = float(lon_str[:3])
            lon_min = float(lon_str[3:])
            lon = lon_deg + (lon_min / 60.0)
            if lon_dir == 'W': lon = -lon
            
            return {"type": "gps", "lat": lat, "lon": lon}
        except Exception as e:
            print(f"Parse error: {e}")
    return None

def run_gps_reader(port=5000):
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(("0.0.0.0", port))
    
    print(f"Listening for NMEA GPS streams on UDP port {port}...")
    
    try:
        while True:
            data, addr = sock.recvfrom(1024)
            sentence = data.decode('ascii').strip()
            # print(f"Raw: {sentence}")
            
            # Verify Checksum
            if '*' in sentence:
                core, chksum = sentence.split('*')
                core = core[1:] # remove $
                calc = 0
                for c in core: calc ^= ord(c)
                if f"{calc:02X}" == chksum:
                    parsed = parse_nmea(sentence)
                    if parsed:
                        print(f"Hardware Emulation Output: {json.dumps(parsed)}")
                else:
                    print("Invalid checksum")
    except KeyboardInterrupt:
        print("Reader stopped.")

if __name__ == "__main__":
    run_gps_reader()
