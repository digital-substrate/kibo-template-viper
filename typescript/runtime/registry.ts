// The runtime of the kibo-template-viper 2.0.0 TypeScript templates (MIT), copied into
// every generated package. Do not edit by hand.

import dsviper from "@digitalsubstrate/dsviper";

import { AnyValue, Fixed, Mapping, Matrix, Optional, Ordered, SetView, Variant, Vector, View, declaredFor } from "./container.js";
import { AnyConceptKey, Proxy } from "./proxy.js";

export { AnyConceptKey } from "./proxy.js";
export { AnyValue } from "./container.js";

export interface Wrapping {
    wrapValue(value: dsviper.Value): unknown;
}

const classes = new Map<string, Wrapping>();

export function register(...entries: (readonly [dsviper.ValueUUId, Wrapping])[]): void {
    for (const [runtimeId, wrapping] of entries) {
        classes.set(runtimeId.encoded(), wrapping);
    }
}

export function wrap(value: dsviper.OutputValue | dsviper.Value): any {
    if (!(value instanceof dsviper.Value)) {
        return value;
    }

    switch (value.typeCode()) {
        case "struct":
        case "enum":
            return named(value.type()).wrapValue(value);
        case "key": {
            const key = dsviper.ValueKey.cast(value);
            const typeKey = key.typeKey();
            return typeKey.isAnyConcept() ? new AnyConceptKey(key) : named(typeKey.elementType()).wrapValue(key);
        }
        case "any":
            return AnyValue.wrapValue(value);
        case "variant":
        case "optional":
        case "map":
        case "xarray":
        case "vector":
        case "set":
        case "vec":
        case "mat":
        case "tuple": {
            const declared = declaredFor(value.type());
            if (declared !== undefined) {
                return declared.wrapValue(value);
            }
            break;
        }
    }

    switch (value.typeCode()) {
        case "optional":
            return new Optional(dsviper.ValueOptional.cast(value));
        case "variant":
            return new Variant(value);
        case "map":
            return new Mapping(dsviper.ValueMap.cast(value));
        case "xarray":
            return new Ordered(dsviper.ValueXArray.cast(value));
        case "vector":
            return new Vector(value);
        case "set":
            return new SetView(value);
        case "vec":
        case "tuple":
            return new Fixed(value);
        case "mat":
            return new Matrix(value);

        case "bool":
        case "uint8": case "uint16": case "uint32": case "uint64":
        case "int8": case "int16": case "int32": case "int64":
        case "float": case "double":
        case "string":
            return dsviper.Value.dumps(value);
        default:
            return value;
    }
}

function named(type: dsviper.Type): Wrapping {
    const found = classes.get(type.runtimeId().encoded());
    if (found === undefined) {
        throw new TypeError(`no generated class for ${type.representation()}: `
                            + "the unit that declares it is not imported");
    }
    return found;
}

export function isKnown(value: dsviper.ValueKey): boolean {
    return classes.has(value.typeConcept().runtimeId().encoded());
}

export function unwrap(value: unknown): dsviper.InputValue {
    if (value instanceof Proxy || value instanceof View) {
        return value.unwrapValue();
    }
    if (holdsGenerated(value)) {
        throw new TypeError("a native container of generated values: build its declared class instead, "
                            + "new containers.<Kind>_of_<Element>(values), which checks each element where it is built");
    }
    return value as dsviper.InputValue;
}

export function unwrapDeep(value: unknown): dsviper.InputValue {
    if (value instanceof Proxy || value instanceof View) {
        return value.unwrapValue();
    }
    if (Array.isArray(value)) {
        return value.map(unwrapDeep) as dsviper.InputValue;
    }
    if (value instanceof Set) {
        return [...value].map(unwrapDeep) as dsviper.InputValue;
    }
    if (value instanceof Map) {
        return [...value].map(([k, v]) => [unwrapDeep(k), unwrapDeep(v)]) as dsviper.InputValue;
    }
    return value as dsviper.InputValue;
}

function holdsGenerated(value: unknown): boolean {
    if (value instanceof Proxy || value instanceof View) {
        return true;
    }
    if (Array.isArray(value) || value instanceof Set) {
        for (const element of value) {
            if (holdsGenerated(element)) {
                return true;
            }
        }
        return false;
    }
    if (value instanceof Map) {
        for (const [k, v] of value) {
            if (holdsGenerated(k) || holdsGenerated(v)) {
                return true;
            }
        }
    }
    return false;
}

export function setField(structure: dsviper.ValueStructure, name: string, value: unknown): void {
    structure.set(name, unwrap(value));
}
