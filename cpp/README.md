# cpp — flat templates, features declared in `../features.json`

A namespace here is a **file-name prefix**, not a directory: `ModelA_Data.hpp`. C++ already
has namespaces, so the generated code declares them; the file system carries only enough to
keep two same-named types in separate files.

Which templates a project renders is `../features.json`, resolved by `../resolve.py`. Nothing
about a feature is expressed by where a `.stg` sits.

## What the dependency measurement found

`requires` came from the `#include` graph of generated code, and two things fell out of it
that no reading had produced:

- **The interface graph is a clean DAG; every cycle is in the `.cpp`.** So
  `Data`/`Codec`/`Model`/`AnyConcept` are mutually dependent only at build time — but they
  are mutually dependent, so they are one feature, `Base`. There is no cut inside it.
- **`Attachments` depended on `Database`, backwards** -- `Attachments.cpp` included a
  `Db.hpp` of two one-line helpers, so a project that wanted attachments and no database could
  not have them. The helpers are now the bodies of the database overloads themselves, and the
  `Database` feature is gone: writing to a database is two overloads of an attachment, and
  the runtime provides everything they need.

## Tests of the generator

The templates that test the generator itself -- every type round-tripped through each codec,
every attachment through a database, every pool through the bridge -- live with the laboratory,
`devkit-codegen-test`, and are not part of the pack: no project selects them.

## JSON, XML and hashing are the runtime's

The codec generates the bridge between the C++ types and a `Value`, and nothing that composes
that bridge with a runtime transition: JSON, XML and a hexdigest are one call on what `encode`
returns.

`Pool` is the server side of a function pool, `PoolRemote` its client side
(`remote.hpp.stg`/`remote.cpp.stg`). Most projects do not expose their pools as a service, and a
client must not link the functions only a server implements -- the `service` site's client links
without them.
