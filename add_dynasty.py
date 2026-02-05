#!/usr/bin/env python3
import json
import csv

# Read dynasty mapping from CSV
dynasty_map = {}
with open('python/emperors.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        dynasty_map[row['name'].strip()] = row['dynasty'].strip()

# Read the existing emperors.json
with open('src/data/emperors.json', 'r') as f:
    emperors = json.load(f)

# Add dynasty to each emperor
for emperor in emperors:
    name = emperor['name'].strip()
    if name in dynasty_map:
        emperor['dynasty'] = dynasty_map[name]
    else:
        emperor['dynasty'] = 'Unknown'

# Write back to file
with open('src/data/emperors.json', 'w') as f:
    json.dump(emperors, f, indent=4)

print(f"Added dynasty information to {len(emperors)} emperors")
