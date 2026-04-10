import urllib.request
import urllib.error
import ssl
import os
import subprocess

# Гимны и время обрезки (в секундах), чтобы убрать вступительную речь
anthems = {
    "anthem_instrumental.mp3": {
        "url": "https://web.archive.org/web/20201011162509/https://www.navyband.navy.mil/music/anthems/ukraine.mp3",
        "trim": 28.2
    },
    "anthem_choral.mp3": {
        "url": "https://archive.org/download/NationalAnthemOfUkraine-StateAnthem-Choral/National%20Anthem%20of%20Ukraine%20-%20State%20Anthem%20-%20Choral.mp3",
        "trim": 28.1
    },
    "anthem_rock.mp3": {
        "url": "https://ukr-portal.com/uploads/files/gim_rok-versia.mp3",
        "trim": 28.5
    },
    "anthem_verovka.mp3": {
        "url": "https://veryovka.com/wp-content/uploads/2021/04/Gimn-Ukraini.mp3", # Прямая ссылка (пример)
        "trim": 28.3
    }
}

output_dir = "public/audio"
os.makedirs(output_dir, exist_ok=True)

# Ignore SSL certificate errors
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req_headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def trim_audio(filepath, start_time):
    temp_path = filepath.replace(".mp3", "_temp.mp3")
    print(f"Trimming {filepath} starting from {start_time}s...")
    try:
        # Re-encode to 128kbps as per optimization requirements
        cmd = [
            "ffmpeg", "-y", "-ss", str(start_time), 
            "-i", filepath, 
            "-acodec", "libmp3lame", "-ab", "128k", 
            temp_path
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        os.replace(temp_path, filepath)
        print(f"SUCCESS: Trimmed {filepath}")
    except Exception as e:
        print(f"ERROR trimming {filepath}: {e}")

print("--- Starting Anthem Downloads & Optimization ---")

for filename, info in anthems.items():
    output_path = os.path.join(output_dir, filename)
    url = info["url"]
    
    print(f"Downloading {filename} from {url}...")
    try:
        req = urllib.request.Request(url, headers=req_headers)
        with urllib.request.urlopen(req, context=ctx, timeout=60) as response:
            if response.status == 200:
                data = response.read()
                with open(output_path, "wb") as f:
                    f.write(data)
                print(f"DOWNLOAD SUCCESS: {filename} ({len(data)} bytes).")
                
                # Apply trimming
                trim_audio(output_path, info["trim"])
            else:
                print(f"FAILED: {filename} (Status: {response.status})")
    except Exception as e:
        print(f"ERROR processing {filename}: {e}")

print("--- Finished ---")
