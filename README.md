# kibo-template-viper

First-party templated features targeting the Viper ecosystem
(Viper C++ runtime + [dsviper](https://docs.digitalsubstrate.io/dsviper/)
Python binding). Consumed by [Kibo](https://docs.digitalsubstrate.io/kibo/) to
generate the static API surface that lets C++ and Python developers
work against typed wrappers instead of stringly-typed metadata.

## Documentation

Full documentation: https://docs.digitalsubstrate.io/kibo-template-viper/

Part of the [DevKit ecosystem](https://docs.digitalsubstrate.io/).

## Layout

```
cpp/                     # C++ surface templates targeting Viper C++ API
   Data/                 # struct, enum, concept, club implementations
   Database/             # SQLite persistence
   Stream/, Json/        # codecs
   ValueCodec, ValueType, ValueHasher
   Attachments/, AttachmentFunctionPool/, FunctionPool/
   Test/, TestApp/, Fuzz/

python/                  # Python surface templates targeting dsviper API
   package/              # the importable Python package generated for a model
```

For the conceptual ground (templated feature, Template Model, the role
of Kibo), see the user-facing docs:

- `devkit-doc/source/kibo/usage.md`
- `devkit-doc/source/kibo/templates.md`
- `devkit-doc/source/kibo/template_model.md`

## Public contract

These templates are surface templates: each one is a static projection
of one Viper runtime feature (Database, Codec, Stream, Attachments, …).
They are part of the Viper public API by another name — modifying
`cpp/Database` is no more anodyne than modifying
`viper/src/Viper/Viper_Database.hpp`.

Versioning follows the Viper C++ API and dsviper Python API public-
contract lines: any breaking change to a `cpp/` template tracks the
corresponding C++ API bump; same for `python/` against dsviper.

## Usage

Templates here are consumed by Kibo, which produces the generated code:

```bash
java -jar kibo-X.Y.Z.jar \
    -c cpp \
    -n MyApp \
    -d MyApp.dsm.json \
    -t /path/to/this/repo/cpp/Database \
    -o ./generated
```

In practice, `dsm_util.py` and the various `generate.py` scripts
resolve this path automatically via the sibling-checkout convention
or via the `KIBO_TEMPLATES` environment variable.

## Third-party templates

This repo is for **first-party templates only** (DS-maintained). Third
parties writing their own templated features follow the same `.stg`
conventions but live in their own repos.

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

The MIT license above governs the **templates as source**. The output
of `kibo` produced from these templates is a derivative work of MIT
material and remains free of obligations beyond the standard MIT
notice; however, *executing* that output requires a runtime listed
above, and the runtime's own licence applies independently. Any
commercial deployment therefore requires a Commercial Licence from
Digital Substrate for the relevant runtime.
