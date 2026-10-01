// The runtime of the kibo-template-viper 2.0.0 TypeScript templates (MIT), copied into
// every generated package. Do not edit by hand.

import dsviper from "@digitalsubstrate/dsviper";

import { AnyValue, Mapping, Optional, Ordered, Sequence, Variant, View, declaredFor } from "./container.js";
import { AnyConceptKey, Proxy } from "./proxy.js";

export { AnyConceptKey } from "./proxy.js";
export { AnyValue } from "./container.js";

export interface Wrapping {
    wrap(value: dsviper.Value): unknown;
}

const classes = new Map<string, Wrapping>();

let definitions: (() => dsviper.DefinitionsConst) | undefined;

export function setDefinitions(accessor: () => dsviper.DefinitionsConst): void {
    definitions = accessor;
}

export function definitionsOf(): dsviper.DefinitionsConst {
    if (definitions === undefined) {
        throw new Error("the package has not declared its definitions");
    }
    return definitions();
}

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
            return named(value.type()).wrap(value);
        case "key": {
            const key = dsviper.ValueKey.cast(value);
            const typeKey = key.typeKey();
            return typeKey.isAnyConcept() ? new AnyConceptKey(key) : named(typeKey.elementType()).wrap(key);
        }
        case "any":
            return new AnyValue(value);
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
                return new declared(value);
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
        case "set":
        case "vec":
        case "mat":
        case "tuple":
            return new Sequence(value);

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
        return value.vprValue;
    }
    if (holdsGenerated(value)) {
        throw new TypeError("a native container of generated values: build the generated container "
                            + "of this shape instead, so that a wrong element is refused where it is added");
    }
    return value as dsviper.InputValue;
}

export function unwrapDeep(value: unknown): dsviper.InputValue {
    if (value instanceof Proxy || value instanceof View) {
        return value.vprValue;
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
    const field = structure.typeStructure().check(name).type();
    if (field.typeCode() === "variant") {
        structure.set(name, new dsviper.ValueVariant(field as dsviper.TypeVariant, unwrap(value)));
        return;
    }
    structure.set(name, unwrap(value));
}
