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

        new_obj = {}

        if ('birth' not in obj['fields'] or 'death' not in  obj['fields']):
            print("no birth or death. name: ", obj['fields']['name'])
            continue


        birth = parser.parse(obj['fields']['birth'])
        death = parser.parse(obj['fields']['death'])
        
        difference_in_years = relativedelta(death, birth).years
        # print("difference_in_years: ", difference_in_years)

        new_obj['index'] = obj['fields']['index']
        new_obj['name'] = obj['fields']['name']


        if ('reign_start' not in obj['fields'] or 'reign_end' not in obj['fields']):
            print("no reign_start or end. name: ", obj['fields']['name'])
            continue

        reign_end = parser.parse(obj['fields']['reign_end'])
        reign_start = parser.parse(obj['fields']['reign_start'])

        age_at_end_reign = relativedelta(reign_end, birth).years
        age_at_reign = relativedelta(reign_start, birth).years
        reign_length = relativedelta(reign_end, reign_start).years
        end_reign_to_death = relativedelta(death, reign_end).years
        # print("difference_in_years: ", difference_in_years)

        new_obj['before_reign'] = abs(age_at_reign)
        new_obj['during_reign'] = abs(reign_length)
        new_obj['after_reign'] = abs(end_reign_to_death)

        new_json.append(new_obj)

        # print("new_obj: ", new_obj)

    with open('emperorRedone.json', 'w') as f:
        json.dump(new_json, f)



# def get_current_dail_info():

main()
