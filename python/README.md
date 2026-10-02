# python — one package, rendered whole

A namespace is a **module**: `Core::Colour` is `<package>.core.Colour`. The path *is* the
namespace, which is why the generator owns the on-disk layout rather than the project script.

A generated class is a box around a `dsviper.Value` and holds nothing. Every write reaches
the runtime, so the runtime's fail-fast is inherited rather than re-implemented — and the
type annotations are what replaces the type the passage dissolves, for the reader and the
IDE, not as a second line of checking.

## The runtime

`_codegen/` (the proxy base, the container views, the attachment accessor) is copied into every
generated package from `runtime/`. It is the template pack's, not `dsviper`'s: a generated
class is a proxy over a `Value`, which is one exposition among others. The generated package requires
`dsviper >= 1.2.29, < 1.3`.
