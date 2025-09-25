from PIL import Image
import pytesseract
import re

# Point to your Tesseract installation (Windows fix)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Path to image
image_path = r"C:\Users\Lanovo\OneDrive\Desktop\SIH_ML\WhatsApp Image 2025-09-25 at 17.41.59_63557988.jpg"
img = Image.open(image_path)

# Get image dimensions
width, height = img.size

# Crop bottom 20% of the image (where GPS info is usually present)
bottom_crop = img.crop((0, int(height * 0.8), width, height))

# OCR to extract text
text = pytesseract.image_to_string(bottom_crop)

# Extract coordinates (latitude, longitude)
coords = re.findall(r'(-?\d+\.\d+)', text)
latitude, longitude = None, None
if len(coords) >= 2:
    latitude = float(coords[0])
    longitude = float(coords[1])

# Extract timestamp (format: DD/MM/YYYY HH:MM AM/PM)
timestamp = None
timestamp_match = re.search(r'(\d{2}/\d{2}/\d{4} \d{2}:\d{2} (?:AM|PM))', text)
if timestamp_match:
    timestamp = timestamp_match.group(1)

# Final output
print(f"Latitude: {latitude}")
print(f"Longitude: {longitude}")
print(f"Timestamp: {timestamp}")
