# The runtime of the kibo-template-viper 2.0.0 Python templates (MIT), copied into every
# generated package. Do not edit by hand.

from .attachment import AttachmentProxy
from .container import (Mapping, Optional, Ordered, Sequence, Variant, View,
                        Declared, declare)
from .proxy import (NOT_GIVEN, AnyConceptKey, Key, NotGiven, Proxy, is_known, register,
                    set_definitions, unwrap, wrap)

__all__ = [
    "NOT_GIVEN",
    "NotGiven",
    "AnyConceptKey",
    "AttachmentProxy",
    "Declared",
    "Key",
    "Mapping",
    "Ordered",
    "Proxy",
    "is_known",
    "Optional",
    "Sequence",
    "Variant",
    "declare",
    "View",
                        "register",
    "set_definitions",
    "unwrap",
    "wrap",
]
