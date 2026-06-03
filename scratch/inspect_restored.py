import json
import os
import datetime

# Load recovered list
with open('/Users/cheixibra/.gemini/antigravity-ide/brain/850eefdc-0a41-4675-9732-0774c64a0364/scratch/recovered_list.json', 'r') as f:
    recovered = json.load(f)

# Group entries by resource
resource_entries = {}
for item in recovered:
    res = item["resource"]
    if res not in resource_entries:
        resource_entries[res] = []
    # Add all entries listed in the item (recover.py saved them in "all_entries")
    # Actually let's check what fields are in the recovered_list.json items
    resource_entries[res].append(item)

print(f"Total unique resources in recovered_list: {len(resource_entries)}")

# Let's inspect some specific directories: portail, chirurgie, paiements
keywords = ["portail", "chirurgie", "paiements", "paiement"]
for kw in keywords:
    print(f"\n--- History for keyword: '{kw}' ---")
    matched = []
    for res, items in resource_entries.items():
        if kw in res.lower():
            # Find the absolute latest entry in history
            for item in items:
                # Let's see all entries inside this item
                all_ents = item.get("all_entries", [])
                for ent in all_ents:
                    ts = ent.get("timestamp", 0)
                    dt = datetime.datetime.fromtimestamp(ts / 1000.0).isoformat()
                    matched.append({
                        "resource": res,
                        "timestamp": ts,
                        "datetime": dt,
                        "id": ent.get("id", ""),
                        "folder": item.get("backup_path", "") # parent folder
                    })
    
    # Sort matched by timestamp descending
    matched.sort(key=lambda x: x["timestamp"], reverse=True)
    for m in matched[:10]:
        print(f"[{m['datetime']}] ID: {m['id']} | Resource: {m['resource']}")
