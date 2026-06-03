import json
import os

path = "/Users/cheixibra/.aws/amazonq/history/chat-history-f50e91dc7e10690c28c79f6098e8c69b.json"

with open(path, "r", encoding="utf-8", errors="ignore") as f:
    data = json.load(f)

col = [c for c in data.get("collections", []) if c.get("name") == "tabs"][0]
doc = col.get("data", [])[0]
conv = doc.get("conversations", [])[2]
messages = conv.get("messages", [])

print("Scanning for fsReplace operations...")
replaces = []

for i, msg in enumerate(messages):
    tu = msg.get("toolUses", [])
    for j, use in enumerate(tu):
        name = use.get("name")
        if name == "fsReplace":
            inp = use.get("input", {})
            file_path = inp.get("path", "")
            explanation = inp.get("explanation", "")
            diffs = inp.get("diffs", [])
            
            replaces.append({
                "msg_idx": i,
                "path": file_path,
                "explanation": explanation,
                "diffs_count": len(diffs),
                "diffs": diffs
            })

print(f"Found {len(replaces)} fsReplace operations.\n")
for idx, rep in enumerate(replaces):
    print(f"[{idx+1}] Msg {rep['msg_idx']} | File: {rep['path']}")
    print(f"    Explanation: {rep['explanation']}")
    print(f"    Diffs count: {rep['diffs_count']}")
    for d_idx, d in enumerate(rep['diffs']):
        print(f"      Diff {d_idx+1}:")
        print(f"        Original: {d.get('original', '')[:100]}...")
        print(f"        New:      {d.get('new', '')[:100]}...")
    print("-" * 50)
