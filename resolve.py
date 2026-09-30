#!/usr/bin/env python3
"""Resolve a feature selection into the templates kibo must render.

A project names the features it wants; this walks `requires` and returns the closure.
`kibo -t` accepts a single .stg as well as a directory, so templates stay flat and the
selection lives here rather than in the file system.
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MANIFEST = json.loads((HERE / "features.json").read_text())


def closure(language: str, wanted: list[str]) -> list[str]:
    """Return the feature names `wanted` pulls in, dependencies first."""
    features = MANIFEST[language]
    ordered: list[str] = []
    seen: set[str] = set()

    def visit(name: str, path: tuple[str, ...]) -> None:
        if name in path:
            raise SystemExit(f"cycle in features.json: {' -> '.join(path + (name,))}")
        if name in seen:
            return
        if name not in features:
            known = ", ".join(sorted(features))
            raise SystemExit(f"no feature {name!r} for {language} (known: {known})")
        for need in features[name].get("requires", []):
            visit(need, path + (name,))
        seen.add(name)
        ordered.append(name)

    for name in wanted:
        visit(name, ())
    return ordered


def templates(language: str, wanted: list[str]) -> list[Path]:
    """Return the .stg paths for the closure of `wanted`, deduplicated, in order."""
    root = HERE / language
    out: list[Path] = []
    for feature in closure(language, wanted):
        for stg in MANIFEST[language][feature]["templates"]:
            path = root / stg
            if not path.exists():
                raise SystemExit(f"features.json names {stg}, absent from {root}")
            if path not in out:
                out.append(path)
    return out


if __name__ == "__main__":
    if len(sys.argv) < 3:
        raise SystemExit("usage: resolve.py <language> <feature> [feature ...]")
    lang, wanted = sys.argv[1], sys.argv[2:]
    print(f"features : {' '.join(closure(lang, wanted))}")
    for p in templates(lang, wanted):
        print(f"  {p.name}")
