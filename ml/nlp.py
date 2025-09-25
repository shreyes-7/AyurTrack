import re
import json
from langdetect import detect
from transformers import MBartForConditionalGeneration, MBart50TokenizerFast

# -------------------------------
# Load mBART (translation)
# -------------------------------
model_name = "facebook/mbart-large-50-many-to-many-mmt"
tokenizer = MBart50TokenizerFast.from_pretrained(model_name)
model = MBartForConditionalGeneration.from_pretrained(model_name)

# map langdetect codes to mBART codes
LANG_MAP = {"hi": "hi_IN", "ta": "ta_IN", "mr": "mr_IN", "kn": "kn_IN", "en": "en_XX"}

def translate_to_english(text):
    detected = detect(text)
    if detected == "en":
        return text
    src = LANG_MAP.get(detected, "hi_IN")  # default fallback
    tokenizer.src_lang = src
    encoded = tokenizer(text, return_tensors="pt")
    out = model.generate(**encoded, forced_bos_token_id=tokenizer.lang_code_to_id["en_XX"])
    return tokenizer.decode(out[0], skip_special_tokens=True)

# -------------------------------
# Unit conversions
# -------------------------------
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

# -------------------------------
# Farmer ID extraction
# -------------------------------
def extract_farmer_id(text_en: str):
    m = re.search(r"\bF\d{6}[A-Z0-9]{3}\b", text_en, flags=re.I)
    return m.group(0).upper() if m else None

# -------------------------------
# Herb ID extraction
# -------------------------------
HERB_ID_PATTERN = re.compile(r"\bH([A-Z]+)(\d{2})(\d{2})\b", flags=re.I)
def extract_herb_info(text_en: str):
    m = HERB_ID_PATTERN.search(text_en)
    if m:
        herb_name = m.group(1).capitalize()
        herb_id = m.group(0).upper()
        # lat, lon = m.group(2), m.group(3)  # optional
        return {"herb_name": herb_name, "herb_id": herb_id}
    return None

# -------------------------------
# Full extraction
# -------------------------------
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

# -------------------------------
# Example
# -------------------------------
samples = [
    "मुझे HTUMERIC2077 की 2 किलो जरूरत है, ID F266201K3X",
    "FARMER ID: F266202M9Z needs HGINGER3050 5 pounds"
]

for s in samples:
    res = extract_info(s)
    print(json.dumps(res, indent=2, ensure_ascii=False))
