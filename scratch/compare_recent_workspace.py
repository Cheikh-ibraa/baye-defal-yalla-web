import os
import json
import glob
import datetime
import shutil

history_dir = os.path.expanduser("~/Library/Application Support/Code/User/History")
workspace_dir = "/Users/cheixibra/Downloads/Innov/baye_defal_yalla_web"

# Find all entries.json files
entries_files = glob.glob(os.path.join(history_dir, "**/entries.json"), recursive=True)

history_by_target = {}

# Match both patterns
search_patterns = ["pharmacy_delivery_web", "baye_defal_yalla_web"]

for path in entries_files:
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            resource = data.get("resource", "")
            if not resource:
                continue
                
            if any(p in resource for p in search_patterns):
                # Translate to local path in baye_defal_yalla_web
                local_path = resource.replace("file://", "")
                local_path = local_path.replace("pharmacy_delivery_web", "baye_defal_yalla_web")
                
                entries = data.get("entries", [])
                if not entries:
                    continue
                    
                # Find the latest entry for this resource
                latest = max(entries, key=lambda x: x.get("timestamp", 0))
                folder = os.path.dirname(path)
                backup_file = os.path.join(folder, latest["id"])
                
                # Check if this target is already in our map, and if this one is newer
                ts = latest.get("timestamp", 0)
                if local_path not in history_by_target or ts > history_by_target[local_path]["timestamp"]:
                    history_by_target[local_path] = {
                        "backup_path": backup_file,
                        "timestamp": ts,
                        "datetime": datetime.datetime.fromtimestamp(ts / 1000.0).isoformat(),
                        "original_resource": resource
                    }
    except Exception:
        pass

print(f"Total unique project files found in VS Code history: {len(history_by_target)}")

# Compare each file and print status
results = []
for local_path, info in history_by_target.items():
    backup_path = info["backup_path"]
    
    # Check if backup file exists
    if not os.path.exists(backup_path):
        continue
        
    status = ""
    if os.path.exists(local_path):
        # Compare contents
        with open(backup_path, 'rb') as f1, open(local_path, 'rb') as f2:
            if f1.read() == f2.read():
                status = "IDENTICAL"
            else:
                status = "DIFFERENT"
    else:
        status = "MISSING"
        
    results.append({
        "local_path": local_path,
        "backup_path": backup_path,
        "status": status,
        "datetime": info["datetime"],
        "timestamp": info["timestamp"],
        "original_resource": info["original_resource"]
    })

# Print breakdown
different = [r for r in results if r["status"] == "DIFFERENT"]
missing = [r for r in results if r["status"] == "MISSING"]
identical = [r for r in results if r["status"] == "IDENTICAL"]

print(f"\nBreakdown:")
print(f"  - DIFFERENT: {len(different)}")
print(f"  - MISSING: {len(missing)}")
print(f"  - IDENTICAL: {len(identical)}")

# Print different files sorted by time
print("\n--- DIFFERENT FILES (VS Code History is different from workspace) ---")
different.sort(key=lambda x: x["timestamp"], reverse=True)
for r in different:
    print(f"[{r['datetime']}] {r['local_path']}")
    
print("\n--- MISSING FILES (In VS Code History but not in workspace) ---")
missing.sort(key=lambda x: x["timestamp"], reverse=True)
for r in missing:
    print(f"[{r['datetime']}] {r['local_path']}")
