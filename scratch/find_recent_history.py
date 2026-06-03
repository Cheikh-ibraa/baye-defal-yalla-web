import os
import json
import glob
import datetime

history_dir = os.path.expanduser("~/Library/Application Support/Code/User/History")
entries_files = glob.glob(os.path.join(history_dir, "**/entries.json"), recursive=True)

recent_entries = []

# Target date: 2026-05-28
target_timestamp = datetime.datetime(2026, 5, 28).timestamp() * 1000

for path in entries_files:
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            resource = data.get("resource", "")
            if not resource:
                continue
                
            entries = data.get("entries", [])
            for ent in entries:
                ts = ent.get("timestamp", 0)
                if ts >= target_timestamp:
                    dt = datetime.datetime.fromtimestamp(ts / 1000.0)
                    recent_entries.append({
                        "resource": resource,
                        "timestamp": ts,
                        "datetime": dt.isoformat(),
                        "id": ent.get("id", ""),
                        "folder": os.path.dirname(path)
                    })
    except Exception:
        pass

print(f"Total recent entries found: {len(recent_entries)}")

# Sort by timestamp descending
recent_entries.sort(key=lambda x: x["timestamp"], reverse=True)

# Print unique resource paths and their latest modification dates
seen_resources = set()
count = 0
for entry in recent_entries:
    res = entry["resource"]
    if res not in seen_resources:
        seen_resources.add(res)
        print(f"[{entry['datetime']}] ID: {entry['id']} | Resource: {res}")
        count += 1
        if count >= 100:
            break
