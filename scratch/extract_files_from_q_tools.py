import json
import os

path = "/Users/cheixibra/.aws/amazonq/history/chat-history-f50e91dc7e10690c28c79f6098e8c69b.json"

with open(path, "r", encoding="utf-8", errors="ignore") as f:
    data = json.load(f)

col = [c for c in data.get("collections", []) if c.get("name") == "tabs"][0]
doc = col.get("data", [])[0]
conv = doc.get("conversations", [])[2]
messages = conv.get("messages", [])

print(f"Total messages to check: {len(messages)}")

restored_count = 0

for i, msg in enumerate(messages):
    tu = msg.get("toolUses", [])
    for j, use in enumerate(tu):
        name = use.get("name")
        if name == "fsWrite":
            inp = use.get("input", {})
            target_path = inp.get("path", "")
            file_text = inp.get("fileText", "")
            
            if target_path and file_text:
                # Translate path
                local_path = target_path.replace("pharmacy_delivery_web", "baye_defal_yalla_web")
                
                # Create parent directory if needed
                parent = os.path.dirname(local_path)
                if parent:
                    os.makedirs(parent, exist_ok=True)
                    
                # Write file
                with open(local_path, "w", encoding="utf-8") as out:
                    out.write(file_text)
                    
                print(f"Restored file from Msg {i}: {local_path} (size: {len(file_text)} chars)")
                restored_count += 1

print(f"\nRestored {restored_count} files successfully from Amazon Q tool uses!")
