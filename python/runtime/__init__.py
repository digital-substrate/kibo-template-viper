# The runtime of the kibo-template-viper 2.0.0 Python templates (MIT), copied into every
# generated package. Do not edit by hand.

from .attachment import AttachmentProxy
from .container import (Mapping, Optional, Ordered, Sequence, Variant, View,
                        mapping_of, optional_of, ordered_of, sequence_of, variant_of)
from .proxy import (NEUF, AnyConceptKey, Proxy, is_known, register,
                    set_definitions, unwrap, wrap)

__all__ = [
    "NEUF",
    "AnyConceptKey",
    "AttachmentProxy",
    "Mapping",
    "Ordered",
    "Proxy",
    "is_known",
    "Optional",
    "Sequence",
    "Variant",
    "View",
    "mapping_of",
    "optional_of",
    "ordered_of",
    "sequence_of",
    "variant_of",
    "register",
    "set_definitions",
    "unwrap",
    "wrap",
]
