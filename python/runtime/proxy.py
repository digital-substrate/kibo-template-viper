# The runtime of the kibo-template-viper 2.0.0 Python templates (MIT), copied into every
# generated package. Do not edit by hand.

from __future__ import annotations

import typing

import dsviper


class Proxy:
    __slots__ = ("_value",)

    def __init__(self, value):
        self._value = value

    @property
    def vpr_value(self):
        return self._value

    def __eq__(self, other) -> bool:
        if not isinstance(other, Proxy):
            return NotImplemented
        return bool(self._value == other._value)

    def __hash__(self) -> int:
        return self._value.hash()

    def encode(self, **kwargs) -> dsviper.ValueBlob:
        return dsviper.Value.encode(self._value, **kwargs)

    def copy(self):
        return type(self)(self._value.copy())

    def __lt__(self, other) -> bool:
        return self._value < unwrap(other)

    def __le__(self, other) -> bool:
        return self._value <= unwrap(other)

    def __gt__(self, other) -> bool:
        return self._value > unwrap(other)

    def __ge__(self, other) -> bool:
        return self._value >= unwrap(other)

    def hexdigest(self) -> str:
        return dsviper.Value.hexdigest(self._value)


    @classmethod
    def _wrap(cls, value) -> typing.Self:
        return cls(value)

    def _unwrap(self):
        return self._value


class NotGiven:
    __slots__ = ()

    def __repr__(self) -> str:
        return "NOT_GIVEN"


NOT_GIVEN = NotGiven()

_CLASSES: dict[str, type] = {}

_DEFINITIONS = None


def set_definitions(definitions) -> None:
    global _DEFINITIONS
    _DEFINITIONS = definitions


def definitions_of():
    if _DEFINITIONS is None:
        raise RuntimeError("the package has not declared its definitions")
    return _DEFINITIONS()


def register(classes: dict) -> None:
    for runtime_id, cls in classes.items():
        _CLASSES[runtime_id.encoded()] = cls


def wrap(value) -> typing.Any:
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
        return _named(type_key.element_type())(value)

    from .container import AnyValue, Mapping, Optional, Ordered, Sequence, Variant, declared

    if code == "any":
        return AnyValue(value)

    cls = declared(value)
    if cls is not None:
        return cls(value)

    if code == "map":
        return Mapping(value)
    if code == "xarray":
        return Ordered(value)
    if code == "optional":
        return Optional(value)
    if code == "variant":
        return Variant(value)
    if code in ("vector", "set", "vec", "mat", "tuple"):
        return Sequence(value)

    return value


def _named(type_):
    cls = _CLASSES.get(type_.runtime_id().encoded())
    if cls is None:
        raise TypeError(
            f"no generated class for {type_.representation()}: "
            f"the unit that declares it is not imported")
    return cls


def is_known(value) -> bool:
    return value.type_concept().runtime_id().encoded() in _CLASSES


def unwrap(value) -> typing.Any:
    if hasattr(value, "_unwrap"):
        return value._unwrap()
    if _holds_generated(value):
        raise TypeError("a native container of generated values: build the generated container "
                        "of this shape instead, so that a wrong element is refused where it is added")
    return value


def _holds_generated(value) -> bool:
    if isinstance(value, dict):
        return any(_holds_generated(k) or _holds_generated(v) for k, v in value.items())
    if isinstance(value, (list, tuple, set, frozenset)):
        return any(_holds_generated(element) for element in value)
    return hasattr(value, "_unwrap")


KeyT = typing.TypeVar("KeyT", bound="Key")


class Key(Proxy):
    __slots__ = ()

    @classmethod
    def from_any_concept_key(cls: type[KeyT], key: Proxy | dsviper.ValueKey) -> KeyT | None:
        raise NotImplementedError

    def as_(self, cls: type[KeyT]) -> KeyT | None:
        return cls.from_any_concept_key(self)


class AnyConceptKey(Key):
    __slots__ = ()

    def __init__(self, key: Proxy | dsviper.ValueKey):
        value = key._value if isinstance(key, Proxy) else key
        if not isinstance(value, dsviper.ValueKey):
            raise TypeError(f"{key!r} is not a key")
        super().__init__(value.to_any_concept_key())

    @classmethod
    def from_any_concept_key(cls, key: Proxy | dsviper.ValueKey) -> AnyConceptKey:
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

    @classmethod
    def decode(cls, blob, definitions=None, **kwargs) -> "AnyConceptKey":
        return cls(dsviper.ValueKey.cast(dsviper.Value.decode(
            blob, dsviper.TypeKey(dsviper.TypeAnyConcept()),
            definitions if definitions is not None else definitions_of(), **kwargs)))

    def __repr__(self) -> str:
        return self.description()
