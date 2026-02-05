#!/usr/bin/env python3
import csv
import io
import json
import os
import zipfile
from collections import defaultdict
from pathlib import Path
import urllib.request

DATA_CSV = Path(__file__).resolve().parents[1] / "python" / "emperors.csv"
OUT_JSON = Path(__file__).resolve().parents[1] / "src" / "data" / "birthplace_coords.json"
REPORT_JSON = Path(__file__).resolve().parents[1] / "python" / "birthplace_coords_report.json"
CACHE_DIR = Path(__file__).resolve().parents[1] / "python" / "geonames_cache"
CITIES_ZIP = CACHE_DIR / "cities5000.zip"
CITIES_TXT = CACHE_DIR / "cities5000.txt"

GEONAMES_URL = "https://download.geonames.org/export/dump/cities5000.zip"

CACHE_DIR.mkdir(parents=True, exist_ok=True)

OVERRIDES = {
    "Antitum": {"lat": 41.450367, "lng": 12.624779},
    "Terentinum": {"lat": 41.785000, "lng": 14.550600},
    "Falacrine": {"lat": 42.61825, "lng": 13.15968},
    "Italica": {"lat": 37.443901, "lng": -6.046795},
    "Lanuvium": {"lat": 41.6745, "lng": 12.6972},
    "Leptis Magna": {"lat": 32.636674, "lng": 14.291252},
    "Arca Caesarea": {"lat": 36.045833, "lng": 34.530556},
    "Budalia": {"lat": 44.966447, "lng": 19.610106},
    "Interamna Nahars": {"lat": 42.561442, "lng": 12.646998},
    "Dardania": {"lat": 42.0166, "lng": 21.392067},
    "Romuliana": {"lat": 43.899167, "lng": 22.185},
    "Felix Romuliana": {"lat": 43.899167, "lng": 22.185},
    "Naissus": {"lat": 43.316295, "lng": 21.893884},
    "Cauca": {"lat": 41.21767, "lng": -4.52145},
}

def download_geonames():
    if CITIES_TXT.exists():
        return
    if not CITIES_ZIP.exists():
        req = urllib.request.Request(
            GEONAMES_URL,
            headers={"User-Agent": "emperor-age/1.0 (tooling)"},
        )
        with urllib.request.urlopen(req) as resp:
            CITIES_ZIP.write_bytes(resp.read())
    with zipfile.ZipFile(CITIES_ZIP, "r") as zf:
        with zf.open("cities5000.txt") as src, CITIES_TXT.open("wb") as dst:
            dst.write(src.read())


def norm(name: str) -> str:
    return "".join(ch.lower() for ch in name.strip())


def load_geonames_index():
    index = defaultdict(list)
    with CITIES_TXT.open("r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            parts = line.rstrip("\n").split("\t")
            if len(parts) < 15:
                continue
            (
                geonameid,
                name,
                asciiname,
                alternatenames,
                latitude,
                longitude,
                feature_class,
                feature_code,
                country_code,
                cc2,
                admin1,
                admin2,
                admin3,
                admin4,
                population,
                *_rest,
            ) = parts + [""] * (19 - len(parts))
            try:
                pop = int(population) if population else 0
            except ValueError:
                pop = 0
            entry = {
                "name": name,
                "asciiname": asciiname,
                "alternatenames": alternatenames.split(",") if alternatenames else [],
                "lat": float(latitude),
                "lng": float(longitude),
                "pop": pop,
                "feature_class": feature_class,
            }
            for key in {name, asciiname} | set(entry["alternatenames"]):
                if not key:
                    continue
                index[norm(key)].append(entry)
    return index


def best_match(entries):
    if not entries:
        return None
    # Prefer populated places with highest population
    entries = sorted(
        entries,
        key=lambda e: (
            0 if e["feature_class"] == "P" else 1,
            -e["pop"],
        ),
    )
    return entries[0]


def main():
    download_geonames()
    index = load_geonames_index()

    mapping = {}
    missing = []

    with DATA_CSV.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get("name")
            city = row.get("birth.cty")
            if not name or not city:
                continue
            if city in OVERRIDES:
                mapping[name] = {
                    "city": city,
                    "lat": OVERRIDES[city]["lat"],
                    "lng": OVERRIDES[city]["lng"],
                }
                continue
            key = norm(city)
            entry = best_match(index.get(key))
            if not entry:
                missing.append({"name": name, "city": city})
                continue
            mapping[name] = {
                "city": city,
                "lat": entry["lat"],
                "lng": entry["lng"],
            }

    OUT_JSON.write_text(
        json.dumps(mapping, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    REPORT_JSON.write_text(
        json.dumps({"missing": missing}, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
