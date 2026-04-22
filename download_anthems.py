import urllib.request
import urllib.error
import ssl
import os
import subprocess

# Гимны и время обрезки (в секундах), чтобы убрать вступительную речь
anthems = {
    "anthem_instrumental.mp3": {
        "url": "https://web.archive.org/web/20201011162509/https://www.navyband.navy.mil/music/anthems/ukraine.mp3",
    },
    "anthem_choral.mp3": {
        "url": "https://archive.org/download/NationalAnthemOfUkraine-StateAnthem-Choral/National%20Anthem%20of%20Ukraine%20-%20State%20Anthem%20-%20Choral.mp3",
    },
    "anthem_rock.mp3": {
        "url": "https://ukr-portal.com/uploads/files/gim_rok-versia.mp3",
    },
    "anthem_verovka.mp3": {
        "url": "https://veryovka.com/wp-content/uploads/2021/04/Gimn-Ukraini.mp3", # Прямая ссылка (пример)
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
                temp_path = output_path.replace(".mp3", "_temp.mp3")
                with open(temp_path, "wb") as f:
                    f.write(data)
                print(f"DOWNLOAD SUCCESS: {filename} ({len(data)} bytes).")
                
                try:
                    # Re-encode to 128kbps as per optimization requirements
                    cmd = [
                        "ffmpeg", "-y",
                        "-i", temp_path, 
                        "-acodec", "libmp3lame", "-ab", "128k", 
                        output_path
                    ]
                    subprocess.run(cmd, check=True, capture_output=True)
                    os.remove(temp_path)
                    print(f"SUCCESS: Converted {filename}")
                except Exception as e:
                    print(f"ERROR converting {filepath}: {e}")
            else:
                print(f"FAILED: {filename} (Status: {response.status})")
    except Exception as e:
        print(f"ERROR processing {filename}: {e}")

print("--- Finished ---")
