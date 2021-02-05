#!/usr/bin/python3
import json
from dateutil.relativedelta import relativedelta
from dateutil import parser

def main():
    with open("emperors.json", "r") as f:
        data = json.load(f)
    # print("data: ", data)

    new_json = []

    for obj in data:
        # print("obj: ", obj)

        new_obj = {
            'index': obj['fields']['index'],
            'name': obj['fields']['name'],
            'cause': obj['fields']['cause']
        }

        if ('reign_start' not in obj['fields'] or 'reign_end' not in obj['fields']):
            print("no reign_start or end. name: ", obj['fields']['name'])
            continue

        reign_end = parser.parse(obj['fields']['reign_end'])
        reign_start = parser.parse(obj['fields']['reign_start'])


        death = parser.parse(obj['fields']['death'])
        reign_length = relativedelta(reign_end, reign_start).years
        end_reign_to_death = relativedelta(death, reign_end).years
        end_reign_to_death_months = relativedelta(death, reign_end).months

        if ('birth' in obj['fields']):
            birth = parser.parse(obj['fields']['birth'])
            age_at_end_reign = relativedelta(reign_end, birth).years
            age_at_reign = relativedelta(reign_start, birth).years
            new_obj['Pre Emperor'] = abs(age_at_reign)
        else:
            print("no birth date for name: ", obj['fields']['name'])
        
        if reign_length == 0:
            reign_length = 1
        new_obj['Emperor'] = abs(reign_length)
        if end_reign_to_death == 0 and end_reign_to_death_months != 0:
            end_reign_to_death = 1
        new_obj['Post Emperor'] = abs(end_reign_to_death)

        new_json.append(new_obj)

        # print("new_obj: ", new_obj)

    with open('../src/data/emperors.json', 'w') as f:
        json.dump(new_json, f)

main()
