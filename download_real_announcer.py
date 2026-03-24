import urllib.request
import urllib.error
import ssl
import os

urls = [
    # Source 1: Radio BG (Verified working official announcer voice)
    "https://radio-bg.kubg.edu.ua/wp-content/uploads/2022/03/%D0%A5%D0%B2%D0%B8%D0%BB%D0%B8%D0%BD%D0%B0-%D0%BC%D0%BE%D0%B2%D1%87%D0%B0%D0%BD%D0%BD%D1%8F.mp3",
    # Source 2: Ukr.radio (Legacy/Redirect)
    "https://ukr.radio/images/audio/khvylyna_movchannya_suspilne.mp3",
    # Source 3: Radio BG (Alternative)
    "https://radiobg.kubg.edu.ua/images/audio/khvylyna_movchannya.mp3",
    # Source 4: MicUA
    "https://micua.com.ua/wp-content/uploads/2024/03/khvylyna-movchannya-z-golosom.mp3"
]


output_path = "public/audio/intro.mp3"

# Ignore SSL certificate errors just in case
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req_headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

success = False

for url in urls:
    print(f"Trying to download from: {url}")
    try:
        req = urllib.request.Request(url, headers=req_headers)
        with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
            if response.status == 200:
                data = response.read()
                # Ensure the folder exists
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                with open(output_path, "wb") as f:
                    f.write(data)
                print(f"Success! Voice downloaded from {url} ({len(data)} bytes).")
                success = True
                break
    except Exception as e:
        print(f"Failed to download from {url}. Error: {e}")

if not success:
    print("\n[!] ALL AUTOMATIC DOWNLOADS FAILED due to DNS or network blocks.")
    print("Please download the file manually in your browser (it bypasses OS DNS blocks):")
    print("Link: https://ukr.radio/images/audio/khvylyna_movchannya_suspilne.mp3")
    print("Save it as: public/audio/intro.mp3")
