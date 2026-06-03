import os
import json
import datetime

brain_dir = os.path.expanduser("~/.gemini/antigravity-ide/brain")
transcripts = []

for root, dirs, files in os.walk(brain_dir):
    for file in files:
        if file == "transcript.jsonl":
            transcripts.append(os.path.join(root, file))

print(f"Total transcripts found: {len(transcripts)}")

keywords = ["portail", "chirurgie", "paiement", "paiements", "hospital"]
extracted_files = []

for trans_path in transcripts:
    # Path is like .../brain/conv-id/.system_generated/logs/transcript.jsonl
    parts = trans_path.split("/")
    conv_id = "unknown"
    if len(parts) >= 4:
        conv_id = parts[-4]
        
    try:
        with open(trans_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                try:
                    step = json.loads(line)
                    created_at = step.get("created_at", "")
                    
                    # Look at tool calls from model
                    tool_calls = step.get("tool_calls", [])
                    for tc in tool_calls:
                        name = tc.get("name", "")
                        args = tc.get("args", {})
                        if isinstance(args, str):
                            try:
                                args = json.loads(args)
                            except:
                                pass
                        
                        target_file = ""
                        content = ""
                        
                        if name in ["write_to_file", "replace_file_content", "multi_replace_file_content"]:
                            target_file = args.get("TargetFile", "")
                            if name == "write_to_file":
                                content = args.get("CodeContent", "")
                            elif name == "replace_file_content":
                                content = args.get("ReplacementContent", "")
                            elif name == "multi_replace_file_content":
                                content = str(args.get("ReplacementChunks", ""))
                                
                        if target_file and any(kw in target_file.lower() for kw in keywords):
                            extracted_files.append({
                                "conv_id": conv_id,
                                "created_at": created_at,
                                "tool": name,
                                "file": target_file,
                                "content": content,
                                "step_index": step.get("step_index", 0),
                                "line_num": line_num
                            })
                except Exception as e:
                    pass
    except Exception as e:
        print(f"Could not read {trans_path}: {e}")

print(f"\nTotal extracted edits: {len(extracted_files)}")

# Sort by created_at descending
extracted_files.sort(key=lambda x: x["created_at"], reverse=True)

# Print summary
for idx, item in enumerate(extracted_files[:50]):
    print(f"[{item['created_at']}] Conv: {item['conv_id']} | Tool: {item['tool']} | File: {item['file']}")
    preview = item["content"][:150].replace("\n", " ")
    print(f"    Preview: {preview}...")
