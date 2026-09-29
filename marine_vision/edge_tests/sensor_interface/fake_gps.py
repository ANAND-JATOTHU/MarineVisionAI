import socket
import time
import math

def generate_nmea_checksum(sentence):
    calc_cksum = 0
    for char in sentence:
        calc_cksum ^= ord(char)
    return f"{calc_cksum:02X}"

def dec2nmea(deg):
    d = int(deg)
    m = (deg - d) * 60.0
    return f"{d:02d}{m:07.4f}"

def run_fake_gps(target_ip="127.0.0.1", port=5000):
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    print(f"Broadcasting Fake NMEA GPS data to {target_ip}:{port}...")

    # Start near Chennai coast (matches our downloaded offline tiles)
    lat = 13.0150
    lon = 80.2350
    
    # Lawnmower search pattern parameters
    speed = 0.0001 # degrees per tick
    direction = 1 # 1 for East, -1 for West
    
    try:
        while True:
            # Move AUV
            lon += speed * direction
            if lon > 80.2600:
                direction = -1
                lat += 0.0005 # Move North one lane
            elif lon < 80.2300:
                direction = 1
                lat += 0.0005
                
            # Create NMEA GPGGA sentence
            lat_str = dec2nmea(lat)
            lon_str = dec2nmea(lon)
            
            # Format: $GPGGA,hhmmss.ss,llll.ll,a,yyyyy.yy,a,x,xx,x.x,x.x,M,x.x,M,x.x,xxxx*hh
            # UTC Time
            t = time.strftime("%H%M%S", time.gmtime())
            
            core_sentence = f"GPGGA,{t}.00,{lat_str},N,{lon_str},E,1,08,1.0,0.0,M,0.0,M,,"
            checksum = generate_nmea_checksum(core_sentence)
            nmea_sentence = f"${core_sentence}*{checksum}\r\n"
            
            # Send via UDP
            sock.sendto(nmea_sentence.encode('ascii'), (target_ip, port))
            print(f"Sent: {nmea_sentence.strip()}")
            
            time.sleep(1.0) # 1 Hz update rate
    except KeyboardInterrupt:
        print("Fake GPS Stopped.")
    finally:
        sock.close()

if __name__ == "__main__":
    run_fake_gps()
