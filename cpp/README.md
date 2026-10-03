# cpp — the code a model generates, over the Viper C++ runtime

The `cpp` templates render C++17 over the `viper` C++ runtime and its static layer
(`Viper_StaticType`, `Viper_StaticWriter`, `Viper_StaticReader`, `Viper_StaticHash`, on its
`LTS-1.2` branch). The generated C++ is the base reference of this pack: the Python and
TypeScript packages offer what it offers, with its restrictions. The examples use the
laboratory's model (`devkit-codegen-test`, the `features` site).

## What is generated

A namespace is a file-name prefix and a C++ namespace: `Demo` in the infrastructure
`features` gives `features_demo_data.hpp` and `features::demo`. Which files a project renders
is `../features.json`, resolved by `../resolve.py`:

| feature | files | what it holds |
|---|---|---|
| `Base` | `<ns>_<unit>_data`, `_model`, `_codec`, `<ns>_codec`, `<ns>_any_concept`, `<ns>_resources` | structures, enumerations, keys; their identity in the definitions; the bridge to a `Value` |
| `Fields` | `<ns>_<unit>_fields` | every field's name and path, for code that goes through the dynamic API |
| `Attachments` | `<ns>_<unit>_attachments` | one scope per attachment, its operations |
| `Pool` | `<ns>_<pool>_pool` | the functions an application implements, and the pool it exposes |
| `PoolRemote` | `<ns>_<pool>_remote` | the same pool, called through a service |

## Value semantics

The C++ types are values: a structure is a `struct` with a default constructor and one
taking every field, a key is a `final` class (`create()` mints one, `ConceptAKey()` is the
invalid key), and copying copies. They cross to a Viper `Value` through the codec, which
copies too:

```cpp
#include "features_codec.hpp"        // the bridge, for every namespace of the model
#include "features_demo_attachments.hpp"
#include "Viper_Database.hpp"

using namespace features;

demo::StructureS s(1.5, "hello");
auto const value{codec::encode(s)};                        // a Viper::ValueStructure
auto const back{codec::decode<demo::StructureS>(value)};   // equal to s
auto const h{std::hash<demo::StructureS>{}(s)};            // Viper::StaticHash underneath

auto const key{demo::ConceptAKey::create()};
auto const db{Viper::Database::createInMemory()};
db->extendDefinitions(codec::definitions());
db->beginTransaction(Viper::DatabaseTransactionMode::Deferred);
demo::attachments::ConceptA::properties::set(db, key, demo::StructureV{});
db->commit();
```

A key widens to its parent's by an implicit conversion or `toParentKey()`, and narrows with
`Child::from(anyConceptKey)` — or `parent.asChildKey()` for a child declared in the parent's
namespace, which a parent can name; every key gives `toAny()` / `toAnyConceptKey()`. JSON, XML and a hexdigest are one runtime call on what `encode` returns;
the pack generates the bridge, not what composes it with a runtime feature.

## Attachments and pools

An attachment is a scope, `<ns>::<unit>::attachments::<Concept>::<attachment>`: `get`,
`has`, `keys` take any `AttachmentGetting` (a `Viper::Database` is one); `set`, `diff` and
the field operations (`setName`, `unionVertexKeys`, …) take an `AttachmentMutating`; `set`
and `del` also take a `Viper::Database`, inside a transaction.

A pool is a namespace, `<ns>::<pool>`: the application implements its functions there,
`pool()` returns the `Viper::FunctionPool` it exposes, and `poolName` / `poolId` name it.
`Remote` calls the same pool through a `Viper::ServiceRemote`; most projects do not expose
their pools as a service, and a client links without the functions only a server implements.

## Tests of the generator

The templates that test the generator itself — every type round-tripped through the codec,
every attachment through a database, every pool through the bridge — live with the
laboratory, `devkit-codegen-test`, and are not part of the pack.
