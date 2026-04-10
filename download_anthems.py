import urllib.request
import urllib.error
import ssl
import os

# Updated URLs with working mirrors
anthems = {
    "anthem_instrumental.mp3": "https://web.archive.org/web/20201011162509/https://www.navyband.navy.mil/music/anthems/ukraine.mp3",
    "anthem_choral.mp3": "https://zvukipro.com/index.php?do=download&id=3814",
    "anthem_rock.mp3": "https://ukr-portal.com/uploads/files/gim_rok-versia.mp3"
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

print("--- Starting Anthem Downloads (Final Retry) ---")

for filename, url in anthems.items():
    output_path = os.path.join(output_dir, filename)
    print(f"Downloading {filename} from {url}...")
    try:
        req = urllib.request.Request(url, headers=req_headers)
        with urllib.request.urlopen(req, context=ctx, timeout=60) as response:
            if response.status == 200:
                data = response.read()
                if len(data) < 10000:
                    print(f"WARNING: File {filename} seems too small ({len(data)} bytes). Might be a dead link.")
                with open(output_path, "wb") as f:
                    f.write(data)
                print(f"SUCCESS: {filename} saved ({len(data)} bytes).")
            else:
                print(f"FAILED: {filename} (Status: {response.status})")
    except Exception as e:
        print(f"ERROR downloading {filename}: {e}")

print("--- Finished ---")
