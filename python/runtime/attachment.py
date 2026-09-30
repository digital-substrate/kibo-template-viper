# The runtime of the kibo-template-viper 2.0.0 Python templates (MIT), copied into every
# generated package. Do not edit by hand.

from __future__ import annotations

import functools
import typing
from typing import Callable

import dsviper

from .proxy import Proxy, unwrap as _unwrap, wrap as _wrap


K = typing.TypeVar("K", bound=Proxy)
D = typing.TypeVar("D")
KS = typing.TypeVar("KS")


class AttachmentProxy(typing.Generic[K, D, KS]):

    def __init__(self, runtime_id: dsviper.ValueUUId,
                 definitions: Callable[[], dsviper.DefinitionsConst],
                 key: type, document: type | None):
        self._runtime_id = runtime_id
        self._definitions = definitions

        self._key = key
        self._document = document

    @functools.cached_property
    def descriptor(self) -> dsviper.Attachment:
        return self._definitions().check_attachment(self._runtime_id)


    def keys(self, getting: dsviper.AttachmentGetting) -> KS:
        return _wrap(getting.keys(self.descriptor))

    def has(self, getting: dsviper.AttachmentGetting, key: K) -> bool:
        return getting.has(self.descriptor, key.vpr_value)

    def get(self, getting: dsviper.AttachmentGetting, key: K) -> D | None:
        document = getting.get(self.descriptor, key.vpr_value)
        return None if document.is_nil() else _wrap(document.unwrap())

    def enumerate(self, getting, *, encoded: bool = True) -> list[tuple[K, D]]:
        source = getting if hasattr(getting, "enumerate") else getting.attachment_getting()
        return [(_wrap(key), _wrap(document) if isinstance(document, dsviper.Value) else document)
                for key, document in source.enumerate(self.descriptor, encoded=encoded)]

    def diff_keys(self, current: dsviper.AttachmentGetting, other: dsviper.AttachmentGetting
                  ) -> tuple[KS, KS, KS, KS]:
        added, removed, different, same = dsviper.AttachmentGetting.diff_keys(
            current, other, self.descriptor)
        wrapped = [_wrap(group) for group in (added, removed, different, same)]
        return wrapped[0], wrapped[1], wrapped[2], wrapped[3]


    def set(self, mutating: dsviper.AttachmentMutating | dsviper.Database, key: K, value: D):
        return mutating.set(self.descriptor, key.vpr_value, _unwrap(value))

    def delete(self, database: dsviper.Database, key: K) -> bool:
        return database.delete(self.descriptor, key.vpr_value)

    def diff(self, mutating: dsviper.AttachmentMutating, key: K, value: D, *, recursive: bool = False) -> None:
        mutating.diff(self.descriptor, key.vpr_value, _unwrap(value), recursive=recursive)


    def _update(self, mutating: dsviper.AttachmentMutating, key, field: str, value) -> None:
        mutating.update(self.descriptor, key.vpr_value, _path(field), _unwrap(value))

    def _union_in_set(self, mutating: dsviper.AttachmentMutating, key, field: str | None, value) -> None:
        mutating.union_in_set(self.descriptor, key.vpr_value, _path(field), _unwrap(value))

    def _subtract_in_set(self, mutating: dsviper.AttachmentMutating, key, field: str | None, value) -> None:
        mutating.subtract_in_set(self.descriptor, key.vpr_value, _path(field), _unwrap(value))

    def _union_in_map(self, mutating: dsviper.AttachmentMutating, key, field: str | None, value) -> None:
        mutating.union_in_map(self.descriptor, key.vpr_value, _path(field), _unwrap(value))

    def _subtract_in_map(self, mutating: dsviper.AttachmentMutating, key, field: str | None, value) -> None:
        mutating.subtract_in_map(self.descriptor, key.vpr_value, _path(field), _unwrap(value))

    def _update_in_map(self, mutating: dsviper.AttachmentMutating, key, field: str | None, value) -> None:
        mutating.update_in_map(self.descriptor, key.vpr_value, _path(field), _unwrap(value))

    def _insert_in_xarray(self, mutating: dsviper.AttachmentMutating, key, field: str | None,
                          before_position: dsviper.ValueUUId, new_position: dsviper.ValueUUId,
                          value) -> None:
        mutating.insert_in_xarray(self.descriptor, key.vpr_value, _path(field),
                                  before_position, new_position, _unwrap(value))

    def _update_in_xarray(self, mutating: dsviper.AttachmentMutating, key, field: str | None,
                          position: dsviper.ValueUUId, value) -> None:
        mutating.update_in_xarray(self.descriptor, key.vpr_value, _path(field), position, _unwrap(value))

    def _remove_in_xarray(self, mutating: dsviper.AttachmentMutating, key, field: str | None,
                          position: dsviper.ValueUUId) -> None:
        mutating.remove_in_xarray(self.descriptor, key.vpr_value, _path(field), position)

    def __repr__(self) -> str:
        return f"AttachmentProxy({self.descriptor.representation()})"


@functools.cache
def _path(field: str | None) -> dsviper.PathConst:
    return (dsviper.Path() if field is None else dsviper.Path.from_field(field)).const()
