#!/usr/bin/env python3
"""Move the template version stamped into every generated file, or check that
the tree agrees with itself.

The stamp is a generated SDK's only record of which template snapshot produced
it. When a template loses its stamp, or two templates disagree, a consumer
holding generated code has no way to answer "is my SDK affected by this fix, do
I need to regenerate?" -- so both are failures here, not warnings.

    python tools/bump_version.py --check
    python tools/bump_version.py 1.2.3

Bumping the stamp is one half of a release; the CHANGELOG heading is the other,
and this script only warns about it.
"""

import argparse
import re
import sys
from pathlib import Path

TARGETS = ("cpp", "python", "typescript")

STAMP = re.compile(r"(Templates: kibo-template-viper )(\d+\.\d+\.\d+)( \(MIT\))")

# The Template Model revision this pack is written against — the accessors it reads
# from the generator. It is a declared dependency, not this repository's version: a
# pack ships a feature because its target gained something to project, and goes on
# needing the same model. One pack, one model, so the templates must agree.
MODEL = re.compile(r"Template Model (\d+)\.")

# The runtime a target is generated against, stamped beside the runtime it
# qualifies. The template version no longer carries it -- MAJOR.MINOR tracks the
# Template Model kibo exposes, not the runtime -- so the generated file has to
# say it itself, and the three targets do not agree on it.
RUNTIME = {
    "cpp": re.compile(r"the `viper` C\+\+ runtime (\S+),"),
    "python": re.compile(r"imports `dsviper` (\S+),"),
    "typescript": re.compile(r"imports `@digitalsubstrate/dsviper` (.+?),"),
}
VERSION = re.compile(r"^\d+\.\d+\.\d+$")
RELEASED = re.compile(r"^## \[(\d+\.\d+\.\d+)\]", re.MULTILINE)

# Templates whose generated output is strict JSON. JSON has no comment syntax,
# so stamping them would break the file for every parser that reads it -- npm,
# in the one case below. The rest of the project generated alongside them
# carries the stamp, so the snapshot is still identifiable.
EXEMPT = {
    "typescript/project/package.json.stg": "npm parses package.json as strict JSON",
}


def read(path):
    """Decode without newline translation, so Windows cannot smuggle in CRLF."""
    return path.read_bytes().decode("utf-8")


def write(path, text):
    path.write_bytes(text.encode("utf-8"))


def templates(root):
    found = []
    for target in TARGETS:
        found.extend(sorted((root / target).rglob("*.stg")))
    return found


def survey(root):
    """Return (stamped, versions, unstamped, runtimes, models) across the tree."""
    stamped, versions, unstamped = [], set(), []
    runtimes = {target: set() for target in TARGETS}
    models = set()
    for path in templates(root):
        rel = path.relative_to(root).as_posix()
        text = read(path)
        match = STAMP.search(text)
        if match:
            stamped.append(path)
            versions.add(match.group(2))
        elif rel not in EXEMPT:
            unstamped.append(rel)

        target = rel.split("/", 1)[0]
        runtime = RUNTIME[target].search(text)
        if runtime:
            runtimes[target].add(runtime.group(1))

        model = MODEL.search(text)
        if model:
            models.add(model.group(1))
    return stamped, versions, unstamped, runtimes, models


def check(root, total, stamped, versions, unstamped, runtimes, models):
    """Report every invariant that is broken. Returns an exit code."""
    if not total:
        print("error: no templates found; is this the repository root?", file=sys.stderr)
        return 2

    failed = False
    if unstamped:
        print("error: template(s) missing the version stamp:", file=sys.stderr)
        for rel in unstamped:
            print("  " + rel, file=sys.stderr)
        print("Add the stamp, or exempt the file in EXEMPT with a reason.", file=sys.stderr)
        failed = True

    if len(versions) > 1:
        print("error: templates disagree on the version: "
              + ", ".join(sorted(versions)), file=sys.stderr)
        failed = True

    if len(models) > 1:
        print("error: templates disagree on the Template Model they need: "
              + ", ".join(sorted(models)), file=sys.stderr)
        failed = True

    for target, found in runtimes.items():
        if len(found) > 1:
            print(f"error: {target} templates disagree on the runtime they target: "
                  + ", ".join(sorted(found)), file=sys.stderr)
            failed = True

    return 1 if failed else 0


def changelog_warning(root, version):
    """The stamp should match the newest released CHANGELOG heading. Only a
    warning: a release moves the two in separate steps."""
    path = root / "CHANGELOG.md"
    if not path.exists():
        return
    headings = RELEASED.findall(read(path))
    if headings and headings[0] != version:
        print("warning: templates stamp {} but the newest CHANGELOG release is {}"
              .format(version, headings[0]), file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(
        description=__doc__.split("\n\n")[0],
        formatter_class=argparse.RawDescriptionHelpFormatter)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--check", action="store_true",
                       help="report the stamped version and verify the tree")
    group.add_argument("version", nargs="?",
                       help="the new version to stamp, as X.Y.Z")
    args = parser.parse_args()

    root = Path(__file__).resolve().parent.parent
    total = templates(root)
    stamped, versions, unstamped, runtimes, models = survey(root)

    code = check(root, total, stamped, versions, unstamped, runtimes, models)
    if code:
        return code

    current = next(iter(versions))

    if args.check:
        print("{} ({} of {} templates stamped, {} exempt)"
              .format(current, len(stamped), len(total), len(total) - len(stamped)))
        changelog_warning(root, current)
        return 0

    if not VERSION.match(args.version):
        print("error: version must be X.Y.Z, got '{}'".format(args.version), file=sys.stderr)
        return 2
    if args.version == current:
        print("already at " + current)
        return 0

    for path in stamped:
        write(path, STAMP.sub(r"\g<1>" + args.version + r"\g<3>", read(path)))

    after_stamped, after_versions, _, _, _ = survey(root)
    if after_versions != {args.version} or len(after_stamped) != len(stamped):
        print("error: rewrite did not converge (found {}, {} of {} stamped)"
              .format(", ".join(sorted(after_versions)), len(after_stamped), len(stamped)),
              file=sys.stderr)
        return 1

    print("{} -> {} ({} templates)".format(current, args.version, len(after_stamped)))
    print("Remember the CHANGELOG heading.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
