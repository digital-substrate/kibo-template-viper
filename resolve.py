#!/usr/bin/env python3
"""Resolve a feature selection into the templates kibo must render.

A project names the features it wants; this walks `requires` and returns the closure.
`kibo -t` accepts a single .stg as well as a directory, so templates stay flat and the
selection lives here rather than in the file system.

A project may add features of its own: a manifest of the same shape as `features.json`,
whose templates sit beside it (`<manifest dir>/<language>/<template>`), and whose features
may require the pack's. A feature name the pack already declares is refused.
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MANIFEST = json.loads((HERE / "features.json").read_text())


def _features(language: str, extra) -> dict[str, tuple[dict, Path]]:
    """Every feature of `language`, with the directory its templates are in."""
    features = {name: (spec, HERE / language) for name, spec in MANIFEST.get(language, {}).items()}
    for manifest in extra:
        manifest = Path(manifest).resolve()
        for name, spec in json.loads(manifest.read_text()).get(language, {}).items():
            if name in features:
                raise SystemExit(f"{manifest} declares {name!r}, which the pack already declares")
            features[name] = (spec, manifest.parent / language)
    return features


def closure(language: str, wanted: list[str], extra=()) -> list[str]:
    """Return the feature names `wanted` pulls in, dependencies first."""
    features = _features(language, extra)
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
        for need in features[name][0].get("requires", []):
            visit(need, path + (name,))
        seen.add(name)
        ordered.append(name)

    for name in wanted:
        visit(name, ())
    return ordered


def templates(language: str, wanted: list[str], extra=()) -> list[Path]:
    """Return the .stg paths for the closure of `wanted`, deduplicated, in order.

    `extra` names the project's own manifests, if any.
    """
    features = _features(language, extra)
    out: list[Path] = []
    for feature in closure(language, wanted, extra):
        spec, root = features[feature]
        for stg in spec["templates"]:
            path = root / stg
            if not path.exists():
                raise SystemExit(f"{feature} names {stg}, absent from {root}")
            if path not in out:
                out.append(path)
    return out


if __name__ == "__main__":
    args = sys.argv[1:]
    extra = []
    while "--with" in args:
        at = args.index("--with")
        extra.append(args[at + 1])
        del args[at:at + 2]
    if len(args) < 2:
        raise SystemExit("usage: resolve.py <language> <feature> [feature ...] [--with manifest.json ...]")
    lang, wanted = args[0], args[1:]
    print(f"features : {' '.join(closure(lang, wanted, extra))}")
    for p in templates(lang, wanted, extra):
        print(f"  {p.name}")
