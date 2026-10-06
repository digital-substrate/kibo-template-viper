# kibo-template-viper

> This is the kibo 2 line. The 1.2 pack, for kibo 1 (Template Model 1), lives on the `LTS-1.2` branch and is deprecated:
> it receives fixes only, for the life of the LTS-1.2 line.

First-party templated features targeting the Viper ecosystem: the Viper C++ runtime, and
its [dsviper](https://docs.digitalsubstrate.io/dsviper/) Python and Node.js bindings.
Consumed by [Kibo](https://docs.digitalsubstrate.io/kibo/) 2 to generate the static API
surface that lets C++, Python and TypeScript developers work against typed classes instead
of stringly-typed metadata.

## Documentation

Full documentation: https://docs.digitalsubstrate.io/kibo-template-viper/

Design note — the Dual Reality the generated code rests on: [`DESIGN.md`](DESIGN.md).

Part of the [DevKit ecosystem](https://docs.digitalsubstrate.io/).

## Layout

```
features.json            # the features a project selects, their templates, what they require
resolve.py               # the closure of a selection: the templates kibo must render

cpp/*.stg                # C++ targeting the Viper C++ runtime
python/*.stg             # the Python package a model generates, over dsviper
python/runtime/          # the runtime every generated Python package carries, as `_codegen`
typescript/*.stg         # the TypeScript package, over @digitalsubstrate/dsviper
typescript/runtime/      # the runtime every generated TypeScript package carries
```

**One namespace is one unit.** C++ gets a file-name prefix, Python and TypeScript a module
directory, so two namespaces of one model may declare the same name.

**Templates are flat; features are declared.** A project names the features it wants, and
`resolve.py` walks what they require:

| target | features |
|---|---|
| `cpp` | `Base` (data, codec, model, any concept), `Fields`, `Attachments`, `Pool`, `PoolRemote` |
| `python` | `Base`, `Pool`, `Wheel` |
| `typescript` | `Base`, `Pool`, `Package` |

```
$ ./resolve.py cpp Attachments
features : Base Fields Attachments
```

For the conceptual ground (templated feature, Template Model, the role
of Kibo), see the user-facing docs:

- `devkit-doc/source/kibo/usage.md`
- `devkit-doc/source/kibo/templates.md`
- `devkit-doc/source/kibo/template_model.md`

## Public contract

These templates are surface templates: each one is a static projection of the Viper
runtime — its types, its attachments, its function pools. What they generate is a public
API by another name: renaming a generated class, field or operation breaks the code written
against it, and is a breaking change of this pack.

This repository versions itself (see *Compatible runtime versions* below): a release is
stamped into each target's `banner.stg`, which every template calls, so every generated
file carries the stamp.

## Usage

A project declares what it generates in a `kibo.toml`, and
[kibo-project](https://github.com/digital-substrate/kibo-project) does the rest: it resolves
the features, renders each template, embeds the definitions and copies the runtime, as
`features.json` declares.

```bash
python3 ../kibo-project/kibo_project.py generate
```

Underneath, kibo renders one template, or a directory of them, per run. A project resolves
its features, then renders each template:

```bash
for stg in $(python3 -c "import resolve; print(*resolve.templates('cpp', ['Attachments']))"); do
    java -jar kibo-2.X.Y.jar -c cpp -n myapp -d MyApp.dsm.json -t "$stg" -o ./generated
done
```

`-n` names the generated infrastructure: the C++ namespace, the Python and TypeScript
package. A Python or TypeScript package also carries its runtime: copy `python/runtime/`
into it as `_codegen/` (`typescript/runtime/` into `src/_codegen/`). The model's definitions
are embedded beside it by the project — `resources.py`, `resources.ts`, `<ns>_resources.hpp`.

## What a generated package gives

Each target has its page — what the package holds, how to use it, what is shared and what
is copied:

- [`cpp/README.md`](cpp/README.md) — C++ value types over the Viper runtime, crossing to a
  `Value` through the generated codec. It is the base reference: the other targets offer
  what it offers, with its restrictions.
- [`python/README.md`](python/README.md) — a package over `dsviper`, following the runtime's
  reference semantics: a generated class is a box around a Viper value, with the API of the
  class it faces; `Cls.wrap_value(value)`, a constructor given a value, and `p.unwrap_value()`
  share it, and a copy is explicit.
- [`typescript/README.md`](typescript/README.md) — the same over `@digitalsubstrate/dsviper`,
  with `wrapValue` / `unwrapValue`, and how a project imports the runtime and type-checks.

Code written against the 1.2 output migrates as the CHANGELOG's *Migrating from 1.2* table
says.

## Third-party templates

This repo is for **first-party templates only** (DS-maintained). Third
parties writing their own templated features follow the same `.stg`
conventions but live in their own repos.

A project can add its features to the pack's selection: a manifest of the same shape as
`features.json`, whose templates sit beside it (`<manifest dir>/<language>/<template>`), and
whose features may require the pack's.

```
$ ./resolve.py cpp MyReport --with path/to/my-templates/features.json
```

In Python, `resolve.templates("cpp", ["MyReport"], extra=["path/to/my-templates/features.json"])`.
A feature name the pack already declares is refused.

Besides the features, `features.json` declares what a tool driving kibo needs to know of this
pack, so that it carries no knowledge of its own:

- `generator.kibo` — the oldest kibo exposing the Template Model these templates consume;
- `layout`, per target — where the templates render, which runtime is copied beside them, and
  how the definitions are embedded;
- `reserved`, per target and per family of names — the names this pack's code takes: the
  members every generated class inherits, which a field would mask, and the modules at the
  package's root, which a namespace or a pool would replace. A DSM name meeting one stops the
  generation, saying how to spell it otherwise for that target;
- `validation`, per target — the checks run once a target is written: Python imported, every
  structure built and `mypy --strict`; TypeScript `tsc --noEmit`. C++ needs none: its compiler
  refuses invalid code and says why.

[kibo-project](https://github.com/digital-substrate/kibo-project) reads all four. Why names
are refused rather than renamed: [`DESIGN.md`](DESIGN.md#a-name-the-target-cannot-take).

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE).

The templates themselves are open source. Each template, when processed
by Kibo against a user model, also emits a header comment in the
generated file that records this licensing posture (templates: MIT,
runtime: Commercial) so the licensing story remains visible to the
end user of the DevKit.

## Runtime dependency

Templates in this repository emit code that is **not standalone** — at
runtime it depends on:

- **`viper`** (C++ runtime, for `cpp/` templates) — proprietary,
  distributed under `LicenseRef-DigitalSubstrate-Commercial-1.2`.
- **`dsviper`** (Python runtime, for `python/` templates) — proprietary
  Python wheel published on PyPI under
  `LicenseRef-DigitalSubstrate-Commercial-1.2`. See
  [https://pypi.org/project/dsviper/](https://pypi.org/project/dsviper/).
- **`@digitalsubstrate/dsviper`** (Node binding, for `typescript/`
  templates) — proprietary npm package over the same Viper runtime,
  under `LicenseRef-DigitalSubstrate-Commercial-1.2`. See
  [https://www.npmjs.com/package/@digitalsubstrate/dsviper](https://www.npmjs.com/package/@digitalsubstrate/dsviper).

### Compatible runtime versions

This repository's version is its own — it is a product, and its number says nothing
about what it sits between. Those are declared, and every generated file carries the
same declarations in its header:

| | |
|---|---|
| **consumes** | Template Model 2, exposed by kibo |
| **cpp target** | the `viper` C++ runtime 1.2, with its static layer |
| **python target** | `dsviper` 1.2 (floor `>=1.2.29`) |
| **typescript target** | `@digitalsubstrate/dsviper` 1.2 (floor `>=1.2.14`) |

A release of this pack is driven by its **targets**: a projection appears because a
binding gained something to project. The Template Model it consumes moves on kibo's
own cadence and is a floor, not a co-version — that this pack is at `2.0.0` while it
consumes Template Model 2 is a **coincidence, not a rule**.

Nothing in the number warns that an upgrade breaks: this pack requires the
Template Model it declares, and a pack written against an earlier one does not
render. The CHANGELOG and the generator's render diagnostics carry that warning
— see kibo's `MIGRATING.md`.

The runtime is a separate axis. Its `MAJOR.MINOR` is the compatibility contract
— the on-disk format and public API are locked across a minor — and the `PATCH`
is versioned **independently per binding**, so the numbers differ between
targets:

| Templates    | Runtime                              | Compatible versions |
|--------------|--------------------------------------|---------------------|
| `typescript` | `@digitalsubstrate/dsviper` (npm)    | `>=1.2.14 <1.3.0`   |
| `python`     | `dsviper` (PyPI wheel)               | `>=1.2.29 <1.3`     |
| `cpp`        | `viper` (C++ runtime)                | `1.2`, with the static layer |

Every generated file names its runtime and that range in its header, so a
consumer holding generated code can answer the question without this table.
`python tools/bump_version.py --check` fails if the templates of one target
disagree on it.

A floor is set by what a template uses, and it lives in the generated output, where the
consumer's build reads it:

- **`python`**: the runtime tests `isinstance(value, dsviper.Value)` and reads with
  `Value.decode(..., encoded=False)`, which the wheel offers from `1.2.27`; a remote
  attachment function that only reads takes an `AttachmentGetting`, which the wheel
  accepts from `1.2.29`. The generated `pyproject.toml` declares it.
- **`typescript`**: the generated `package.json` declares `>=1.2.14 <1.3.0`, the binding
  whose remote attachment call accepts an `AttachmentGetting` and which decodes a written
  xarray from the list of its elements.
- **`cpp`**: the generated code crosses to a `Value`, and hashes, through the runtime's
  static layer — `Viper_StaticType`, `Viper_StaticWriter`, `Viper_StaticReader`,
  `Viper_StaticHash` — on viper's `LTS-1.2` branch, and calls a remote attachment function
  through a `ServiceRemote::call` that takes an `AttachmentGetting`. A C++ project builds
  the runtime from source, so it needs a checkout that carries both.

The MIT license above governs the **templates as source**. The output
of `kibo` produced from these templates is a derivative work of MIT
material and remains free of obligations beyond the standard MIT
notice; however, *executing* that output requires a runtime listed
above, and the runtime's own licence applies independently. Any
commercial deployment therefore requires a Commercial Licence from
Digital Substrate for the relevant runtime.
