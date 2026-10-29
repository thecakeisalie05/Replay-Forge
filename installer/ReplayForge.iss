#define AppName "Replay Forge"
#define AppVersion "0.1.0"
[Setup]
AppId={{943C715B-4B86-4C83-88B3-681C6A1F0255}
AppName={#AppName}
AppVersion={#AppVersion}
DefaultDirName={autopf}\Replay Forge
DefaultGroupName=Replay Forge
OutputDir=..\dist-installer
OutputBaseFilename=ReplayForge-Setup-{#AppVersion}-win64
Compression=lzma
SolidCompression=yes
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=lowest
UninstallDisplayIcon={app}\ReplayForge.exe
[Files]
Source: "..\dist\ReplayForge.exe"; DestDir: "{app}"; Flags: ignoreversion
[Icons]
Name: "{group}\Replay Forge"; Filename: "{app}\ReplayForge.exe"
Name: "{autodesktop}\Replay Forge"; Filename: "{app}\ReplayForge.exe"; Tasks: desktopicon
[Tasks]
Name: "desktopicon"; Description: "Create desktop shortcut"; GroupDescription: "Additional shortcuts:"
[Run]
Filename: "{app}\ReplayForge.exe"; Description: "Launch Replay Forge"; Flags: nowait postinstall skipifsilent
