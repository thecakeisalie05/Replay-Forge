$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
py -3 -m venv .venv-build
$python = Join-Path (Get-Location) ".venv-build\Scripts\python.exe"
& $python -m pip install --upgrade pip
& $python -m pip install pyinstaller
& $python -m unittest discover -s tests -v
if ($LASTEXITCODE -ne 0) { throw "Unit tests failed" }
& $python -m PyInstaller --noconfirm --clean --onefile --windowed --name ReplayForge --collect-submodules replay_forge --add-data "replay_forge/web;replay_forge/web" replay_forge/desktop.py
if ($LASTEXITCODE -ne 0) { throw "PyInstaller failed" }
Write-Host "Portable EXE: dist\ReplayForge.exe"
