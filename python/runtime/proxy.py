# The runtime of the kibo-template-viper 2.0.1 Python templates (MIT), copied into every
# generated package. Do not edit by hand.

from __future__ import annotations

import typing

import dsviper

V = typing.TypeVar("V", bound=dsviper.Value, covariant=True)
_P = typing.TypeVar("_P", bound="Proxy[typing.Any]")
T = typing.TypeVar("T")


def _adopt(cls: type[T], value: typing.Any) -> T:
    adopted = object.__new__(cls)
    adopted._value = value  # type: ignore[attr-defined]
    return adopted


class Proxy(typing.Generic[V]):
    """A box around one Viper value, with the API of the class it faces; `unwrap_value()`
    returns the value.

    It follows Viper's reference semantics. A field read hands back what the value
    holds: changing a nested structure or container read from a field changes this
    object. A field write keeps the object it is given: changing that object
    afterwards shows here too, and a constructor given a Viper value boxes it. Copied
    instead: a set element and a map key, and a document crossing a Database or a
    CommitDatabase, on set as on get. A copy is otherwise explicit: `copy()`, or
    `Cls(value.copy())`.
    """
    __slots__ = ("_value",)

    def __init__(self, value: typing.Any) -> None:
        self._value = value

    @classmethod
    def type(cls) -> dsviper.Type:
        raise NotImplementedError

    @classmethod
    def wrap_value(cls: typing.Type[_P], value: dsviper.Value) -> _P:
        """The generated object over a Viper value, which must be of exactly this type, without
        copying it: a change made through one shows in the other. A constructor boxes a Viper
        value the same way; copy it explicitly (`Cls(value.copy())`)."""
        if not isinstance(value, dsviper.Value) or value.type() != cls.type():
            raise TypeError(f"this value is not a {cls.type().representation()}")
        return _adopt(cls, value)

    def unwrap_value(self) -> V:
        """The Viper value this object wraps, not a copy."""
        return typing.cast(V, self._value)

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Proxy):
            return NotImplemented
        return bool(self._value == other._value)

    def __hash__(self) -> int:
        return typing.cast("int", self._value.hash())

    def copy(self: _P) -> _P:
        return _adopt(type(self), self._value.copy())

    def __lt__(self, other: Proxy[dsviper.Value]) -> bool:
        return typing.cast("bool", self._value < unwrap(other))

    def __le__(self, other: Proxy[dsviper.Value]) -> bool:
        return typing.cast("bool", self._value <= unwrap(other))

    def __gt__(self, other: Proxy[dsviper.Value]) -> bool:
        return typing.cast("bool", self._value > unwrap(other))

    def __ge__(self, other: Proxy[dsviper.Value]) -> bool:
        return typing.cast("bool", self._value >= unwrap(other))

    @classmethod
    def _wrap(cls: typing.Type[_P], value: typing.Any) -> _P:
        return cls.wrap_value(value)

    def _unwrap(self) -> V:
        return typing.cast(V, self._value)


class NotGiven:
    __slots__ = ()

    def __repr__(self) -> str:
        return "NOT_GIVEN"


NOT_GIVEN = NotGiven()

_CLASSES: dict[str, type] = {}

def register(classes: dict[dsviper.ValueUUId, type]) -> None:
    for runtime_id, cls in classes.items():
        _CLASSES[runtime_id.encoded()] = cls


def wrap(value: typing.Any) -> typing.Any:
    code = getattr(value, "type_code", None)
    if code is None:
        return value

    code = code()
    if code == "struct" or code == "enum":
        return _named(value.type())._wrap(value)

    if code == "key":
        type_key = value.type_key()
        if type_key.is_any_concept():
            return AnyConceptKey(value)
        return _named(type_key.element_type()).wrap_value(value)

    from .container import AnyValue, Fixed, Mapping, Matrix, Optional, Ordered, SetView, Variant, Vector, declared

    if code == "any":
        return AnyValue.wrap_value(value)

    cls = declared(value)
    if cls is not None:
        return cls.wrap_value(value)

    if code == "map":
        return Mapping(value)
    if code == "xarray":
        return Ordered(value)
    if code == "optional":
        return Optional(value)
    if code == "variant":
        return Variant(value)
    if code == "vector":
        return Vector(value)
    if code == "set":
        return SetView(value)
    if code in ("vec", "tuple"):
        return Fixed(value)
    if code == "mat":
        return Matrix(value)

    return value


def _named(type_: typing.Any) -> typing.Any:
    cls = _CLASSES.get(type_.runtime_id().encoded())
    if cls is None:
        raise TypeError(
            f"no generated class for {type_.representation()}: "
            f"the unit that declares it is not imported")
    return cls


def is_known(value: typing.Any) -> bool:
    return value.type_concept().runtime_id().encoded() in _CLASSES


def unwrap(value: typing.Any) -> typing.Any:
    if hasattr(value, "_unwrap"):
        return value._unwrap()
    if _holds_generated(value):
        raise TypeError("a native container of generated values: build its declared class instead, "
                        "containers.<Kind>_of_<Element>(values), which checks each element where it is built")
    return value


def _holds_generated(value: object) -> bool:
    if isinstance(value, dict):
        return any(_holds_generated(k) or _holds_generated(v) for k, v in value.items())
    if isinstance(value, (list, tuple, set, frozenset)):
        return any(_holds_generated(element) for element in value)
    return hasattr(value, "_unwrap")


class Key(Proxy[dsviper.ValueKey]):
    """A key of a concept or a club. The keys of one instance are equal and hash alike whatever
    the view - the key itself, its parent's, its club's, the any-concept key - so a native set
    or dict holds the instance once. A declared container (Set_of_..., Map_of_...) holds keys of
    exactly its own type: convert one first, with to_parent_key() or from_any_concept_key()."""
    __slots__ = ()

    _value: dsviper.ValueKey

    def _held(self) -> str:
        concept = self._value.type_concept()
        if concept.runtime_id() == self._value.type_key().element_type().runtime_id():
            return ""
        return f"({concept.representation()}Key)"


class AnyConceptKey(Key):
    __slots__ = ()

    def __init__(self, key: Proxy[dsviper.ValueKey] | dsviper.ValueKey):
        value = key._value if isinstance(key, Proxy) else key
        if not isinstance(value, dsviper.ValueKey):
            raise TypeError(f"{key!r} is not a key")
        super().__init__(value.to_any_concept_key())

    @classmethod
    def type(cls) -> dsviper.Type:
        return dsviper.TypeKey(dsviper.TypeAnyConcept())

    @classmethod
    def from_any_concept_key(cls, key: Proxy[dsviper.ValueKey] | dsviper.ValueKey) -> AnyConceptKey:
        return cls(key)

    def instance_id(self) -> dsviper.ValueUUId:
        return self._value.instance_id()

    def runtime_id(self) -> dsviper.ValueUUId:
        return self._value.type_concept().runtime_id()

    def is_valid(self) -> bool:
        return self._value.instance_id().is_valid()

    def description(self) -> str:
        return (f"{self._value.instance_id().encoded()}:AnyConceptKey"
                f"({self._value.type_concept().representation()}Key)")

    def is_known(self) -> bool:
        return is_known(self._value)

    def __repr__(self) -> str:
        return self.description()
