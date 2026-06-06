import json
import os
import sys

transcript_path = r"C:\Users\quang\.gemini\antigravity\brain\4e0f57a4-13a8-4ca4-9d02-248480b2af4f\.system_generated\logs\transcript.jsonl"

file_contents = {}

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'PLANNER_RESPONSE':
                # Check for write_to_file or replace_file_content tool calls
                tool_calls = data.get('tool_calls', [])
                for call in tool_calls:
                    if call.get('name') == 'write_to_file':
                        args = call.get('args', {})
                        path = args.get('TargetFile', '')
                        if 'backend\\tests\\' in path or 'backend/tests/' in path:
                            file_contents[os.path.basename(path)] = args.get('CodeContent', '')
        except Exception as e:
            pass

out_dir = r"D:\Project\dangkiem-tau-ca\backend\tests"
os.makedirs(out_dir, exist_ok=True)

for name, content in file_contents.items():
    if content:
        with open(os.path.join(out_dir, name), 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Restored {name}")

print("Done")
