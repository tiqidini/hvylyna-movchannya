import requests
import os

# MicUA - Reliable source with voice and metronome
url = "https://micua.com.ua/wp-content/uploads/2024/03/khvylyna-movchannya-z-golosom.mp3"
output_path = "public/audio/intro.mp3"

try:
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    response = requests.get(url, headers=headers, timeout=60)
    if response.status_code == 200:
        with open(output_path, "wb") as f:
            f.write(response.content)
        print(f"Success: Ukr.radio broadcaster voice downloaded ({len(response.content)} bytes).")
    else:
        print(f"Error: Status code {response.status_code}")
except Exception as e:
    print(f"Error: {e}")
