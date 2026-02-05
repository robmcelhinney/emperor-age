#!/usr/bin/env python3
import json
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "public" / "world-110m.geojson"
URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

req = urllib.request.Request(URL, headers={"User-Agent": "roman-emperors/1.0 (tooling)"})
with urllib.request.urlopen(req) as resp:
    topo = json.loads(resp.read().decode("utf-8"))

# Minimal topojson -> geojson conversion without extra deps
# The world-atlas topo has one object named 'countries'
obj = topo["objects"]["countries"]

# We'll reuse a tiny converter for arcs; for simplicity, use mapshaper-style decode
transform = topo.get("transform")
scale = transform["scale"]
translate = transform["translate"]

arcs = topo["arcs"]

# Decode arcs into absolute coordinates
abs_arcs = []
for arc in arcs:
    x = y = 0
    coords = []
    for dx, dy in arc:
        x += dx
        y += dy
        coords.append([x * scale[0] + translate[0], y * scale[1] + translate[1]])
    abs_arcs.append(coords)


def extract_geometry(geom):
    gtype = geom["type"]
    if gtype == "Polygon":
        return {
            "type": "Polygon",
            "coordinates": [arc_coords(arc) for arc in geom["arcs"]],
        }
    if gtype == "MultiPolygon":
        return {
            "type": "MultiPolygon",
            "coordinates": [
                [arc_coords(arc) for arc in poly] for poly in geom["arcs"]
            ],
        }
    raise ValueError("Unsupported geometry type: " + gtype)


def arc_coords(arc_indices):
    coords = []
    for idx in arc_indices:
        if idx < 0:
            arc = list(reversed(abs_arcs[~idx]))
        else:
            arc = abs_arcs[idx]
        if coords:
            coords.extend(arc[1:])
        else:
            coords.extend(arc)
    return coords

features = []
for geom in obj["geometries"]:
    features.append({
        "type": "Feature",
        "properties": {},
        "geometry": extract_geometry(geom),
    })

geojson = {"type": "FeatureCollection", "features": features}
OUT.write_text(json.dumps(geojson))
print("wrote", OUT)
