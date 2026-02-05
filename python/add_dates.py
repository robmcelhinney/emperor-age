#!/usr/bin/env python3
import json
import csv

# Read dynasty mapping from CSV
emperor_data = {}
with open('emperors.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        emperor_data[row['name'].strip()] = {
            'dynasty': row['dynasty'].strip(),
            'birth': row['birth'].strip(),
            'death': row['death'].strip(),
            'reign_start': row['reign.start'].strip(),
            'reign_end': row['reign.end'].strip()
        }

# Read the existing emperors.json
with open('../src/data/emperors.json', 'r') as f:
    emperors = json.load(f)

# Add dates to each emperor
for emperor in emperors:
    name = emperor['name'].strip()
    if name in emperor_data:
        data = emperor_data[name]
        emperor['birth'] = data['birth']
        emperor['death'] = data['death']
        emperor['reign_start'] = data['reign_start']
        emperor['reign_end'] = data['reign_end']

# Write back to file
with open('../src/data/emperors.json', 'w') as f:
    json.dump(emperors, f, indent=2)

print(f"Added date information to emperors.json")
