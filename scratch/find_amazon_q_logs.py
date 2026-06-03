import os
import json
import datetime

# We will scan these root directories for any files modified in the last 24 hours
scan_dirs = [
    os.path.expanduser("~/.vscode"),
    os.path.expanduser("~/.aws"),
    os.path.expanduser("~/Library/Application Support/Code"),
    os.path.expanduser("~/Library/Application Support/Amazon Q"),
    os.path.expanduser("~/Library/Logs"),
]

# Add macOS temp folders
import tempfile
scan_dirs.append(tempfile.gettempdir())

# Also scan parent of temp dir as macOS temp is often in a subfolder of /var/folders/...
temp_parent = os.path.dirname(tempfile.gettempdir())
if temp_parent and temp_parent != "/":
    scan_dirs.append(temp_parent)

keywords = ["portail", "chirurgie", "paiement", "paiements", "hospital"]
target_timestamp = datetime.datetime.now().timestamp() - 24 * 3600  # last 24 hours

results = []

print("Scanning directories for recent keyword-matching files...")

for base_dir in scan_dirs:
    if not os.path.exists(base_dir):
        continue
    print(f"Scanning {base_dir}...")
    for root, dirs, files in os.walk(base_dir):
        # Prevent searching node_modules or massive irrelevant caches if they occur
        if "node_modules" in root or ".git" in root or "Cache" in root or "Code Cache" in root:
            continue
            
        for file in files:
            file_path = os.path.join(root, file)
            try:
                # Check modification time
                mtime = os.path.getmtime(file_path)
                if mtime >= target_timestamp:
                    # Check filename
                    name_match = any(kw in file.lower() for kw in keywords)
                    
                    # Also check content of small text files
                    content_match = False
                    size = os.path.getsize(file_path)
                    if size < 500000: # only read files < 500KB
                        if file.endswith((".txt", ".json", ".log", ".ts", ".html", ".js", ".md", ".yml", ".xml")):
                            try:
                                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                                    content = f.read()
                                    if any(kw in content.lower() for kw in keywords):
                                        content_match = True
                            except:
                                pass
                                
                    if name_match or content_match:
                        dt = datetime.datetime.fromtimestamp(mtime).isoformat()
                        results.append({
                            "path": file_path,
                            "mtime": mtime,
                            "datetime": dt,
                            "size": size,
                            "reason": f"name_match={name_match}, content_match={content_match}"
                        })
            except Exception:
                pass

print(f"\nFound {len(results)} matching files:")
results.sort(key=lambda x: x["mtime"], reverse=True)
for r in results[:40]:
    print(f"[{r['datetime']}] Size: {r['size']} bytes | Reason: {r['reason']}")
    print(f"  Path: {r['path']}")
