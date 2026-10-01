// The runtime of the kibo-template-viper 2.0.0 TypeScript templates (MIT), copied into
// every generated package. Do not edit by hand.

import dsviper from "@digitalsubstrate/dsviper";

import { definitionsOf, unwrap, unwrapDeep, wrap } from "./registry.js";

export class View {
    readonly vprValue: dsviper.Value;

    constructor(value: dsviper.Value) {
        this.vprValue = value;

        return new globalThis.Proxy(this, {
            get(view, name, receiver) {
                if (name in view || typeof name === "symbol") {
                    return Reflect.get(view, name, receiver);
                }
                const inner = (view.vprValue as unknown as Record<string, unknown>)[name];
                if (typeof inner !== "function") {
                    return inner === undefined ? undefined : wrap(inner as dsviper.OutputValue);
                }
                return (...args: unknown[]) => {
                    const result = (inner as (...a: unknown[]) => unknown)
                        .apply(view.vprValue, args.map(unwrap));
                    return result instanceof dsviper.Value ? wrap(result) : result;
                };
            },
        });
    }

    type(): dsviper.Type {
        return this.vprValue.type();
    }

    hash(): bigint {
        return this.vprValue.hash();
    }

    hashKey(): bigint {
        return this.vprValue.hashKey();
    }

    equals(other: unknown): boolean {
        const compared = other instanceof View ? other.vprValue : other;

        if (compared === null || compared === undefined) {
            return false;
        }
        try {
            return this.vprValue.equals(compared);
        } catch {
            return false;
        }
    }

    encode(streamCodecInstancing?: dsviper.StreamCodecInstancing): dsviper.ValueBlob {
        return dsviper.Value.encode(this.vprValue, streamCodecInstancing);
    }

    hexdigest(): string {
        return dsviper.Value.hexdigest(this.vprValue);
    }

    copy(): this {
        return new (this.constructor as new (value: dsviper.Value) => this)(
            (this.vprValue as unknown as { copy(): dsviper.Value }).copy());
    }

    toJSON(): dsviper.NativeValue {
        return this.vprValue.toJSON();
    }

    toString(): string {
        return this.vprValue.toString();
    }
}

interface Suite extends Iterable<dsviper.OutputValue> {
    size(): number;

    at(...position: number[]): dsviper.OutputValue;
    contains(value: dsviper.InputValue): boolean;
}

export class Sequence<E> extends View {
    private get suite(): Suite {
        return this.vprValue as unknown as Suite;
    }

    get size(): number {
        return this.suite.size();
    }

    get length(): number {
        return this.suite.size();
    }

    at(...position: number[]): E {
        return wrap(this.suite.at(...position));
    }

    has(element: E): boolean {
        return this.suite.contains(unwrap(element));
    }

    *[Symbol.iterator](): Iterator<E> {
        const type = this.vprValue.type() as unknown as { columns?(): number; rows?(): number };
        if (typeof type.columns === "function" && typeof type.rows === "function") {
            for (let column = 0; column < type.columns(); column += 1) {
                const held: unknown[] = [];
                for (let row = 0; row < type.rows(); row += 1) {
                    held.push(wrap(this.suite.at(column, row)));
                }
                yield held as E;
            }
            return;
        }
        for (const element of this.suite) {
            yield wrap(element);
        }
    }

    toArray(): E[] {
        return [...this];
    }

    row(index: number): unknown[] {
        const type = this.vprValue.type() as unknown as { rows(): number };
        const held: unknown[] = [];
        for (let position = 0; position < type.rows(); position += 1) {
            held.push(this.at(index, position));
        }
        return held;
    }

    setRow(index: number, elements: unknown[]): void {
        const inner = this.vprValue as unknown as { set(c: number, r: number, v: unknown): void };
        elements.forEach((element, position) => inner.set(index, position, unwrap(element)));
    }

    call(name: string, ...args: unknown[]): unknown {
        return forward(this, name, args);
    }
}

export class Mapping<K, V> extends View {
    private get map(): dsviper.ValueMap {
        return this.vprValue as dsviper.ValueMap;
    }

    get size(): number {
        return this.map.size();
    }

    at(key: K): V {
        return wrap(this.map.at(unwrap(key)));
    }

    get(key: K, fallback?: V): V | undefined {
        const held = this.map.get(unwrap(key));
        return held === undefined ? fallback : wrap(held);
    }

    set(key: K, element: V): void {
        this.map.set(unwrap(key), unwrap(element));
    }

    has(key: K): boolean {
        return this.map.contains(unwrap(key));
    }

    remove(key: K): void {
        this.map.remove(unwrap(key));
    }

    clear(): void {
        this.map.clear();
    }

    keys(): K[] {
        return [...this];
    }

    values(): V[] {
        return this.entries().map(([, element]) => element);
    }

    entries(): [K, V][] {
        return [...this.pairs()];
    }

    *[Symbol.iterator](): Iterator<K> {
        for (const pair of this.map as unknown as Iterable<dsviper.OutputValue>) {
            const [key] = pair as unknown as [dsviper.OutputValue, dsviper.OutputValue];
            yield wrap(key);
        }
    }

    *pairs(): Generator<[K, V]> {
        for (const pair of this.map as unknown as Iterable<dsviper.OutputValue>) {
            const [key, element] = pair as unknown as [dsviper.OutputValue, dsviper.OutputValue];
            yield [wrap(key), wrap(element)];
        }
    }

    call(name: string, ...args: unknown[]): unknown {
        return forward(this, name, args);
    }
}

export class Ordered<E> extends View {
    private get ordered(): dsviper.ValueXArray {
        return this.vprValue as dsviper.ValueXArray;
    }

    static readonly END = dsviper.ValueXArray.END;

    static end(): dsviper.ValueUUId {
        return dsviper.ValueXArray.END;
    }

    static createPosition(): dsviper.ValueUUId {
        return dsviper.ValueXArray.createPosition();
    }

    get size(): number {
        return this.elementPositions().length;
    }

    positions(): dsviper.ValueUUId[] {
        return this.ordered.positions();
    }

    private elementPositions(): dsviper.ValueUUId[] {
        return this.positions().filter(
            (p) => !p.equals(dsviper.ValueXArray.END) && this.ordered.at(p) !== undefined);
    }

    position(index: number): dsviper.ValueUUId | undefined {
        const i = index < 0 ? this.ordered.size() + index : index;
        return i < 0 ? undefined : this.ordered.position(i);
    }

    indexOf(position: dsviper.ValueUUId): number | undefined {
        return this.ordered.index(position);
    }

    hasPosition(position: dsviper.ValueUUId): boolean {
        return this.ordered.hasPosition(position);
    }

    at(where: dsviper.ValueUUId | number): E | undefined {
        const position = typeof where === "number" ? this.position(where) : where;
        if (position === undefined) {
            return undefined;
        }
        const element = this.ordered.at(position);
        return element === undefined ? undefined : wrap(element);
    }

    get(where: dsviper.ValueUUId | number): E | undefined {
        return this.at(where);
    }

    set(where: dsviper.ValueUUId | number, element: E): void {
        const position = typeof where === "number" ? this.position(where) : where;
        if (position === undefined) {
            throw new RangeError(`no position at index ${String(where)}`);
        }
        this.ordered.set(position, unwrap(element));
    }

    insert(beforePosition: dsviper.ValueUUId, element: E,
           newPosition?: dsviper.ValueUUId): dsviper.ValueUUId {
        return newPosition === undefined
            ? this.ordered.insert(beforePosition, unwrap(element))
            : this.ordered.insert(beforePosition, unwrap(element), newPosition);
    }

    append(element: E): dsviper.ValueUUId {
        return this.ordered.append(unwrap(element));
    }

    remove(position: dsviper.ValueUUId): void {
        this.ordered.remove(position);
    }

    toVector(): Sequence<E> {
        const flat = this.ordered.toVector();
        const known = boundFor(Sequence, flat.type());
        return known === undefined
            ? new Sequence<E>(flat)
            : new (known as new (v: unknown) => Sequence<E>)(flat);
    }

    items(): [dsviper.ValueUUId, E][] {
        return this.elementPositions().map((position) => [position, this.at(position) as E]);
    }

    *[Symbol.iterator](): Iterator<E> {
        for (const element of this.ordered as unknown as Iterable<dsviper.OutputValue>) {
            yield wrap(element);
        }
    }

    call(name: string, ...args: unknown[]): unknown {
        return forward(this, name, args);
    }
}

export class Optional<E> extends View {
    private get optional(): dsviper.ValueOptional {
        return this.vprValue as dsviper.ValueOptional;
    }

    isNil(): boolean {
        return this.optional.isNil();
    }

    unwrap(): E {
        return wrap(this.optional.unwrap());
    }

    wrap(element: E): void {
        this.optional.wrap(unwrap(element));
    }

    get(fallback?: E): E | undefined {
        if (this.isNil()) {
            return fallback;
        }
        return this.unwrap();
    }

    clear(): void {
        this.optional.clear();
    }
}

export class AnyValue extends View {
    private get any(): dsviper.ValueAny {
        return this.vprValue as dsviper.ValueAny;
    }

    isNil(): boolean {
        return this.any.isNil();
    }

    unwrap(): unknown {
        return wrap(this.any.unwrap(false) as dsviper.Value);
    }

    wrap(element: unknown): void {
        this.any.wrap(unwrap(element));
    }

    clear(): void {
        this.any.clear();
    }
}

export class Variant<E> extends View {
    private get variant(): dsviper.ValueVariant {
        return this.vprValue as dsviper.ValueVariant;
    }

    unwrap(): E {
        return wrap(this.variant.unwrap());
    }

    wrap(element: E, type?: dsviper.Type): void {
        if (type === undefined) {
            this.variant.wrap(unwrap(element));
        } else {
            this.variant.wrap(unwrap(element), type);
        }
    }

    as<T>(type: dsviper.Type): T {
        const held = this.variant.unwrap(false) as dsviper.Value;
        if (!held.type().equals(type)) {
            throw new RangeError(`the variant holds a ${held.type().representation()}, `
                                 + `not a ${type.representation()}`);
        }
        return wrap(held);
    }

    holds(type: dsviper.Type): boolean {
        return (this.variant.unwrap(false) as dsviper.Value).type().equals(type);
    }
}

function forward(view: View, name: string, args: unknown[]): unknown {
    const inner = (view.vprValue as unknown as Record<string, unknown>)[name];
    if (typeof inner !== "function") {
        throw new TypeError(`neither the view nor ${view.vprValue.type().representation()} has '${name}'`);
    }
    const result = (inner as (...a: unknown[]) => unknown).apply(view.vprValue, args.map(unwrap));
    return result instanceof dsviper.Value ? wrap(result) : result;
}

type Bound<V, I> = {
    new (value?: V | I | null): V;
    type(): dsviper.Type;
    decode(blob: dsviper.ValueBlob): V;
};

const bound = new Map<() => dsviper.Type, unknown>();

export function declaredFor(type: dsviper.Type): (new (value: dsviper.Value) => View) | undefined {
    for (const [typeOf, held] of bound) {
        if (typeOf().equals(type)) {
            return held as new (value: dsviper.Value) => View;
        }
    }
    return undefined;
}

function boundFor(view: unknown, type: dsviper.Type): unknown {
    for (const [typeOf, held] of bound) {
        if (Object.getPrototypeOf(held as object) === view && typeOf().equals(type)) {
            return held;
        }
    }
    return undefined;
}

function bind<V extends View, I>(view: new (value: dsviper.Value) => V,
                                 typeOf: () => dsviper.Type,
                                 build: (type: dsviper.Type, value: unknown) => dsviper.Value): Bound<V, I> {
    const cached = bound.get(typeOf);
    if (cached !== undefined) {
        return cached as Bound<V, I>;
    }

    class BoundView extends (view as new (value: dsviper.Value) => View) {
        constructor(value?: unknown) {
            const given = unwrapDeep(value);
            if (given instanceof dsviper.Value && given.type().equals(typeOf())) {
                super(given);
                return;
            }

            let built: dsviper.Value;
            try {
                built = build(typeOf(), given);
            } catch (refusal) {
                throw new TypeError(`this value is not a ${typeOf().representation()}`,
                                    { cause: refusal });
            }

            if (!built.type().equals(typeOf())) {
                throw new TypeError(`this value is not a ${typeOf().representation()} `
                                    + `but a ${built.type().representation()}`);
            }
            super(built);
        }

        static type(): dsviper.Type {
            return typeOf();
        }

        static decode(blob: dsviper.ValueBlob): View {
            return new this(dsviper.Value.decode(blob, typeOf(), definitionsOf()));
        }
    }

    bound.set(typeOf, BoundView);
    return BoundView as unknown as Bound<V, I>;
}

export function declare<C>(typeOf: () => dsviper.Type, declared: C): C {
    bound.set(typeOf, declared);
    return declared;
}

export const sequenceOf = <E, I = never>(typeOf: () => dsviper.Type) =>
    bind<Sequence<E>, I>(Sequence as never, typeOf,
                      (t, v) => dsviper.Value.create(t, v as dsviper.InputValue));
export const mappingOf = <K, V, I = never>(typeOf: () => dsviper.Type) =>
    bind<Mapping<K, V>, I>(Mapping as never, typeOf,
                        (t, v) => new dsviper.ValueMap(t as dsviper.TypeMap, v as dsviper.InputValue));
export const orderedOf = <E, I = never>(typeOf: () => dsviper.Type) =>
    bind<Ordered<E>, I>(Ordered as never, typeOf,
                     (t, v) => new dsviper.ValueXArray(t as dsviper.TypeXArray, v as dsviper.InputValue));
export const optionalOf = <E, I = never>(typeOf: () => dsviper.Type) =>
    bind<Optional<E>, I>(Optional as never, typeOf,
                      (t, v) => new dsviper.ValueOptional(t as dsviper.TypeOptional, v as dsviper.InputValue));
export const variantOf = <E, I = never>(typeOf: () => dsviper.Type) =>
    bind<Variant<E>, I>(Variant as never, typeOf,
                     (t, v) => new dsviper.ValueVariant(t as dsviper.TypeVariant, v as dsviper.InputValue));
