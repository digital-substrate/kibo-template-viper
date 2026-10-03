# python — the package a model generates, over dsviper

The `python` templates render one package per model, over the
[`dsviper`](https://pypi.org/project/dsviper/) wheel (`>=1.2.29, <1.3`). This page says what a
developer finds in it. The examples use the laboratory's model (`devkit-codegen-test`, the
`features` site): a namespace `Demo`, a structure `StructureS`, a concept `ConceptA`.

## What the package holds

```
features/                 # the package, named by kibo's -n
    __init__.py           # definitions(), AnyConceptKey, AnyValue, Key, containers, the units
    containers.py         # one class per container shape the model uses: Vector_of_uint8, …
    demo/                 # one module per DSM namespace: Demo is demo
        data.py           # structures, enumerations, keys, and the runtime ids (STRUCTURE_S)
        attachments.py    # one class per concept, one attachment accessor per attachment
    tools/                # one subpackage per pool, rendered with the Pool feature
    _codegen/             # the runtime every generated package carries (see below)
```

A namespace is a module, so two namespaces may declare the same name: `core.Colour` and
`parts.Colour` stay apart. Names are kibo's snake_case: `docUInt8` is `doc_uint8`, `f_E` is
`f_e`, a name Python reserves takes a trailing underscore (`annotations_`). A project spells a
name its own way with `[names]` in its `kibo.toml`. A pool is imported by its path,
`import features.tools`: the entry module belongs to `Base` and cannot import what only the
`Pool` feature renders.

## The bridge, and what is shared

A generated class wraps one Viper value and holds nothing else; every write reaches the
runtime, so the runtime's fail-fast is inherited. The bindings follow Viper's reference
semantics:

```python
import dsviper
import features
from features import demo, containers
from features.demo import attachments

s = demo.StructureS(f_float=1.5, f_string="hello")   # fields by keyword
v = containers.Vector_of_uint8([1, 2, 3])
key = demo.ConceptAKey.create()

value = s.unwrap_value()                    # the Viper value, not a copy
same = demo.StructureS.wrap_value(value)    # over that value: a change shows in s
other = demo.StructureS(value)              # a constructor builds a new value, a copy
```

A field read is live and a field write keeps the object it is given. Copied instead: a set
element and a map key, a document crossing a database, and a value given to a constructor.
`copy()` gives an independent copy. A Viper feature — `Value.encode`, JSON, a hexdigest — is
called on `unwrap_value()`; `Cls.wrap_value(Value.decode(blob, Cls.type(),
features.definitions()))` reads one back.

## Storing documents

An attachment operation takes the store it acts on. A `Database` holds the current state:

```python
db = dsviper.Database.create_in_memory()
db.extend_definitions(features.definitions())      # the model, once
db.begin_transaction()
attachments.ConceptA.properties.set(db, key, demo.StructureV(f_string="stored"))
db.commit()
attachments.ConceptA.properties.get(db, key).unwrap().f_string   # "stored", a copy
```

A `CommitDatabase` keeps every commit; its writes, the field operations included, go
through a `CommitMutableState`, and are stored once it is committed:

```python
cdb = dsviper.CommitDatabase.create_in_memory()
cdb.extend_definitions(features.definitions())
state = dsviper.CommitMutableState(dsviper.CommitStateBuilder.initial_state(cdb))
attachments.ConceptA.properties.set(state.attachment_mutating(), key, demo.StructureV())
attachments.ConceptA.properties.set_f_string(state.attachment_mutating(), key, "edited")
cdb.commit_mutations("edit", state)
```

A `CommitStore` holds that thread for an application, with undo and redo.

## Errors

The package raises what a Python developer expects: `TypeError` for a value of the wrong
type, `KeyError` for a missing map key, `ValueError` for an unknown case name or a variant
read as an alternative it does not hold. What the runtime refuses raises `dsviper.ViperError`.

## The runtime

`_codegen/` — the proxy base, the container views, the attachment accessor — is copied into
every generated package from `runtime/`. It is this pack's, not `dsviper`'s, and it documents
itself: its docstrings are the reference for the bridge, the containers and the stores.
