# The runtime of the kibo-template-viper 2.0.0 Python templates (MIT), copied into every
# generated package. Do not edit by hand.

from __future__ import annotations

import typing

import dsviper

from .proxy import unwrap, wrap

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

    def __iter__(self) -> typing.Iterator[E]:
        return (wrap(element) for element in self._value)

    def __getitem__(self, index: int) -> E:
        return wrap(self._value[index])

    def __contains__(self, element: object) -> bool:
        return _unwrap_deep(element) in self._value

    def at(self, index: int) -> E:
        return wrap(self._value.at(index))

    def contains(self, element: E) -> bool:
        return _unwrap_deep(element) in self._value

    def empty(self) -> bool:
        return len(self._value) == 0

    def size(self) -> int:
        return len(self._value)

    def to_list(self) -> list[E]:
        return list(self)

    def to_tuple(self) -> tuple[E, ...]:
        return tuple(self)


class Vector(Sequence[E]):
    __slots__ = ()

    def __setitem__(self, index: int, element: E) -> None:
        self._value[index] = unwrap(element)

    def __delitem__(self, index: int) -> None:
        del self._value[index]

    def set(self, index: int, element: E) -> None:
        self._value.set(index, unwrap(element))

    def append(self, element: E) -> None:
        self._value.append(unwrap(element))

    def insert(self, index: int, element: E) -> None:
        self._value.insert(index, unwrap(element))

    def extend(self, elements: typing.Iterable[E]) -> None:
        for element in elements:
            self._value.append(unwrap(element))

    def pop(self, index: int = -1) -> E:
        return wrap(self._value.pop(index))

    def remove(self, element: E) -> None:
        self._value.remove(unwrap(element))

    def clear(self) -> None:
        self._value.clear()

    def count(self, element: E) -> int:
        return self._value.count(unwrap(element))

    def index(self, element: E) -> int:
        return self._value.index(unwrap(element))

    def exchange(self, first: int, second: int) -> None:
        self._value.exchange(first, second)

    def front(self) -> E:
        return wrap(self._value.front())

    def back(self) -> E:
        return wrap(self._value.back())

    def __add__(self, other: Vector[E] | typing.Iterable[E]) -> typing.Self:
        return type(self)(self._value + _unwrap_deep(other))

    def __iadd__(self, other: Vector[E] | typing.Iterable[E]) -> typing.Self:
        self._value += _unwrap_deep(other)
        return self


class SetView(Sequence[E]):
    __slots__ = ()

    def add(self, element: E) -> None:
        self._value.add(unwrap(element))

    def remove(self, element: E) -> None:
        self._value.remove(unwrap(element))

    def discard(self, element: E) -> None:
        self._value.discard(unwrap(element))

    def pop(self) -> E:
        return wrap(self._value.pop())

    def pop_max(self) -> E:
        return wrap(self._value.pop_max())

    def clear(self) -> None:
        self._value.clear()

    def min(self) -> E:
        return wrap(self._value.min())

    def max(self) -> E:
        return wrap(self._value.max())

    def extend(self, elements: typing.Iterable[E]) -> None:
        for element in elements:
            self._value.add(unwrap(element))

    def union(self, other: SetView[E] | typing.Iterable[E]) -> typing.Self:
        return type(self)(self._value.union(_unwrap_deep(other)))

    def intersection(self, other: SetView[E] | typing.Iterable[E]) -> typing.Self:
        return type(self)(self._value.intersection(_unwrap_deep(other)))

    def difference(self, other: SetView[E] | typing.Iterable[E]) -> typing.Self:
        return type(self)(self._value.difference(_unwrap_deep(other)))

    def symmetric_difference(self, other: SetView[E] | typing.Iterable[E]) -> typing.Self:
        return type(self)(self._value.symmetric_difference(_unwrap_deep(other)))

    def update(self, other: SetView[E] | typing.Iterable[E]) -> None:
        self._value.update(_unwrap_deep(other))

    def intersection_update(self, other: SetView[E] | typing.Iterable[E]) -> None:
        self._value.intersection_update(_unwrap_deep(other))

    def difference_update(self, other: SetView[E] | typing.Iterable[E]) -> None:
        self._value.difference_update(_unwrap_deep(other))

    def symmetric_difference_update(self, other: SetView[E] | typing.Iterable[E]) -> None:
        self._value.symmetric_difference_update(_unwrap_deep(other))

    def issubset(self, other: SetView[E] | typing.Iterable[E]) -> bool:
        return self._value.issubset(_unwrap_deep(other))

    def issuperset(self, other: SetView[E] | typing.Iterable[E]) -> bool:
        return self._value.issuperset(_unwrap_deep(other))

    def isdisjoint(self, other: SetView[E] | typing.Iterable[E]) -> bool:
        return self._value.isdisjoint(_unwrap_deep(other))

    def __or__(self, other: SetView[E] | typing.Iterable[E]) -> typing.Self:
        return self.union(other)

    def __and__(self, other: SetView[E] | typing.Iterable[E]) -> typing.Self:
        return self.intersection(other)

    def __sub__(self, other: SetView[E] | typing.Iterable[E]) -> typing.Self:
        return self.difference(other)

    def __xor__(self, other: SetView[E] | typing.Iterable[E]) -> typing.Self:
        return self.symmetric_difference(other)

    def __ior__(self, other: SetView[E] | typing.Iterable[E]) -> typing.Self:
        self.update(other)
        return self

    def __iand__(self, other: SetView[E] | typing.Iterable[E]) -> typing.Self:
        self.intersection_update(other)
        return self

    def __isub__(self, other: SetView[E] | typing.Iterable[E]) -> typing.Self:
        self.difference_update(other)
        return self

    def __ixor__(self, other: SetView[E] | typing.Iterable[E]) -> typing.Self:
        self.symmetric_difference_update(other)
        return self


class Fixed(Sequence[E]):
    __slots__ = ()

    def __setitem__(self, index: int, element: E) -> None:
        self._value.set(index, unwrap(element))

    def set(self, index: int, element: E) -> None:
        self._value.set(index, unwrap(element))


class Matrix(View, typing.Generic[E]):
    __slots__ = ()

    def __len__(self) -> int:
        return len(self._value)

    def __iter__(self) -> typing.Iterator[tuple[E, ...]]:
        return (self.column(index) for index in range(self.columns()))

    @typing.overload
    def __getitem__(self, position: int) -> tuple[E, ...]: ...

    @typing.overload
    def __getitem__(self, position: tuple[int, int]) -> E: ...

    def __getitem__(self, position):
        if isinstance(position, tuple):
            return wrap(self._value.at(*position))
        return self.column(position)

    @typing.overload
    def __setitem__(self, position: int, element: typing.Sequence[E]) -> None: ...

    @typing.overload
    def __setitem__(self, position: tuple[int, int], element: E) -> None: ...

    def __setitem__(self, position, element) -> None:
        if isinstance(position, tuple):
            self._value.set(position[0], position[1], unwrap(element))
            return
        for row, held in enumerate(element):
            self._value.set(position, row, unwrap(held))

    def columns(self) -> int:
        return self._value.columns()

    def rows(self) -> int:
        return self._value.rows()

    def at(self, column: int, row: int) -> E:
        return wrap(self._value.at(column, row))

    def set(self, column: int, row: int, element: E) -> None:
        self._value.set(column, row, unwrap(element))

    def column(self, index: int) -> tuple[E, ...]:
        return tuple(wrap(self._value.at(index, row)) for row in range(self.rows()))

    def size(self) -> int:
        return len(self._value)

    def to_tuple(self) -> tuple[tuple[E, ...], ...]:
        return tuple(self)


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

    def setdefault(self, key: K, element: E) -> E:
        return wrap(self._value.setdefault(unwrap(key), unwrap(element)))

    def pop(self, key: K, *args) -> E:
        return wrap(self._value.pop(unwrap(key), *[unwrap(a) for a in args]))

    def remove(self, key: K) -> None:
        self._value.remove(unwrap(key))

    def discard(self, key: K) -> None:
        self._value.discard(unwrap(key))

    def contains(self, key: K) -> bool:
        return self._value.contains(unwrap(key))

    def update(self, other: Mapping[K, E] | dict[K, E]) -> None:
        self._value.update(_unwrap_deep(other))

    def clear(self) -> None:
        self._value.clear()

    def empty(self) -> bool:
        return self._value.empty()

    def size(self) -> int:
        return len(self._value)

    def popitem(self) -> tuple[K, E]:
        key, element = self._value.popitem()
        return wrap(key), wrap(element)

    def min(self) -> K:
        return wrap(self._value.min())

    def max(self) -> K:
        return wrap(self._value.max())

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

    def items(self) -> list[tuple[dsviper.ValueUUId, E]]:
        return [(position, wrap(element)) for position, element in self._value.items()]

    def disable_position(self, position: dsviper.ValueUUId) -> None:
        self._value.disable_position(position)

    def extend(self, elements: typing.Iterable[E]) -> None:
        for element in elements:
            self._value.append(unwrap(element))

    def contains(self, element: E) -> bool:
        return _unwrap_deep(element) in self._value

    def to_vector(self) -> Vector[E]:
        return wrap(self._value.to_vector())

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

    def get(self, default: E | None = None) -> E | None:
        return default if self.is_nil() else self.unwrap()

    def clear(self) -> None:
        self._value.clear()


class Variant(View, typing.Generic[E]):
    __slots__ = ()

    def unwrap(self) -> E:
        return wrap(self._value.unwrap())

    def wrap(self, element, type=None) -> None:
        self._value.wrap(unwrap(element), type) if type is not None \
            else self._value.wrap(unwrap(element))

    def _holds(self, alternative: dsviper.Type) -> bool:
        return self._value.unwrap(encoded=False).type() == alternative

    def _get(self, alternative: dsviper.Type) -> typing.Any:
        if not self._holds(alternative):
            held = self._value.unwrap(encoded=False).type()
            raise ValueError(f"the variant holds a {held.representation()}, "
                             f"not a {alternative.representation()}")
        return wrap(self._value.unwrap())

    def _set(self, alternative: dsviper.Type, element) -> None:
        self._value.wrap(unwrap(element), alternative)


class AnyValue(View):
    __slots__ = ()

    def __bool__(self) -> bool:
        return not self._value.is_nil()

    def is_nil(self) -> bool:
        return self._value.is_nil()

    def unwrap(self) -> typing.Any:
        return wrap(self._value.unwrap())

    def wrap(self, element: typing.Any) -> None:
        self._value.wrap(unwrap(element))

    def clear(self) -> None:
        self._value.clear()


_CASTS: dict[type, typing.Callable[[typing.Any], typing.Any]] = {
    Vector: dsviper.ValueVector.cast,
    SetView: dsviper.ValueSet.cast,
    Fixed: lambda value: value,
    Matrix: dsviper.ValueMat.cast,
    Mapping: dsviper.ValueMap.cast,
    Ordered: dsviper.ValueXArray.cast,
    Optional: dsviper.ValueOptional.cast,
    Variant: dsviper.ValueVariant.cast,
}

_DECLARED: dict[str, type] = {}


def _unwrap_deep(value):
    if hasattr(value, "_unwrap"):
        return value._unwrap()
    if isinstance(value, dict):
        return {_unwrap_deep(k): _unwrap_deep(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_unwrap_deep(element) for element in value]
    if isinstance(value, (set, frozenset)):
        return [_unwrap_deep(element) for element in value]
    return value


class Declared:
    __slots__ = ()

    @classmethod
    def type(cls) -> typing.Any:
        raise NotImplementedError

    def __init__(self, value: typing.Any = None) -> None:
        if isinstance(value, View):
            value = value.vpr_value
        expected = type(self).type()
        if isinstance(value, dsviper.Value) and value.type() == expected:
            View.__init__(typing.cast(View, self), value)
            return
        view = next(base for base in type(self).__mro__ if base in _CASTS)
        try:
            built = _CASTS[view](dsviper.Value.create(expected, _unwrap_deep(value)))
        except dsviper.ViperError as refusal:
            raise TypeError(f"this value is not a {expected.representation()}") from refusal
        View.__init__(typing.cast(View, self), built)


def declare(*classes: typing.Any) -> None:
    for cls in classes:
        _DECLARED[cls.type().representation()] = cls


def declared(value: typing.Any) -> typing.Any:
    return _DECLARED.get(value.type().representation())
