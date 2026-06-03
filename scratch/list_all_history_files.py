import os
import json
import glob
import datetime

history_dir = os.path.expanduser("~/Library/Application Support/Code/User/History")
entries_files = glob.glob(os.path.join(history_dir, "**/entries.json"), recursive=True)

workspace_dir = "/Users/cheixibra/Downloads/Innov/baye_defal_yalla_web"

history_map = {}
keywords = ["portail", "chirurgie", "paiement", "paiements", "hospital"]

for path in entries_files:
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            resource = data.get("resource", "")
            if not resource:
                continue
                
            if any(kw in resource.lower() for kw in keywords):
                # We translate the path to our workspace target
                local_path = resource.replace("file://", "")
                local_path = local_path.replace("pharmacy_delivery_web", "baye_defal_yalla_web")
                
                entries = data.get("entries", [])
                if not entries:
                    continue
                    
                latest = max(entries, key=lambda x: x.get("timestamp", 0))
                ts = latest.get("timestamp", 0)
                
                if local_path not in history_map or ts > history_map[local_path]["timestamp"]:
                    folder = os.path.dirname(path)
                    history_map[local_path] = {
                        "original_resource": resource,
                        "backup_path": os.path.join(folder, latest["id"]),
                        "timestamp": ts,
                        "datetime": datetime.datetime.fromtimestamp(ts / 1000.0).isoformat()
                    }
    except Exception:
        pass

print(f"Total relevant unique files in history: {len(history_map)}")
print("\nChecking presence of these files in workspace:")
for local_path, info in sorted(history_map.items(), key=lambda x: x[1]["timestamp"], reverse=True):
    exists = os.path.exists(local_path)
    status = "EXISTS" if exists else "MISSING"
    print(f"[{info['datetime']}] {status} | {local_path} (from {info['original_resource']})")
