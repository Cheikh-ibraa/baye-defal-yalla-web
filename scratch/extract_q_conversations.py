import json
import os
import re

path = "/Users/cheixibra/.aws/amazonq/history/chat-history-f50e91dc7e10690c28c79f6098e8c69b.json"
output_dir = "/Users/cheixibra/Downloads/Innov/baye_defal_yalla_web/scratch/amazonq_extracted"
os.makedirs(output_dir, exist_ok=True)

with open(path, "r", encoding="utf-8", errors="ignore") as f:
    data = json.load(f)

col = [c for c in data.get("collections", []) if c.get("name") == "tabs"][0]
doc = col.get("data", [])[0]

conversations = doc.get("conversations", [])
print(f"Total conversations in tabs: {len(conversations)}")

# Keywords to track
keywords = ["portail", "chirurgie", "paiement", "paiements", "hospital", "ordonnance", "patient"]

count = 0
for conv_idx, conv in enumerate(conversations):
    conv_id = conv.get("conversationId", f"conv_{conv_idx}")
    updated_at = conv.get("updatedAt", "")
    messages = conv.get("messages", [])
    
    print(f"\nProcessing Conversation {conv_id} (Updated: {updated_at}) - {len(messages)} messages...")
    
    # Save raw chat for this conversation
    chat_file_path = os.path.join(output_dir, f"{conv_id}_chat.txt")
    with open(chat_file_path, "w", encoding="utf-8") as cf:
        cf.write(f"CONVERSATION ID: {conv_id}\nUPDATED AT: {updated_at}\n\n")
        
        for msg_idx, msg in enumerate(messages):
            sender = msg.get("sender", "unknown")
            # Q messages often have sender like "user" or "assistant" / "amazonq"
            body = msg.get("body", "")
            
            cf.write(f"--- MSG {msg_idx} ({sender}) ---\n{body}\n\n")
            
            # Look for code blocks in assistant/amazonq messages
            if sender != "user":
                # Find code blocks
                blocks = re.findall(r"```(?:ts|typescript|html|css|json)?\s*(.*?)\s*```", body, re.DOTALL)
                for b_idx, block in enumerate(blocks):
                    block_stripped = block.strip()
                    if len(block_stripped) > 100: # only extract sizable code blocks
                        count += 1
                        
                        # Try to find a file path in the message preceding the code block
                        file_mention = f"block_{count}"
                        idx = body.find(block)
                        if idx != -1:
                            preceding = body[max(0, idx-300):idx]
                            m = re.search(r"([\w\.\-/]+src/app/[\w\.\-/]+)", preceding)
                            if m:
                                file_mention = m.group(1).replace("/", "_").replace("\\", "_")
                            else:
                                m2 = re.search(r"([\w\.\-]+\.(?:ts|html|css))", preceding)
                                if m2:
                                    file_mention = m2.group(1)
                                    
                        code_file_name = f"{conv_id}_code_{b_idx+1}_{file_mention}.txt"
                        code_file_path = os.path.join(output_dir, code_file_name)
                        with open(code_file_path, "w", encoding="utf-8") as kf:
                            kf.write(block_stripped)
                        print(f"  Extracted code block {count} -> {code_file_name} ({len(block_stripped)} chars)")

print(f"\nExtraction complete. Extracted {count} code blocks. Chats saved to {output_dir}")
