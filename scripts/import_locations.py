"""Build local geographic catalogues from GeoNames country extracts."""

import argparse
import csv
import io
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "frontend" / "public" / "data" / "locations"

DEFAULT_COUNTRIES = ["DE", "FR", "AT", "CH", "BE", "NL", "LU", "CM"]

# Geographic identities of the six existing model cities.
MODEL_CITIES = {
    "2950159": "Berlin",
    "2911298": "Hamburg",
    "2867714": "München",
    "2886242": "Köln",
    "2925533": "Frankfurt",
    "2825297": "Stuttgart",
}

# Populated places and administrative seats, excluding historical,
# abandoned places and sections of populated places.
PLACE_CODES = {
    "PPL", "PPLA", "PPLA2", "PPLA3", "PPLA4", "PPLA5", "PPLC",
}

def download(url):
    request = Request(url, headers={"User-Agent": "ImmoLens-catalogue/1.0"})
    with urlopen(request, timeout=180) as response:
        return response.read()

def save_json(path, value):
    temporary = path.with_suffix(".json.tmp")
    temporary.write_text(
        json.dumps(value, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    temporary.replace(path)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--countries", nargs="+", default=DEFAULT_COUNTRIES)
    args = parser.parse_args()
    countries = list(dict.fromkeys(code.upper() for code in args.countries))

    if any(len(code) != 2 or not code.isascii() or not code.isalpha()
           for code in countries):
        raise SystemExit("Use two-letter country codes such as DE FR CM.")

    OUTPUT.mkdir(parents=True, exist_ok=True)
    downloaded_at = datetime.now(timezone.utc).isoformat()
    manifest = []

    for country in countries:
        print(f"Downloading {country}...", flush=True)
        url = f"https://download.geonames.org/export/dump/{country}.zip"
        payload = download(url)
        cities = []

        with ZipFile(io.BytesIO(payload)) as archive:
            with archive.open(f"{country}.txt") as member:
                reader = csv.reader(
                    io.TextIOWrapper(member, encoding="utf-8"),
                    delimiter="\t",
                    quoting=csv.QUOTE_NONE,
                )
                for row in reader:
                    if len(row) < 19:
                        continue
                    if row[6] != "P" or row[7] not in PLACE_CODES:
                        continue
                    if row[8] != country:
                        continue

                    identifier = row[0]
                    model_city = (
                        MODEL_CITIES.get(identifier) if country == "DE" else None
                    )

                    cities.append({
                        "id": identifier,
                        "name": model_city or row[1],
                        "ascii": row[2],
                        "region": row[10],
                        "district": row[11],
                        "population": int(row[14] or 0),
                        "modelCity": model_city,
                    })

        if not cities:
            raise RuntimeError(f"No populated places found for {country}.")

        if country == "DE":
            imported = {city["id"] for city in cities}
            missing = set(MODEL_CITIES) - imported
            if missing:
                raise RuntimeError(f"Missing model city IDs: {sorted(missing)}")

        cities.sort(key=lambda city: (-city["population"], city["name"], city["id"]))

        save_json(OUTPUT / f"{country}.json", {
            "country": country,
            "source": url,
            "downloadedAt": downloaded_at,
            "cities": cities,
        })
        manifest.append({"code": country, "count": len(cities)})
        print(f"{country}: {len(cities)} places", flush=True)

    # Publish the country list only after all requested imports succeed.
    save_json(OUTPUT / "countries.json", manifest)

    (OUTPUT / "ATTRIBUTION.txt").write_text(
        "Geographic data: GeoNames, https://www.geonames.org/\n"
        "License: Creative Commons Attribution 4.0\n"
        "https://creativecommons.org/licenses/by/4.0/\n"
        f"Downloaded: {downloaded_at}\n"
        "Filtered to populated places and administrative seats.\n"
        "Geographic availability does not imply model coverage.\n",
        encoding="utf-8",
    )
    print("Geographic catalogues ready.")

if __name__ == "__main__":
    main()
