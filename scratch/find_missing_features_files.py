import os
import json
import glob

history_dir = os.path.expanduser("~/Library/Application Support/Code/User/History")
entries_files = glob.glob(os.path.join(history_dir, "**/entries.json"), recursive=True)

workspace_dir = "/Users/cheixibra/Downloads/Innov/baye_defal_yalla_web"

history_files = set()

for path in entries_files:
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            resource = data.get("resource", "")
            if resource and "pharmacy_delivery_web/src/app/features/" in resource:
                # Translate path
                local_path = resource.replace("file://", "").replace("pharmacy_delivery_web", "baye_defal_yalla_web")
                history_files.add((resource, local_path))
    except:
        pass

print(f"Total files in features history: {len(history_files)}")

missing_files = []
for orig, local in sorted(history_files):
    if not os.path.exists(local):
        missing_files.append((orig, local))

print(f"\nMissing files in workspace ({len(missing_files)}):")
for orig, local in missing_files:
    print(f" - {local} (from {orig})")
