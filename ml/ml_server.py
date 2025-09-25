from flask import Flask, request, jsonify
from PIL import Image
import pytesseract
import re
import os
from langdetect import detect
from transformers import MBartForConditionalGeneration, MBart50TokenizerFast

app = Flask(__name__)

# -------------------------------
# Tesseract OCR
# -------------------------------
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# -------------------------------
# NLP Extraction Pipeline
# -------------------------------
model_name = "facebook/mbart-large-50-many-to-many-mmt"
tokenizer = MBart50TokenizerFast.from_pretrained(model_name)
model = MBartForConditionalGeneration.from_pretrained(model_name)
LANG_MAP = {"hi": "hi_IN", "ta": "ta_IN", "mr": "mr_IN", "kn": "kn_IN", "en": "en_XX"}

UNIT_MAP = {
    "g": 1, "gram": 1, "grams": 1, "gm": 1,
    "kg": 1000, "kgs": 1000, "kilogram": 1000, "kilograms": 1000,
    "mg": 0.001, "milligram": 0.001, "milligrams": 0.001,
    "lb": 453.592, "lbs": 453.592, "pound": 453.592, "pounds": 453.592,
    "oz": 28.3495, "ounce": 28.3495, "ounces": 28.3495,
    "quintal": 100000, "quintals": 100000,
    "ton": 1000000, "tonne": 1000000, "tons": 1000000
}

NUMBER_RE = r"(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)"
UNIT_RE = r"(kg|kgs|kilogram|kilograms|g|gram|grams|gm|mg|milligram|milligrams|lb|lbs|pound|pounds|oz|ounce|ounces|quintal|quintals|ton|tonne|tons)\b"
NUM_UNIT_PATTERN = re.compile(rf"{NUMBER_RE}\s*(?:-?\s*)?{UNIT_RE}", flags=re.I)
QTY_NEAR_KEYWORD = re.compile(r"(?:quantity|qty|amount|we need|need)\s*[:\-]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)\s*(\w+)?", flags=re.I)
HERB_ID_PATTERN = re.compile(r"\bH([A-Z]+)(\d{2})(\d{2})\b", flags=re.I)

# -------------------------------
# Helper functions
# -------------------------------
def translate_to_english(text):
    try:
        detected = detect(text)
    except:
        detected = "en"
    if detected == "en":
        return text
    src = LANG_MAP.get(detected, "hi_IN")
    tokenizer.src_lang = src
    encoded = tokenizer(text, return_tensors="pt")
    out = model.generate(**encoded, forced_bos_token_id=tokenizer.lang_code_to_id["en_XX"])
    return tokenizer.decode(out[0], skip_special_tokens=True)

def extract_quantity_grams(text_en: str):
    t = text_en.replace(",", "").lower()
    m = NUM_UNIT_PATTERN.search(t)
    if m:
        try:
            return round(float(m.group(1)) * UNIT_MAP[m.group(2).lower()], 6)
        except:
            return None
    m2 = QTY_NEAR_KEYWORD.search(t)
    if m2:
        try:
            value = float(m2.group(1))
        except:
            return None
        maybe_unit = (m2.group(2) or "").lower()
        return round(value * UNIT_MAP.get(maybe_unit, 1), 6)
    return None

def extract_farmer_id(text_en: str):
    m = re.search(r"\bF\d{6}[A-Z0-9]{3}\b", text_en, flags=re.I)
    return m.group(0).upper() if m else None

def extract_herb_info(text_en: str):
    m = HERB_ID_PATTERN.search(text_en)
    if m:
        herb_name = m.group(1).capitalize()
        herb_id = m.group(0).upper()
        return {"herb_name": herb_name, "herb_id": herb_id}
    return None

def extract_info(raw_text: str):
    try:
        text_en = translate_to_english(raw_text)
    except:
        text_en = raw_text
    t_en = text_en.lower()
    farmer_id = extract_farmer_id(t_en)
    quantity_grams = extract_quantity_grams(t_en)
    herb_info = extract_herb_info(text_en)
    return {
        "farmer_id": farmer_id,
        "herb_id": herb_info["herb_id"] if herb_info else None,
        "herb_name": herb_info["herb_name"] if herb_info else None,
        "quantity_grams": quantity_grams,
        "text_en": text_en
    }

def extract_lat_lon_timestamp(text: str):
    lat, lon, timestamp = None, None, None
    coords = re.findall(r'(-?\d+\.\d+)', text)
    if len(coords) >= 2:
        lat = float(coords[0])
        lon = float(coords[1])
    timestamp_match = re.search(r'(\d{2}/\d{2}/\d{4} \d{2}:\d{2} (?:AM|PM))', text)
    if timestamp_match:
        timestamp = timestamp_match.group(1)
    return {"latitude": lat, "longitude": lon, "timestamp": timestamp}

# -------------------------------
# Routes
# -------------------------------

# 1️⃣ OCR only (latitude, longitude, timestamp)
@app.route('/ocr', methods=['POST'])
def ocr_only():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files['file']
    temp_path = "temp.jpg"
    file.save(temp_path)
    try:
        img = Image.open(temp_path)
        text = pytesseract.image_to_string(img)
        result = extract_lat_lon_timestamp(text)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

# 2️⃣ NLP only: accept JSON or form-data
@app.route('/nlp', methods=['POST'])
def nlp_only():
    text = None
    if request.is_json:
        data = request.get_json()
        text = data.get("text") if data else None
    else:
        text = request.form.get("text")
    if not text:
        return jsonify({"error": "No text provided"}), 400
    try:
        nlp_result = extract_info(text)
        return jsonify(nlp_result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 3️⃣ Full pipeline: OCR + NLP
@app.route('/process', methods=['POST'])
def process_image():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files['file']
    temp_path = "temp.jpg"
    file.save(temp_path)
    try:
        img = Image.open(temp_path)
        text = pytesseract.image_to_string(img)
        nlp_result = extract_info(text)
        lat_lon_time = extract_lat_lon_timestamp(text)
        result = {
            "farmer_id": nlp_result["farmer_id"],
            "herb_id": nlp_result["herb_id"],
            "herb_name": nlp_result["herb_name"],
            "quantity_grams": nlp_result["quantity_grams"],
            "latitude": lat_lon_time["latitude"],
            "longitude": lat_lon_time["longitude"],
            "timestamp": lat_lon_time["timestamp"]
        }
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
