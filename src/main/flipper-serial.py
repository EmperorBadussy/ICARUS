#!/usr/bin/env python3
"""Flipper Zero serial communication bridge for ICARUS."""
import serial
import serial.tools.list_ports
import sys
import json
import time

FLIPPER_VID_PID = "0483:5740"
BAUD = 230400
BADUSB_PATH = "/ext/badusb"

def find_flipper():
    for port in serial.tools.list_ports.comports():
        if FLIPPER_VID_PID.replace(":", "") in port.hwid.replace(":", "").upper() or "0483" in port.hwid:
            return port.device
    return None

def send_command(ser, cmd, wait=0.5):
    ser.write(b'\r\n')
    time.sleep(0.1)
    ser.read(10000)  # clear buffer
    ser.write((cmd + '\r\n').encode())
    time.sleep(wait)
    return ser.read(10000).decode('utf-8', errors='ignore')

def cmd_detect():
    port = find_flipper()
    if port:
        print(json.dumps({"found": True, "port": port}))
    else:
        print(json.dumps({"found": False, "port": None}))

def cmd_list():
    port = find_flipper()
    if not port:
        print(json.dumps({"error": "Flipper not found"}))
        return

    ser = serial.Serial(port, BAUD, timeout=2)
    time.sleep(0.5)

    # List badusb directory
    response = send_command(ser, f'storage list {BADUSB_PATH}', 1)

    files = []
    for line in response.split('\n'):
        line = line.strip()
        if line.startswith('[F]'):
            parts = line[4:].strip()
            name_size = parts.rsplit(' ', 1)
            name = name_size[0].strip()
            size = name_size[1] if len(name_size) > 1 else '0b'
            files.append({"name": name, "path": f"{BADUSB_PATH}/{name}", "category": "root", "size": size})
        elif line.startswith('[D]'):
            dirname = line[4:].strip()
            # List subdirectory
            sub_response = send_command(ser, f'storage list {BADUSB_PATH}/{dirname}', 1)
            for sub_line in sub_response.split('\n'):
                sub_line = sub_line.strip()
                if sub_line.startswith('[F]'):
                    sub_parts = sub_line[4:].strip()
                    sub_name_size = sub_parts.rsplit(' ', 1)
                    sub_name = sub_name_size[0].strip()
                    sub_size = sub_name_size[1] if len(sub_name_size) > 1 else '0b'
                    files.append({"name": sub_name, "path": f"{BADUSB_PATH}/{dirname}/{sub_name}", "category": dirname, "size": sub_size})

    ser.close()
    print(json.dumps(files))

def cmd_deploy(category, filename, content):
    port = find_flipper()
    if not port:
        print(json.dumps({"error": "Flipper not found"}))
        return

    ser = serial.Serial(port, BAUD, timeout=2)
    time.sleep(0.5)

    # Create category dir
    send_command(ser, f'storage mkdir {BADUSB_PATH}/{category}', 0.3)

    # Write file
    filepath = f'{BADUSB_PATH}/{category}/{filename}'
    ser.write(b'\r\n')
    time.sleep(0.1)
    ser.read(10000)
    ser.write(f'storage write {filepath}\r\n'.encode())
    time.sleep(0.3)

    # Send content line by line
    for line in content.split('\n'):
        ser.write(line.encode() + b'\r\n')
        time.sleep(0.02)

    # End with Ctrl+C
    time.sleep(0.2)
    ser.write(b'\x03')
    time.sleep(0.5)
    ser.read(10000)

    ser.close()
    print(json.dumps({"success": True, "path": filepath}))

def cmd_remove(filepath):
    port = find_flipper()
    if not port:
        print(json.dumps({"error": "Flipper not found"}))
        return

    ser = serial.Serial(port, BAUD, timeout=2)
    time.sleep(0.5)
    send_command(ser, f'storage remove {filepath}', 0.5)
    ser.close()
    print(json.dumps({"success": True}))

def cmd_list_loot():
    """List all loot files on Flipper at /ext/badusb/loot/"""
    port = find_flipper()
    if not port:
        print(json.dumps({"error": "Flipper not found"}))
        return

    ser = serial.Serial(port, BAUD, timeout=2)
    time.sleep(0.5)

    loot_path = "/ext/badusb/loot"
    response = send_command(ser, f'storage list {loot_path}', 1)

    loot_items = []
    for line in response.split('\n'):
        line = line.strip()
        if line.startswith('[D]'):
            session = line[4:].strip()
            sub_response = send_command(ser, f'storage list {loot_path}/{session}', 1)
            files = []
            for sub_line in sub_response.split('\n'):
                sub_line = sub_line.strip()
                if sub_line.startswith('[F]'):
                    parts = sub_line[4:].strip()
                    name_size = parts.rsplit(' ', 1)
                    fname = name_size[0].strip()
                    fsize = name_size[1] if len(name_size) > 1 else '0b'
                    files.append({"name": fname, "size": fsize})
            loot_items.append({"session": session, "path": f"{loot_path}/{session}", "files": files})
        elif line.startswith('[F]'):
            parts = line[4:].strip()
            name_size = parts.rsplit(' ', 1)
            fname = name_size[0].strip()
            fsize = name_size[1] if len(name_size) > 1 else '0b'
            loot_items.append({"session": "unsorted", "path": loot_path, "files": [{"name": fname, "size": fsize}]})

    ser.close()
    print(json.dumps(loot_items))

def cmd_pull_loot(filepath):
    """Read a loot file from Flipper and return its contents"""
    port = find_flipper()
    if not port:
        print(json.dumps({"error": "Flipper not found"}))
        return

    ser = serial.Serial(port, BAUD, timeout=3)
    time.sleep(0.5)

    response = send_command(ser, f'storage read {filepath}', 2)

    lines = response.split('\n')
    content_lines = []
    started = False
    for line in lines:
        if 'storage read' in line:
            started = True
            continue
        if started and line.strip().startswith('>:'):
            break
        if started:
            content_lines.append(line.rstrip())

    content = '\n'.join(content_lines).strip()
    ser.close()
    print(json.dumps({"content": content, "path": filepath}))

if __name__ == '__main__':
    command = sys.argv[1] if len(sys.argv) > 1 else 'detect'

    if command == 'detect':
        cmd_detect()
    elif command == 'list':
        cmd_list()
    elif command == 'deploy':
        category = sys.argv[2]
        filename = sys.argv[3]
        # Content comes from stdin
        content = sys.stdin.read()
        cmd_deploy(category, filename, content)
    elif command == 'remove':
        filepath = sys.argv[2]
        cmd_remove(filepath)
    elif command == 'list-loot':
        cmd_list_loot()
    elif command == 'pull-loot':
        filepath = sys.argv[2]
        cmd_pull_loot(filepath)
    else:
        print(json.dumps({"error": f"Unknown command: {command}"}))
