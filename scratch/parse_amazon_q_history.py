import json
import os
import re

history_dir = os.path.expanduser("~/.aws/amazonq/history")
files = [
    "chat-history-0ff84073b5842d5b144a3dab1eedeac9.json",
    "chat-history-f50e91dc7e10690c28c79f6098e8c69b.json"
]

keywords = ["portail", "chirurgie", "paiement", "paiements", "hospital", "ordonnance", "patient"]

for fname in files:
    path = os.path.join(history_dir, fname)
    if not os.path.exists(path):
        print(f"File {fname} does not exist")
        continue
        
    print(f"\n==================================================")
    print(f"Parsing {fname} (Size: {os.path.getsize(path)} bytes)...")
    print(f"==================================================")
    
    try:
        # Load JSON. Since one of the files is 27MB, we need to be careful but python can easily handle 27MB in memory.
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            data = json.load(f)
            
        # The structure is likely an object or a list of messages.
        # Let's inspect the keys of the JSON first.
        if isinstance(data, dict):
            print("Root keys:", list(data.keys()))
            # If there is a "conversations" or "messages" or "chat" key
            # Let's try to recursively search for text/code blocks.
        elif isinstance(data, list):
            print(f"Root is a list of {len(data)} items")
            
        # Let's search recursively for string fields containing code blocks or keywords.
        code_blocks = []
        
        def search_recursive(obj):
            if isinstance(obj, str):
                # Look for code blocks: ```lang ... ```
                if any(kw in obj.lower() for kw in keywords):
                    # Find all code blocks in this text
                    blocks = re.findall(r"```(?:ts|typescript|html|css)?\s*(.*?)\s*```", obj, re.DOTALL)
                    for b in blocks:
                        if len(b.strip()) > 100:  # ignore tiny code snippets
                            code_blocks.append((obj, b.strip()))
            elif isinstance(obj, dict):
                for k, v in obj.items():
                    search_recursive(v)
            elif isinstance(obj, list):
                for item in obj:
                    search_recursive(item)
                    
        search_recursive(data)
        
        print(f"Found {len(code_blocks)} code blocks containing keywords.")
        
        # Save unique code blocks to files in the scratch directory
        seen_blocks = set()
        count = 0
        for full_text, code in code_blocks:
            code_hash = hash(code)
            if code_hash not in seen_blocks:
                seen_blocks.add(code_hash)
                count += 1
                
                # Check if we can identify the file name from context (often mentioned in text above or in code)
                # Look for file path pattern in the 200 characters before the code block
                file_mention = "unknown_file"
                # Find the code block in the full text to check preceding text
                idx = full_text.find(code)
                if idx != -1:
                    preceding = full_text[max(0, idx-300):idx]
                    # look for something like src/app/... or file basename
                    m = re.search(r"([\w\.\-/]+src/app/[\w\.\-/]+)", preceding)
                    if m:
                        file_mention = m.group(1).replace("/", "_").replace("\\", "_")
                    else:
                        m2 = re.search(r"([\w\.\-]+\.(?:ts|html|css))", preceding)
                        if m2:
                            file_mention = m2.group(1)
                
                output_name = f"extracted_{count}_{file_mention}"
                output_path = f"/Users/cheixibra/Downloads/Innov/baye_defal_yalla_web/scratch/{output_name}"
                with open(output_path, "w", encoding="utf-8") as out:
                    out.write(code)
                print(f"  Saved block {count} to {output_path} (size: {len(code)} chars, mention: {file_mention})")
                
    except Exception as e:
        print(f"Error parsing {fname}: {e}")
