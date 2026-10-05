// The runtime of the kibo-template-viper 2.0.1 TypeScript templates (MIT), copied into
// every generated package. Do not edit by hand.

import dsviper from "@digitalsubstrate/dsviper";

export const VALUE: unique symbol = Symbol("viper value");

export function adopt<T extends object>(cls: { prototype: T }, value: dsviper.Value): T {
    const adopted = Object.create(cls.prototype) as T;
    Object.defineProperty(adopted, VALUE, { value, enumerable: false });
    return Object.preventExtensions(adopted);
}
