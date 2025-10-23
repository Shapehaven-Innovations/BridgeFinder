#!/usr/bin/env python3
from pathlib import Path
from collections import Counter

# === Configuration ===
source_dir = Path("/Users/computer/desktop/workspace/bridgefinder/").resolve()
# Destination is the same directory
output_file = (source_dir / "merged_output.txt").resolve()

# Directories to skip (by name anywhere in the path)
IGNORED_DIRS = {
    "venv", ".venv", "__pycache__", ".pytest_cache", ".tox",
    ".git", ".mypy_cache", ".ipynb_checkpoints", "node_modules", "build", "dist"
}

# File types to merge (case-insensitive)
INCLUDED_EXTS = {".py", ".swift", ".js", ".jsx", ".ts", ".tsx", ".sql", ".json", ".css", ".html", ".yml"}  # remove .log if not desired

# === Helpers ===
def is_in_ignored_dir(p: Path) -> bool:
    return any(part in IGNORED_DIRS for part in p.parts)

def should_include(p: Path) -> bool:
    if not p.is_file():
        return False
    if is_in_ignored_dir(p):
        return False
    # Never include the output file itself
    try:
        if p.resolve() == output_file:
            return False
    except Exception:
        return False
    # Only include selected extensions
    return p.suffix.lower() in INCLUDED_EXTS

# === Main ===
def main() -> None:
    print("Starting file merge...")
    print(f"Source directory: {source_dir}")
    print(f"Output file:      {output_file}")
    print(f"Ignored dirs:     {sorted(IGNORED_DIRS)}")
    print(f"Including types:  {sorted(INCLUDED_EXTS)}")

    if not source_dir.exists():
        print(f"Error: source_dir does not exist: {source_dir}")
        return

    all_paths = list(source_dir.rglob("*"))
    allowed_files = [p for p in all_paths if should_include(p)]

    # Sort deterministically: by extension then by relative path (case-insensitive)
    allowed_files.sort(key=lambda p: (p.suffix.lower(), str(p.relative_to(source_dir)).lower()))

    rejected_files = [
        p for p in all_paths
        if p.is_file() and p.resolve() != output_file and p not in allowed_files
    ]

    written = 0
    try:
        output_file.parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, "w", encoding="utf-8") as out:
            for filepath in allowed_files:
                rel_path = filepath.relative_to(source_dir)
                out.write(f"\n===== {rel_path} =====\n\n")
                try:
                    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                        for chunk in iter(lambda: f.read(65536), ""):
                            out.write(chunk)
                    # Separate files clearly
                    out.write("\n\n")
                    written += 1
                except Exception as e:
                    out.write(f"[Error reading file: {e}]\n\n")

        ext_counts = Counter(p.suffix.lower() for p in allowed_files)
        print(f"\nSuccess! Wrote {written} files to {output_file}")
        if ext_counts:
            print("By type:")
            for ext in sorted(ext_counts):
                print(f"  {ext or '(no ext)'}: {ext_counts[ext]}")
    except Exception as e:
        print(f"Error writing output file: {e}")

    print(f"\nRejected (not merged): {len(rejected_files)} files")
    if rejected_files:
        sample = rejected_files[:5]
        print("First 5 rejected:")
        for p in sample:
            try:
                rel = p.relative_to(source_dir)
            except Exception:
                rel = p
            print(f"  - {rel}")
        if len(rejected_files) > 5:
            print(f"  ...and {len(rejected_files) - 5} more")

    print("\nDone!")

if __name__ == "__main__":
    main()

