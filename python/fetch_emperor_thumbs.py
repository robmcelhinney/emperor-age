#!/usr/bin/env python3
import json
import os
import time
import urllib.parse
import urllib.request
import urllib.error
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parents[1] / "src" / "data" / "emperors.json"
OUT_DIR = Path(__file__).resolve().parents[1] / "public" / "emperors" / "thumbs"
MAP_PATH = Path(__file__).resolve().parents[1] / "src" / "data" / "emperor_images.json"
REPORT_PATH = Path(__file__).resolve().parents[1] / "python" / "emperor_images_report.json"

OUT_DIR.mkdir(parents=True, exist_ok=True)

EXT_BY_TYPE = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/svg+xml": "svg",
}
REQUEST_DELAY = 0.6
MAX_RETRIES = 3
ALIASES = {
    "Consantius II": "Constantius II",
    "Philip I": "Philip the Arab",
    "Julian": "Julian (emperor)",
}


def load_json(path, default):
    if path.exists():
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    return default


def fetch_json(url):
    req = urllib.request.Request(
        url, headers={"User-Agent": "roman-emperors/1.0 (tooling)"}
    )
    for attempt in range(MAX_RETRIES):
        try:
            with urllib.request.urlopen(req) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt < MAX_RETRIES - 1:
                time.sleep((attempt + 1) * 3)
                continue
            raise


def wikidata_search(name):
    q = urllib.parse.quote(name + " Roman emperor")
    url = (
        "https://www.wikidata.org/w/api.php?action=wbsearchentities"
        f"&search={q}&language=en&format=json&limit=5"
    )
    return fetch_json(url).get("search", [])


def wikidata_search_fallback(name):
    q = urllib.parse.quote(name)
    url = (
        "https://www.wikidata.org/w/api.php?action=wbsearchentities"
        f"&search={q}&language=en&format=json&limit=5"
    )
    return fetch_json(url).get("search", [])


def pick_best_qid(results):
    for item in results:
        desc = (item.get("description") or "").lower()
        if "roman emperor" in desc:
            return item.get("id")
    for item in results:
        desc = (item.get("description") or "").lower()
        if "emperor" in desc and "roman" in desc:
            return item.get("id")
    return results[0].get("id") if results else None


def wikidata_qid_from_enwiki(title):
    q = urllib.parse.quote(title)
    url = (
        "https://www.wikidata.org/w/api.php?action=wbgetentities"
        f"&sites=enwiki&titles={q}&format=json"
    )
    data = fetch_json(url)
    entities = data.get("entities", {})
    for key, value in entities.items():
        if key != "-1" and isinstance(value, dict):
            return key
    return None


def get_p18_filename(qid):
    url = (
        "https://www.wikidata.org/w/api.php?action=wbgetclaims"
        f"&entity={qid}&property=P18&format=json"
    )
    data = fetch_json(url)
    claims = data.get("claims", {}).get("P18")
    if not claims:
        return None
    mainsnak = claims[0].get("mainsnak", {})
    datavalue = mainsnak.get("datavalue", {})
    value = datavalue.get("value")
    if not value:
        return None
    return value.replace(" ", "_")


def slugify(name):
    out = []
    for ch in name.lower():
        if ch.isalnum():
            out.append(ch)
        else:
            out.append("_")
    slug = "".join(out).strip("_")
    while "__" in slug:
        slug = slug.replace("__", "_")
    return slug or "unknown"


def download_thumbnail(filename, slug):
    encoded = urllib.parse.quote(filename)
    url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{encoded}?width=64"
    req = urllib.request.Request(url, headers={"User-Agent": "roman-emperors/1.0"})
    for attempt in range(MAX_RETRIES):
        try:
            with urllib.request.urlopen(req) as resp:
                content_type = resp.headers.get("Content-Type", "").split(";")[0].strip()
                ext = EXT_BY_TYPE.get(content_type)
                if not ext:
                    final_url = resp.geturl()
                    path = urllib.parse.urlparse(final_url).path
                    ext = os.path.splitext(path)[1].lstrip(".").lower() or "jpg"
                filename_out = f"{slug}.{ext}"
                out_path = OUT_DIR / filename_out
                out_path.write_bytes(resp.read())
                return filename_out
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt < MAX_RETRIES - 1:
                time.sleep((attempt + 1) * 3)
                continue
            raise


def main():
    data = load_json(DATA_PATH, [])
    names = sorted({d.get("name") for d in data if d.get("name")})

    existing_map = load_json(MAP_PATH, {})
    mapping = dict(existing_map)
    report = {"missing": [], "errors": []}

    used_slugs = {os.path.splitext(os.path.basename(v))[0] for v in mapping.values()}

    for name in names:
        if name in mapping:
            continue

        try:
            lookup_name = ALIASES.get(name, name)
            results = wikidata_search(lookup_name)
            qid = pick_best_qid(results)
            if not qid:
                results = wikidata_search_fallback(lookup_name)
                qid = pick_best_qid(results)
            if not qid:
                qid = wikidata_qid_from_enwiki(lookup_name)
            if not qid:
                qid = wikidata_qid_from_enwiki(lookup_name + " (Roman emperor)")
            if not qid:
                report["missing"].append({"name": name, "reason": "no qid"})
                continue

            filename = get_p18_filename(qid)
            if not filename and results:
                for alt in results[1:]:
                    alt_qid = alt.get("id")
                    if not alt_qid:
                        continue
                    filename = get_p18_filename(alt_qid)
                    if filename:
                        break
            if not filename:
                alt_qid = wikidata_qid_from_enwiki(lookup_name + " (Roman emperor)")
                if alt_qid:
                    filename = get_p18_filename(alt_qid)
            if not filename:
                report["missing"].append({"name": name, "reason": "no P18"})
                continue

            slug = slugify(name)
            if slug in used_slugs:
                slug = f"{slug}_{qid.lower()}"
            local_name = download_thumbnail(filename, slug)
            used_slugs.add(os.path.splitext(local_name)[0])
            mapping[name] = f"/emperors/thumbs/{local_name}"
        except Exception as exc:
            report["errors"].append({"name": name, "error": str(exc)})
        MAP_PATH.write_text(
            json.dumps(mapping, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        REPORT_PATH.write_text(
            json.dumps(report, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        time.sleep(REQUEST_DELAY)


if __name__ == "__main__":
    main()
