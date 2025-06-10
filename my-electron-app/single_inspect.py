import sys
import json
import time

input_data = sys.stdin.read()
device = json.loads(input_data)

# 模拟巡检过程
time.sleep(2)

result = {
    "ip": device.get("ip"),
    "brand": device.get("brand"),
    "status": "completed",
    "output_file": f"{device.get('ip')}_result.txt"
}
print(json.dumps(result))
