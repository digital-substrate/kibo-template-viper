# The runtime of the kibo-template-viper 2.0.0 Python templates (MIT), copied into every
# generated package. Do not edit by hand.

from __future__ import annotations

import functools
import typing
from typing import Callable

import dsviper

from .proxy import Proxy, unwrap as _unwrap, wrap as _wrap


class AttachmentBase:
    """What every generated attachment shares, whatever its usage: its identity. The generated
    classes of `database_attachments` (a Database) and `commit_attachments` (a Commit state)
    declare the operations of their usage; the protected calls below are theirs."""

    def __init__(self, runtime_id: dsviper.ValueUUId, definitions: Callable[[], dsviper.DefinitionsConst]):
        self._runtime_id = runtime_id
        self._definitions = definitions

    @property
    def runtime_id(self) -> dsviper.ValueUUId:
        """The attachment's runtime id, a constant: it tells which attachment an id names
        without resolving the definitions."""
        return self._runtime_id

    @functools.cached_property
    def descriptor(self) -> dsviper.Attachment:
        """The attachment as the definitions declare it."""
        return self._definitions().check_attachment(self._runtime_id)

    def _keys(self, getting: dsviper.AttachmentGetting | dsviper.Database) -> typing.Any:
        return _wrap(getting.keys(self.descriptor))

    def _has(self, getting: dsviper.AttachmentGetting | dsviper.Database, key: Proxy[dsviper.ValueKey]) -> bool:
        return getting.has(self.descriptor, key.unwrap_value())

    def _get(self, getting: dsviper.AttachmentGetting | dsviper.Database, key: Proxy[dsviper.ValueKey]) -> typing.Any:
        return _wrap(getting.get(self.descriptor, key.unwrap_value()))

    def _enumerate(self, getting: dsviper.AttachmentGetting) -> typing.Any:
        return [(_wrap(key), _wrap(document) if isinstance(document, dsviper.Value) else document)
                for key, document in getting.enumerate(self.descriptor)]

    def _diff_keys(self, current: dsviper.AttachmentGetting, other: dsviper.AttachmentGetting) -> typing.Any:
        added, removed, different, same = dsviper.AttachmentGetting.diff_keys(current, other, self.descriptor)
        return _wrap(added), _wrap(removed), _wrap(different), _wrap(same)

    def _set_in_database(self, database: dsviper.Database, key: Proxy[dsviper.ValueKey], value: typing.Any) -> bool:
        return database.set(self.descriptor, key.unwrap_value(), _unwrap(value))

    def _delete(self, database: dsviper.Database, key: Proxy[dsviper.ValueKey]) -> bool:
        return database.delete(self.descriptor, key.unwrap_value())

    def _set_in_state(self, state: dsviper.CommitAttachmentMutating, key: Proxy[dsviper.ValueKey], value: typing.Any) -> None:
        state.set(self.descriptor, key.unwrap_value(), _unwrap(value))

    def _diff(self, state: dsviper.CommitAttachmentMutating, key: Proxy[dsviper.ValueKey], value: typing.Any, recursive: bool) -> None:
        state.diff(self.descriptor, key.unwrap_value(), _unwrap(value), recursive=recursive)

    def _update(self, state: dsviper.CommitAttachmentMutating, key: Proxy[dsviper.ValueKey], path: dsviper.PathConst | None, value: typing.Any) -> None:
        state.update(self.descriptor, key.unwrap_value(), _ROOT if path is None else path, _unwrap(value))

    def _union_in_set(self, state: dsviper.CommitAttachmentMutating, key: Proxy[dsviper.ValueKey], path: dsviper.PathConst | None, value: typing.Any) -> None:
        state.union_in_set(self.descriptor, key.unwrap_value(), _ROOT if path is None else path, _unwrap(value))

    def _subtract_in_set(self, state: dsviper.CommitAttachmentMutating, key: Proxy[dsviper.ValueKey], path: dsviper.PathConst | None, value: typing.Any) -> None:
        state.subtract_in_set(self.descriptor, key.unwrap_value(), _ROOT if path is None else path, _unwrap(value))

    def _union_in_map(self, state: dsviper.CommitAttachmentMutating, key: Proxy[dsviper.ValueKey], path: dsviper.PathConst | None, value: typing.Any) -> None:
        state.union_in_map(self.descriptor, key.unwrap_value(), _ROOT if path is None else path, _unwrap(value))

    def _subtract_in_map(self, state: dsviper.CommitAttachmentMutating, key: Proxy[dsviper.ValueKey], path: dsviper.PathConst | None, value: typing.Any) -> None:
        state.subtract_in_map(self.descriptor, key.unwrap_value(), _ROOT if path is None else path, _unwrap(value))

    def _update_in_map(self, state: dsviper.CommitAttachmentMutating, key: Proxy[dsviper.ValueKey], path: dsviper.PathConst | None, value: typing.Any) -> None:
        state.update_in_map(self.descriptor, key.unwrap_value(), _ROOT if path is None else path, _unwrap(value))

    def _insert_in_xarray(self, state: dsviper.CommitAttachmentMutating, key: Proxy[dsviper.ValueKey], path: dsviper.PathConst | None,
                          before_position: dsviper.ValueUUId, new_position: dsviper.ValueUUId,
                          value: typing.Any) -> None:
        state.insert_in_xarray(self.descriptor, key.unwrap_value(), _ROOT if path is None else path,
                               before_position, new_position, _unwrap(value))

    def _update_in_xarray(self, state: dsviper.CommitAttachmentMutating, key: Proxy[dsviper.ValueKey], path: dsviper.PathConst | None,
                          position: dsviper.ValueUUId, value: typing.Any) -> None:
        state.update_in_xarray(self.descriptor, key.unwrap_value(), _ROOT if path is None else path, position, _unwrap(value))

    def _remove_in_xarray(self, state: dsviper.CommitAttachmentMutating, key: Proxy[dsviper.ValueKey], path: dsviper.PathConst | None,
                          position: dsviper.ValueUUId) -> None:
        state.remove_in_xarray(self.descriptor, key.unwrap_value(), _ROOT if path is None else path, position)

    def __repr__(self) -> str:
        return f"{type(self).__name__}({self.descriptor.representation()})"


# The whole document: what an operation on a set, a map or an xarray document addresses.
_ROOT: dsviper.PathConst = dsviper.Path().const()
