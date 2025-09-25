from flask import Flask, request, jsonify
from PIL import Image
import pytesseract
import re
import os

app = Flask(__name__)

# Point to your Tesseract installation (Windows)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Route to process uploaded image
@app.route('/process', methods=['POST'])
def process_image():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    temp_path = "temp.jpg"
    file.save(temp_path)

    try:
        img = Image.open(temp_path)
        width, height = img.size
        bottom_crop = img.crop((0, int(height * 0.8), width, height))

        # OCR to extract text
        text = pytesseract.image_to_string(bottom_crop)

        # Extract coordinates
        coords = re.findall(r'(-?\d+\.\d+)', text)
        latitude, longitude = None, None
        if len(coords) >= 2:
            latitude = float(coords[0])
            longitude = float(coords[1])

        # Extract timestamp
        timestamp = None
        timestamp_match = re.search(r'(\d{2}/\d{2}/\d{4} \d{2}:\d{2} (?:AM|PM))', text)
        if timestamp_match:
            timestamp = timestamp_match.group(1)

        result = {
            "latitude": latitude,
            "longitude": longitude,
            "timestamp": timestamp
        }

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    return jsonify(result)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
