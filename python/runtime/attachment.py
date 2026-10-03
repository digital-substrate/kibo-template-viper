# The runtime of the kibo-template-viper 2.0.0 Python templates (MIT), copied into every
# generated package. Do not edit by hand.

from __future__ import annotations

import functools
import typing
from typing import Callable

import dsviper

from .container import Optional
from .proxy import Proxy, unwrap as _unwrap, wrap as _wrap


K = typing.TypeVar("K", bound=Proxy[dsviper.ValueKey])
D = typing.TypeVar("D")
KS = typing.TypeVar("KS")
DI = typing.TypeVar("DI")


class AttachmentProxy(typing.Generic[K, D, KS, DI]):

    def __init__(self, runtime_id: dsviper.ValueUUId,
                 definitions: Callable[[], dsviper.DefinitionsConst],
                 key: type, document: type | None):
        self._runtime_id = runtime_id
        self._definitions = definitions

        self._key = key
        self._document = document

    @property
    def runtime_id(self) -> dsviper.ValueUUId:
        """The attachment's runtime id, a constant: it tells which attachment an id names
        without resolving the definitions."""
        return self._runtime_id

    @functools.cached_property
    def descriptor(self) -> dsviper.Attachment:
        return self._definitions().check_attachment(self._runtime_id)


    def keys(self, getting: dsviper.AttachmentGetting | dsviper.Database) -> KS:
        return typing.cast("KS", _wrap(getting.keys(self.descriptor)))

    def has(self, getting: dsviper.AttachmentGetting | dsviper.Database, key: K) -> bool:
        return getting.has(self.descriptor, key.unwrap_value())

    def get(self, getting: dsviper.AttachmentGetting | dsviper.Database, key: K) -> Optional[D]:
        """Return the stored document as an optional. It is a copy: changing it does not
        change what is stored; write it back with `set`."""
        return typing.cast("Optional[D]", _wrap(getting.get(self.descriptor, key.unwrap_value())))

    def enumerate(self, getting: dsviper.AttachmentGetting | dsviper.Database) -> list[tuple[K, D]]:
        source = getting.attachment_getting() if isinstance(getting, dsviper.Database) else getting
        return typing.cast("list[tuple[K, D]]", [
            (_wrap(key), _wrap(document) if isinstance(document, dsviper.Value) else document)
            for key, document in source.enumerate(self.descriptor)])

    def diff_keys(self, current: dsviper.AttachmentGetting, other: dsviper.AttachmentGetting
                  ) -> tuple[KS, KS, KS, KS]:
        added, removed, different, same = dsviper.AttachmentGetting.diff_keys(
            current, other, self.descriptor)
        wrapped = [_wrap(group) for group in (added, removed, different, same)]
        return wrapped[0], wrapped[1], wrapped[2], wrapped[3]


    @typing.overload
    def set(self, mutating: dsviper.AttachmentMutating, key: K, value: DI) -> None: ...

    @typing.overload
    def set(self, mutating: dsviper.Database, key: K, value: DI) -> bool: ...

    def set(self, mutating: dsviper.AttachmentMutating | dsviper.Database, key: K, value: DI) -> bool | None:
        """Write the document; on a Database, True once written (a refusal raises), on an
        AttachmentMutating, None. The document is copied in: changing it afterwards does not
        reach what was written."""
        return mutating.set(self.descriptor, key.unwrap_value(), _unwrap(value))

    def delete(self, database: dsviper.Database, key: K) -> bool:
        return database.delete(self.descriptor, key.unwrap_value())

    def diff(self, mutating: dsviper.AttachmentMutating, key: K, value: DI, *, recursive: bool = False) -> None:
        mutating.diff(self.descriptor, key.unwrap_value(), _unwrap(value), recursive=recursive)


    def _update(self, mutating: dsviper.AttachmentMutating, key: Proxy[dsviper.ValueKey], field: str, value: typing.Any) -> None:
        mutating.update(self.descriptor, key.unwrap_value(), _path(field), _unwrap(value))

    def _union_in_set(self, mutating: dsviper.AttachmentMutating, key: Proxy[dsviper.ValueKey], field: str | None, value: typing.Any) -> None:
        mutating.union_in_set(self.descriptor, key.unwrap_value(), _path(field), _unwrap(value))

    def _subtract_in_set(self, mutating: dsviper.AttachmentMutating, key: Proxy[dsviper.ValueKey], field: str | None, value: typing.Any) -> None:
        mutating.subtract_in_set(self.descriptor, key.unwrap_value(), _path(field), _unwrap(value))

    def _union_in_map(self, mutating: dsviper.AttachmentMutating, key: Proxy[dsviper.ValueKey], field: str | None, value: typing.Any) -> None:
        mutating.union_in_map(self.descriptor, key.unwrap_value(), _path(field), _unwrap(value))

    def _subtract_in_map(self, mutating: dsviper.AttachmentMutating, key: Proxy[dsviper.ValueKey], field: str | None, value: typing.Any) -> None:
        mutating.subtract_in_map(self.descriptor, key.unwrap_value(), _path(field), _unwrap(value))

    def _update_in_map(self, mutating: dsviper.AttachmentMutating, key: Proxy[dsviper.ValueKey], field: str | None, value: typing.Any) -> None:
        mutating.update_in_map(self.descriptor, key.unwrap_value(), _path(field), _unwrap(value))

    def _insert_in_xarray(self, mutating: dsviper.AttachmentMutating, key: Proxy[dsviper.ValueKey], field: str | None,
                          before_position: dsviper.ValueUUId, new_position: dsviper.ValueUUId,
                          value: typing.Any) -> None:
        mutating.insert_in_xarray(self.descriptor, key.unwrap_value(), _path(field),
                                  before_position, new_position, _unwrap(value))

    def _update_in_xarray(self, mutating: dsviper.AttachmentMutating, key: Proxy[dsviper.ValueKey], field: str | None,
                          position: dsviper.ValueUUId, value: typing.Any) -> None:
        mutating.update_in_xarray(self.descriptor, key.unwrap_value(), _path(field), position, _unwrap(value))

    def _remove_in_xarray(self, mutating: dsviper.AttachmentMutating, key: Proxy[dsviper.ValueKey], field: str | None,
                          position: dsviper.ValueUUId) -> None:
        mutating.remove_in_xarray(self.descriptor, key.unwrap_value(), _path(field), position)

    def __repr__(self) -> str:
        return f"AttachmentProxy({self.descriptor.representation()})"


@functools.cache
def _path(field: str | None) -> dsviper.PathConst:
    return (dsviper.Path() if field is None else dsviper.Path.from_field(field)).const()
