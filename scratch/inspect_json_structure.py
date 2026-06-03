import json
import os

path = "/Users/cheixibra/.aws/amazonq/history/chat-history-f50e91dc7e10690c28c79f6098e8c69b.json"

with open(path, "r", encoding="utf-8", errors="ignore") as f:
    data = json.load(f)

def get_sizes(obj, current_path=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            sub_path = f"{current_path}.{k}" if current_path else k
            s_val = len(json.dumps(v))
            if s_val > 100000:  # Only print items larger than 100KB
                print(f"Path: {sub_path} | Serialized Size: {s_val} bytes")
                get_sizes(v, sub_path)
    elif isinstance(obj, list):
        for idx, item in enumerate(obj):
            sub_path = f"{current_path}[{idx}]"
            s_val = len(json.dumps(item))
            if s_val > 100000:
                print(f"Path: {sub_path} | Serialized Size: {s_val} bytes")
                get_sizes(item, sub_path)

get_sizes(data)
