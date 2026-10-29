"""Replay Forge native Windows library desktop entrypoint."""
from __future__ import annotations

import queue
import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

from .library import list_replays, scan, summary


class ReplayForgeApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        root.title("Replay Forge • Replay Library")
        root.geometry("1160x740")
        root.minsize(780, 490)
        root.configure(bg="#111827")
        self.messages: queue.Queue = queue.Queue()
        self.busy = False
        self.root.after(120, self.poll_messages)

        style = ttk.Style(root)
        if "clam" in style.theme_names():
            style.theme_use("clam")
        style.configure("TFrame", background="#111827")
        style.configure("TLabel", background="#111827", foreground="#e5e7eb", font=("Segoe UI", 10))
        style.configure("TButton", font=("Segoe UI", 10), padding=7)
        style.configure("Treeview", rowheight=30, font=("Segoe UI", 10),
                        background="#1f2937", fieldbackground="#1f2937",
                        foreground="#f9fafb", borderwidth=0)
        style.configure("Treeview.Heading", font=("Segoe UI Semibold", 10))
        style.map("Treeview", background=[("selected", "#2563eb")])
        pane = ttk.Frame(root, padding=22)
        pane.pack(fill="both", expand=True)

        tk.Label(pane, text="REPLAY FORGE", font=("Segoe UI Semibold", 24),
                 bg="#111827", fg="#f3f4f6").pack(anchor="w")
        tk.Label(pane, text="Local Rocket League replay library  •  v0.1 foundation",
                 font=("Segoe UI", 11), bg="#111827", fg="#94a3b8").pack(anchor="w", pady=(1, 14))

        toolbar = ttk.Frame(pane)
        toolbar.pack(fill="x", pady=(0, 12))
        self.scan_btn = ttk.Button(toolbar, text="Import replay folder…", command=self.choose_folder)
        self.scan_btn.pack(side="left", padx=(0, 8))
        ttk.Button(toolbar, text="Refresh", command=self.refresh).pack(side="left")
        ttk.Label(toolbar, text="Search files:").pack(side="left", padx=(24, 8))
        self.search_var = tk.StringVar()
        entry = ttk.Entry(toolbar, textvariable=self.search_var, width=37)
        entry.pack(side="left", fill="x", expand=True)
        entry.bind("<Return>", lambda _: self.refresh())

        self.summary_var = tk.StringVar(value="Library loading…")
        ttk.Label(pane, textvariable=self.summary_var).pack(anchor="w", pady=(0, 12))
        columns = ("filename", "size", "status", "indexed", "path")
        self.tree = ttk.Treeview(pane, columns=columns, show="headings")
        for col, label, width in [
            ("filename", "Replay", 220), ("size", "Size", 100),
            ("status", "Decode state", 160), ("indexed", "Indexed (UTC)", 190),
            ("path", "Path", 510)
        ]:
            self.tree.heading(col, text=label)
            self.tree.column(col, width=width, minwidth=60,
                             stretch=col in ("filename", "path"))
        scroll = ttk.Scrollbar(pane, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scroll.set)
        scroll.pack(side="right", fill="y")
        self.tree.pack(fill="both", expand=True)
        self.tree.bind("<Double-1>", self.show_details)

        self.status_var = tk.StringVar(value="Ready — choose a replay directory to import.")
        ttk.Label(pane, textvariable=self.status_var).pack(anchor="w", pady=(12, 4))
        ttk.Label(pane, text="Physics metrics and 3D playback are not implemented in this foundation release.",
                  ).pack(anchor="w")
        self.refresh()

    def choose_folder(self):
        selected = filedialog.askdirectory(title="Choose Rocket League replay directory")
        if not selected:
            return
        if self.busy:
            return
        self.busy = True
        self.scan_btn.state(["disabled"])
        self.status_var.set(f"Indexing {selected}…")
        def worker():
            try:
                self.messages.put(("scan_ok", scan(Path(selected))))
            except Exception as exc:
                self.messages.put(("error", str(exc)))
        threading.Thread(target=worker, daemon=True).start()

    def poll_messages(self):
        try:
            while True:
                kind, payload = self.messages.get_nowait()
                self.busy = False
                self.scan_btn.state(["!disabled"])
                if kind == "scan_ok":
                    self.status_var.set(
                        f"Scanned {payload['found']} replays; {payload['indexed']} updated; "
                        f"{payload['unchanged']} unchanged; {payload['failed']} failed."
                    )
                    if payload["failed"]:
                        messagebox.showwarning("Some files could not be indexed",
                                               "\n".join(e["path"]+": "+e["error"] for e in payload["errors"][:10]))
                    self.refresh()
                else:
                    self.status_var.set("Import failed")
                    messagebox.showerror("Replay Forge", payload)
        except queue.Empty:
            pass
        self.root.after(120, self.poll_messages)

    def refresh(self):
        try:
            # Show up to 5k matching files in the initial desktop UI; pagination is a later milestone.
            rows = list_replays(limit=1000, search=self.search_var.get())
            info = summary()
            for item in self.tree.get_children():
                self.tree.delete(item)
            for row in rows:
                path = Path(row["path"])
                self.tree.insert("", "end", values=(
                    path.name, f'{row["size_bytes"] / 1024:.1f} KB', row["status"],
                    row["indexed_at"][:19], row["path"]
                ))
            self.summary_var.set(
                f'{info["replays_indexed"]:,} replay file(s) indexed • '
                f'{len(rows):,} shown • {info["total_bytes"] / 1048576:.1f} MiB cataloged'
            )
        except Exception as exc:
            self.status_var.set(f"Could not load library: {exc}")

    def show_details(self, _event):
        selected = self.tree.selection()
        if selected:
            values = self.tree.item(selected[0], "values")
            messagebox.showinfo("Replay file", f"File: {values[0]}\nSize: {values[1]}\n"
                                f"State: {values[2]}\nPath: {values[4]}")


def main():
    root = tk.Tk()
    ReplayForgeApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
