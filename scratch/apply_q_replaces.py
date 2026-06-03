import json
import os

path = "/Users/cheixibra/.aws/amazonq/history/chat-history-f50e91dc7e10690c28c79f6098e8c69b.json"

with open(path, "r", encoding="utf-8", errors="ignore") as f:
    data = json.load(f)

col = [c for c in data.get("collections", []) if c.get("name") == "tabs"][0]
doc = col.get("data", [])[0]
conv = doc.get("conversations", [])[2]
messages = conv.get("messages", [])

print("Scanning for fsReplace operations to apply...")
replaces = []

for i, msg in enumerate(messages):
    tu = msg.get("toolUses", [])
    for j, use in enumerate(tu):
        name = use.get("name")
        if name == "fsReplace":
            inp = use.get("input", {})
            file_path = inp.get("path", "")
            diffs = inp.get("diffs", [])
            
            replaces.append({
                "msg_idx": i,
                "path": file_path,
                "diffs": diffs
            })

print(f"Found {len(replaces)} fsReplace operations. Applying them in chronological order...")

success_count = 0
fail_count = 0

for idx, rep in enumerate(replaces):
    target_path = rep["path"].replace("pharmacy_delivery_web", "baye_defal_yalla_web")
    if not os.path.exists(target_path):
        print(f"[{idx+1}] SKIP: File {target_path} does not exist on disk.")
        fail_count += 1
        continue
        
    try:
        with open(target_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        modified = content
        all_diffs_ok = True
        
        for d_idx, d in enumerate(rep["diffs"]):
            orig = d.get("oldStr", "")
            new_val = d.get("newStr", "")
            
            if orig:
                # Normalizing newlines to avoid comparison failures
                orig_norm = orig.replace("\r\n", "\n")
                modified_norm = modified.replace("\r\n", "\n")
                new_val_norm = new_val.replace("\r\n", "\n")
                
                if orig_norm in modified_norm:
                    modified_norm = modified_norm.replace(orig_norm, new_val_norm, 1)
                    modified = modified_norm
                else:
                    # Try soft match by stripping whitespace
                    orig_stripped = orig_norm.strip().replace(" ", "").replace("\n", "")
                    modified_stripped = modified_norm.strip().replace(" ", "").replace("\n", "")
                    
                    print(f"  ERROR: Could not find original text for Diff {d_idx+1} in {target_path}.")
                    print(f"    Target search text preview: {orig[:150]!r}")
                    all_diffs_ok = False
            else:
                print(f"  Warning: Empty oldStr string in Diff {d_idx+1} for {target_path}")
                
        if all_diffs_ok:
            with open(target_path, "w", encoding="utf-8") as f:
                f.write(modified)
            print(f"[{idx+1}] SUCCESS: Applied {len(rep['diffs'])} diffs to {target_path}")
            success_count += 1
        else:
            print(f"[{idx+1}] FAILED: Diffs failed for {target_path}")
            fail_count += 1
            
    except Exception as e:
        print(f"[{idx+1}] ERROR applying diffs to {target_path}: {e}")
        fail_count += 1

print(f"\nDiff application completed:")
print(f"  - Successfully applied: {success_count} file replacements")
print(f"  - Failed/Skipped: {fail_count}")
