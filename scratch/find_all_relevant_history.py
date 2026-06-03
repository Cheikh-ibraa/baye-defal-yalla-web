import os
import json
import glob
import datetime

history_dir = os.path.expanduser("~/Library/Application Support/Code/User/History")
entries_files = glob.glob(os.path.join(history_dir, "**/entries.json"), recursive=True)

matches = []
keywords = ["portail", "chirurgie", "paiement", "paiements"]

for path in entries_files:
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            resource = data.get("resource", "")
            if not resource:
                continue
                
            if any(kw in resource.lower() for kw in keywords):
                entries = data.get("entries", [])
                for ent in entries:
                    ts = ent.get("timestamp", 0)
                    dt = datetime.datetime.fromtimestamp(ts / 1000.0)
                    matches.append({
                        "resource": resource,
                        "timestamp": ts,
                        "datetime": dt.isoformat(),
                        "id": ent.get("id", ""),
                        "folder": os.path.dirname(path)
                    })
    except Exception:
        pass

print(f"Total matching history entries: {len(matches)}")
# Sort matches by timestamp descending
matches.sort(key=lambda x: x["timestamp"], reverse=True)

seen = set()
count = 0
for m in matches:
    res = m["resource"]
    if res not in seen:
        seen.add(res)
        print(f"[{m['datetime']}] ID: {m['id']} | Folder: {m['folder']} | Resource: {res}")
        count += 1
        if count >= 60:
            break
