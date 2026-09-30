# The runtime of the kibo-template-viper 2.0.0 Python templates (MIT), copied into every
# generated package. Do not edit by hand.

from __future__ import annotations

import typing

import dsviper

from .proxy import definitions_of as _definitions, unwrap, wrap

E = typing.TypeVar("E")
K = typing.TypeVar("K")


class View:
    __slots__ = ("_value",)

    _value: typing.Any

    def __init__(self, value):
        self._value = value

    @property
    def vpr_value(self):
        return self._value

    def _unwrap(self):
        return self._value

    def type(self):
        return self._value.type()

    def copy(self):
        return type(self)(self._value.copy())

    def encode(self, **kwargs):
        return dsviper.Value.encode(self._value, **kwargs)

    def hexdigest(self) -> str:
        return dsviper.Value.hexdigest(self._value)

    def __eq__(self, other) -> bool:
        other_value = other.vpr_value if isinstance(other, View) else other
        if not isinstance(other_value, dsviper.Value) and not isinstance(
                other_value, (list, tuple, set, dict)):
            return NotImplemented
        try:
            return bool(self._value == other_value)
        except (TypeError, ValueError, dsviper.ViperError):
            return False

    def __hash__(self) -> int:
        return self._value.hash()

    def __repr__(self) -> str:
        return repr(self._value)


class Sequence(View, typing.Generic[E]):
    __slots__ = ()

    def __len__(self) -> int:
        return len(self._value)

    def __iter__(self) -> typing.Iterator[typing.Any]:
        if hasattr(self._value, "__iter__"):
            return (wrap(element) for element in self._value)

        type_ = self._value.type()
        if hasattr(type_, "columns"):
            columns, rows = type_.columns(), type_.rows()
            return (tuple(wrap(self._value.at(column, row)) for row in range(rows))
                    for column in range(columns))
        return (wrap(self._value.at(index)) for index in range(len(self._value)))

    def __getitem__(self, index) -> E:
        if isinstance(index, tuple):
            return wrap(self._value.at(*index))
        return wrap(self._value[index])

    def __setitem__(self, index: int, element: E) -> None:
        self._value[index] = unwrap(element)

    def __contains__(self, element) -> bool:
        return unwrap(element) in self._value

    def at(self, *position) -> E:
        return wrap(self._value.at(*position))

    def append(self, element: E) -> None:
        if hasattr(self._value, "append"):
            self._value.append(unwrap(element))
        else:
            self._value.add(unwrap(element))

    def add(self, element: E) -> None:
        self.append(element)

    def insert(self, index: int, element: E) -> None:
        self._value.insert(index, unwrap(element))

    def extend(self, elements) -> None:
        for element in elements:
            self.append(element)

    def pop(self, *args) -> E:
        return wrap(self._value.pop(*args))

    def remove(self, element: E) -> None:
        self._value.remove(unwrap(element))

    def discard(self, element: E) -> None:
        self._value.discard(unwrap(element))

    def index(self, element: E):
        return self._value.index(unwrap(element))

    def count(self, element: E) -> int:
        return self._value.count(unwrap(element))

    def contains(self, element: E) -> bool:
        return self._value.contains(unwrap(element))

    def clear(self) -> None:
        self._value.clear()

    def empty(self) -> bool:
        return self._value.empty()

    def size(self) -> int:
        return len(self._value)

    def to_list(self) -> list[E]:
        return list(self)

    def to_tuple(self) -> tuple:
        return tuple(self)

    def __add__(self, other):
        return type(self)(self._value + unwrap(other))

    def __iadd__(self, other):
        self._value += unwrap(other)
        return self

    def __getattr__(self, name: str):
        if name.startswith("get_") and name[4:].isdigit():
            return lambda _i=int(name[4:]): self[_i]
        return _forward(self, name)

    def union(self, other):
        return type(self)(self._value.union(unwrap(other)))

    def intersection(self, other):
        return type(self)(self._value.intersection(unwrap(other)))

    def difference(self, other):
        return type(self)(self._value.difference(unwrap(other)))

    def update(self, other) -> None:
        self._value.update(unwrap(other))

    def __or__(self, other):
        return self.union(other)

    def __and__(self, other):
        return self.intersection(other)

    def __sub__(self, other):
        return self.difference(other)

    def __ior__(self, other):
        self._value.update(unwrap(other))
        return self

    def __iand__(self, other):
        self._value.intersection_update(unwrap(other))
        return self

    def __isub__(self, other):
        self._value.difference_update(unwrap(other))
        return self

    def symmetric_difference(self, other):
        return type(self)(self._value.symmetric_difference(unwrap(other)))

    def __xor__(self, other):
        return self.symmetric_difference(other)

    def __ixor__(self, other):
        if hasattr(self._value, "symmetric_difference_update"):
            self._value.symmetric_difference_update(unwrap(other))
            return self
        return type(self)(self._value.symmetric_difference(unwrap(other)))


class Mapping(View, typing.Generic[K, E]):
    __slots__ = ()

    def __len__(self) -> int:
        return len(self._value)

    def __iter__(self) -> typing.Iterator[K]:
        return (wrap(key) for key in self._value)

    def __getitem__(self, key: K) -> E:
        return wrap(self._value.at(unwrap(key)))

    def __setitem__(self, key: K, element: E) -> None:
        self._value.set(unwrap(key), unwrap(element))

    def __delitem__(self, key: K) -> None:
        del self._value[unwrap(key)]

    def __contains__(self, key: K) -> bool:
        return unwrap(key) in self._value

    def at(self, key: K) -> E:
        return wrap(self._value.at(unwrap(key)))

    def set(self, key: K, element: E) -> None:
        self._value.set(unwrap(key), unwrap(element))

    def get(self, key: K, default=None):
        return wrap(self._value.get(unwrap(key), unwrap(default))) if default is not None \
            else (wrap(self._value.at(unwrap(key))) if unwrap(key) in self._value else None)

    def setdefault(self, key: K, element: E) -> None:
        self._value.setdefault(unwrap(key), unwrap(element))

    def pop(self, key: K, *args) -> E:
        return wrap(self._value.pop(unwrap(key), *[unwrap(a) for a in args]))

    def remove(self, key: K) -> None:
        self._value.remove(unwrap(key))

    def discard(self, key: K) -> None:
        self._value.discard(unwrap(key))

    def contains(self, key: K) -> bool:
        return self._value.contains(unwrap(key))

    def update(self, other) -> None:
        self._value.update(unwrap(other))

    def clear(self) -> None:
        self._value.clear()

    def empty(self) -> bool:
        return self._value.empty()

    def size(self) -> int:
        return len(self._value)

    def __getattr__(self, name: str):
        return _forward(self, name)

    def keys(self) -> list[K]:
        return list(self)

    def values(self) -> list[E]:
        return [self[key] for key in self]

    def items(self) -> list[tuple[K, E]]:
        return [(key, self[key]) for key in self]


class Ordered(View, typing.Generic[E]):
    __slots__ = ()

    END = dsviper.ValueXArray.END

    @staticmethod
    def end() -> dsviper.ValueUUId:
        return dsviper.ValueXArray.END

    def __len__(self) -> int:
        return len(self._value)

    def __iter__(self) -> typing.Iterator[E]:
        return (wrap(element) for element in self._value)

    def __getitem__(self, key) -> E:
        return wrap(self._value[key])

    def __setitem__(self, key, element: E) -> None:
        self._value[key] = unwrap(element)

    def __delitem__(self, key) -> None:
        del self._value[key]

    def __contains__(self, element) -> bool:
        return unwrap(element) in self._value

    @staticmethod
    def create_position() -> dsviper.ValueUUId:
        return dsviper.ValueXArray.create_position()

    def positions(self) -> list[dsviper.ValueUUId]:
        return self._value.positions()

    def position(self, index: int):
        return self._value.position(index)

    def index(self, position: dsviper.ValueUUId):
        return self._value.index(position)

    def position_of(self, element):
        for position in self.positions():
            if self.at(position) == element:
                return position
        return None

    def has_position(self, position: dsviper.ValueUUId) -> bool:
        return self._value.has_position(position)

    def at(self, position: dsviper.ValueUUId):
        element = self._value.at(position)
        return None if element is None else wrap(element)

    def set(self, position: dsviper.ValueUUId, element: E) -> None:
        self._value.set(position, unwrap(element))

    def insert(self, before_position, element: E, new_position=None):
        return self._value.insert(before_position, unwrap(element), new_position) \
            if new_position is not None else self._value.insert(before_position, unwrap(element))

    def insert_position(self, before_position, new_position) -> None:
        self._value.insert_position(before_position, new_position)

    def append(self, element: E):
        return self._value.append(unwrap(element))

    def remove(self, position: dsviper.ValueUUId) -> None:
        self._value.remove(position)

    def items(self) -> list[tuple[dsviper.ValueUUId, E | None]]:
        return [(position, self.at(position)) for position in self.positions()
                if position != dsviper.ValueXArray.END]

    def __getattr__(self, name: str):
        return _forward(self, name)

    def to_vector(self):
        return sequence_of(self._value.to_vector().type)(self._value.to_vector())

    def empty(self) -> bool:
        return len(self._value) == 0

    def size(self) -> int:
        return len(self._value)


class Optional(View, typing.Generic[E]):
    __slots__ = ()

    def __bool__(self) -> bool:
        return not self.is_nil()

    def is_nil(self) -> bool:
        return self._value.is_nil()

    def unwrap(self) -> E:
        return wrap(self._value.unwrap())

    def wrap(self, element: E) -> None:
        self._value.wrap(unwrap(element))

    def get(self, default=None):
        if self.is_nil():
            return wrap(default) if default is not None else None
        return self.unwrap()

    def clear(self) -> None:
        self._value.clear()


class Variant(View, typing.Generic[E]):
    __slots__ = ()

    def unwrap(self) -> E:
        return wrap(self._value.unwrap())

    def wrap(self, element, type=None) -> None:
        self._value.wrap(unwrap(element), type) if type is not None \
            else self._value.wrap(unwrap(element))

    def __getattr__(self, name: str):
        for prefix in ("set_", "get_", "is_"):
            if not name.startswith(prefix):
                continue
            wanted = name[len(prefix):]
            for alternative in self._value.type().types():
                if _alternative_name(alternative) != wanted:
                    continue
                if prefix == "set_":
                    return lambda value, _t=alternative: self._value.wrap(unwrap(value), _t)
                if prefix == "get_":
                    def taken(_t=alternative):
                        held = self._value.unwrap(encoded=False)
                        if held.type() != _t:
                            raise ValueError(
                                f"the variant holds a {held.type().representation()}, "
                                f"not a {_t.representation()}")
                        return wrap(held)

                    return taken
                return lambda _t=alternative: self._value.unwrap(encoded=False).type() == _t

        known = ", ".join(_alternative_name(t) for t in self._value.type().types())
        raise AttributeError(f"'{name}' designates no alternative: {known}")


_BOUND: dict[tuple, type] = {}


def _bind(view, type_fn, cast):
    cached = _BOUND.get((view, type_fn().representation()))
    if cached is not None:
        return cached

    class Bound(view):
        __slots__ = ()

        @classmethod
        def type(cls):
            return type_fn()

        @classmethod
        def decode(cls, blob, **kwargs):
            return cls(dsviper.Value.decode(blob, type_fn(), _definitions(), **kwargs))

        def __init__(self, value: typing.Any = None):
            value = unwrap(value) if hasattr(value, "_unwrap") else value
            if isinstance(value, dsviper.Value) and value.type() == type_fn():
                View.__init__(self, value)
                return

            try:
                View.__init__(self, cast(dsviper.Value.create(type_fn(), unwrap(value))))
            except dsviper.ViperError as refusal:
                raise TypeError(
                    f"this value is not a {type_fn().representation()}") from refusal

    Bound.__name__ = Bound.__qualname__ = type_fn().representation()
    _BOUND[(view, type_fn().representation())] = Bound
    return Bound


def sequence_of(type_fn):
    return _bind(Sequence, type_fn, lambda v: v)


def mapping_of(type_fn):
    return _bind(Mapping, type_fn, dsviper.ValueMap.cast)


def ordered_of(type_fn):
    return _bind(Ordered, type_fn, dsviper.ValueXArray.cast)


def optional_of(type_fn):
    return _bind(Optional, type_fn, dsviper.ValueOptional.cast)


def variant_of(type_fn):
    return _bind(Variant, type_fn, dsviper.ValueVariant.cast)


def _alternative_name(type_) -> str:
    return type_.representation().replace("::", "_")


def _forward(view: View, name: str) -> typing.Any:
    inner: typing.Any = getattr(view.vpr_value, name, None)
    if inner is None:
        raise AttributeError(f"neither the view nor {view.vpr_value.type().representation()} has '{name}'")
    if not callable(inner):
        return wrap(inner)

    def forwarded(*args, **kwargs) -> typing.Any:
        result: typing.Any = inner(*[unwrap(a) for a in args], **kwargs)
        if isinstance(result, dsviper.Value):
            return type(view)(result) if result.type() == view.vpr_value.type() else wrap(result)
        if isinstance(result, tuple):
            return tuple(wrap(r) if isinstance(r, dsviper.Value) else r for r in result)
        return result

    return forwarded
