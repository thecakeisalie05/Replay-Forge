# Windows desktop build and installer

Replay Forge v0.1 is a **library-indexing preview**, not the finished analytics/replay viewer. It can import a folder recursively, show a searchable library and persist file fingerprints. Gameplay decoding and 3D graphics are not yet implemented.

## Download/build in GitHub

1. Open the repository **Actions** tab and select **Windows installer**.
2. Choose **Run workflow** and enable **publish_release** to publish the installer after a successful Windows build.
3. For an ordinary workflow run, open its **ReplayForge-Windows** artifact and download the ZIP containing the portable executable and setup program.
4. For a published run, look in **Releases** for `ReplayForge-Setup-0.1.0-win64.exe`.

The Windows workflow executes the unit tests, builds a PyInstaller EXE, compiles an Inno Setup installer and uploads both as workflow artifacts. Publishing happens only after those steps succeed. It is a preview release, **not code signed**: Windows SmartScreen may warn about unknown publishers.

## Local Windows development

Install Python 3.11+ with Tkinter support and run:

```powershell
python run_desktop.py
```

Build locally using `scripts/build-windows.ps1` and compile `installer/ReplayForge.iss` using Inno Setup 6.

## Data storage

Source replays remain read-only. Catalog data lives in `%USERPROFILE%\.replay_forge\library.sqlite3`. Removing Replay Forge does not currently remove the catalog. No data is uploaded.
