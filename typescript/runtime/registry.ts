// The runtime of the kibo-template-viper 2.0.0 TypeScript templates (MIT), copied into
// every generated package. Do not edit by hand.

import dsviper from "@digitalsubstrate/dsviper";

import { Mapping, Optional, Ordered, Sequence, Variant, View } from "./container.js";
import { AnyConceptKey, Proxy } from "./proxy.js";

export { AnyConceptKey } from "./proxy.js";

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
            return named(key.typeConcept()).wrap(key);
        }
        case "optional":
        case "any": {
            const held = value as dsviper.ValueOptional;
            return held.isNil() ? undefined : wrap(held.unwrap());
        }
        case "variant":
            return wrap((value as dsviper.ValueVariant).unwrap());
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
    if (Array.isArray(value)) {
        return value.map(unwrap) as dsviper.InputValue;
    }

    if (value instanceof Set) {
        return Array.from(value, unwrap) as dsviper.InputValue;
    }
    if (value instanceof Map) {
        return new Map(Array.from(value, ([k, v]) => [unwrap(k), unwrap(v)])) as unknown as dsviper.InputValue;
    }
    return value as dsviper.InputValue;
}

export function setField(structure: dsviper.ValueStructure, name: string, value: unknown): void {
    const field = structure.typeStructure().check(name).type();
    if (field.typeCode() === "variant") {
        structure.set(name, new dsviper.ValueVariant(field as dsviper.TypeVariant, unwrap(value)));
        return;
    }
    structure.set(name, unwrap(value));
}
