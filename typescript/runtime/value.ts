// The runtime of the kibo-template-viper 2.0.3 TypeScript templates (MIT), copied into
// every generated package. Do not edit by hand.

import dsviper from "@digitalsubstrate/dsviper";

export const VALUE: unique symbol = Symbol("viper value");

export function adopt<T extends object>(cls: { prototype: T }, value: dsviper.Value): T {
    const adopted = Object.create(cls.prototype) as T;
    Object.defineProperty(adopted, VALUE, { value, enumerable: false });
    return Object.preventExtensions(adopted);
}

/** Node's hook for `console.log` and `util.inspect`, reached without importing `node:util`. */
export const INSPECT: unique symbol = Symbol.for("nodejs.util.inspect.custom");

export interface InspectOptions {
    depth?: number | null;
    stylize(text: string, style: string): string;
}

export type Inspect = (value: unknown, options: InspectOptions) => string;

/**
 * How `console.log` shows a generated object: the name of its class, then what it holds as Node
 * shows it - `StructureS { f_float: 1.5 }`, `Vector_of_uint8(2) [ 1, 2 ]`, `ConceptAKey(…)`.
 */
export function shown(name: string, body: unknown, depth: number, options: InspectOptions,
                      inspect: Inspect, held = false): string {
    if (depth < 0) {
        return options.stylize(`[${name}]`, "special");
    }
    const inner = inspect(body, { ...options, depth: options.depth == null ? null : depth });
    return held ? `${name}(${inner})` : `${name} ${inner.replace(/^(Set|Map)\(\d+\) /, "")}`;
}
