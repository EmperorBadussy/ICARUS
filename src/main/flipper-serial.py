#!/usr/bin/env python3
"""Flipper Zero serial communication bridge for ICARUS."""
import serial
import serial.tools.list_ports
import sys
import json
import time

FLIPPER_VID_PID = "0483"
BAUD = 230400
BADUSB_PATH = "/ext/badusb"


def find_flipper():
    for port in serial.tools.list_ports.comports():
        if FLIPPER_VID_PID in port.hwid:
            return port.device
    return None


def open_serial(port):
    """Open serial with proper error handling."""
    try:
        ser = serial.Serial(port, BAUD, timeout=2)
        time.sleep(0.3)
        # Clear any buffered data
        ser.reset_input_buffer()
        ser.reset_output_buffer()
        ser.write(b'\r\n')
        time.sleep(0.2)
        ser.read(10000)
        return ser
    except serial.SerialException as e:
        print(json.dumps({"error": f"Cannot open {port}: {str(e)}"}))
        return None


def send_command(ser, cmd, wait=0.5):
    try:
        ser.reset_input_buffer()
        ser.write((cmd + '\r\n').encode())
        time.sleep(wait)
        return ser.read(ser.in_waiting or 10000).decode('utf-8', errors='ignore')
    except Exception as e:
        return f"ERROR: {str(e)}"


def safe_close(ser):
    try:
        if ser and ser.is_open:
            ser.close()
    except:
        pass


def cmd_detect():
    port = find_flipper()
    if port:
        # Quick test that we can actually open it
        try:
            ser = serial.Serial(port, BAUD, timeout=1)
            ser.close()
            print(json.dumps({"found": True, "port": port}))
        except serial.SerialException as e:
            print(json.dumps({"found": True, "port": port, "busy": True, "error": str(e)}))
    else:
        print(json.dumps({"found": False, "port": None}))


def cmd_list():
    port = find_flipper()
    if not port:
        print(json.dumps([]))
        return

    ser = open_serial(port)
    if not ser:
        print(json.dumps([]))
        return

    try:
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
                if dirname in ('loot', 'assets', '.', '..'):
                    continue
                sub_response = send_command(ser, f'storage list {BADUSB_PATH}/{dirname}', 1)
                for sub_line in sub_response.split('\n'):
                    sub_line = sub_line.strip()
                    if sub_line.startswith('[F]'):
                        sub_parts = sub_line[4:].strip()
                        sub_name_size = sub_parts.rsplit(' ', 1)
                        sub_name = sub_name_size[0].strip()
                        sub_size = sub_name_size[1] if len(sub_name_size) > 1 else '0b'
                        files.append({"name": sub_name, "path": f"{BADUSB_PATH}/{dirname}/{sub_name}", "category": dirname, "size": sub_size})
        print(json.dumps(files))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
    finally:
        safe_close(ser)


def cmd_deploy(category, filename, content):
    port = find_flipper()
    if not port:
        print(json.dumps({"error": "Flipper not found"}))
        return

    ser = open_serial(port)
    if not ser:
        return

    try:
        # Create category dir
        send_command(ser, f'storage mkdir {BADUSB_PATH}/{category}', 0.3)

        # Write file
        filepath = f'{BADUSB_PATH}/{category}/{filename}'
        ser.reset_input_buffer()
        ser.write(f'storage write {filepath}\r\n'.encode())
        time.sleep(0.3)

        # Send content line by line
        for line in content.split('\n'):
            ser.write(line.rstrip().encode() + b'\r\n')
            time.sleep(0.02)

        # End with Ctrl+C
        time.sleep(0.2)
        ser.write(b'\x03')
        time.sleep(0.5)
        ser.read(10000)
        print(json.dumps({"success": True, "path": filepath}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
    finally:
        safe_close(ser)


def cmd_remove(filepath):
    port = find_flipper()
    if not port:
        print(json.dumps({"error": "Flipper not found"}))
        return

    ser = open_serial(port)
    if not ser:
        return

    try:
        send_command(ser, f'storage remove {filepath}', 0.5)
        print(json.dumps({"success": True}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
    finally:
        safe_close(ser)


def cmd_list_loot():
    port = find_flipper()
    if not port:
        print(json.dumps([]))
        return

    ser = open_serial(port)
    if not ser:
        print(json.dumps([]))
        return

    try:
        loot_path = f"{BADUSB_PATH}/loot"
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
        print(json.dumps(loot_items))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
    finally:
        safe_close(ser)


def cmd_pull_loot(filepath):
    port = find_flipper()
    if not port:
        print(json.dumps({"error": "Flipper not found"}))
        return

    ser = open_serial(port)
    if not ser:
        return

    try:
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
        print(json.dumps({"content": content, "path": filepath}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
    finally:
        safe_close(ser)


if __name__ == '__main__':
    try:
        command = sys.argv[1] if len(sys.argv) > 1 else 'detect'

        if command == 'detect':
            cmd_detect()
        elif command == 'list':
            cmd_list()
        elif command == 'deploy':
            category = sys.argv[2]
            filename = sys.argv[3]
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
    except Exception as e:
        print(json.dumps({"error": str(e)}))
