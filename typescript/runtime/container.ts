// The runtime of the kibo-template-viper 2.0.0 TypeScript templates (MIT), copied into
// every generated package. Do not edit by hand.

import dsviper from "@digitalsubstrate/dsviper";

import { unwrap, unwrapDeep, wrap } from "./registry.js";

export class View {
    readonly vprValue: dsviper.Value;

    constructor(value: dsviper.Value) {
        this.vprValue = value;
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
    protected get suite(): Suite {
        return this.vprValue as unknown as Suite;
    }

    get size(): number {
        return this.suite.size();
    }

    get length(): number {
        return this.suite.size();
    }

    at(index: number): E {
        return wrap(this.suite.at(index));
    }

    has(element: E): boolean {
        return this.suite.contains(unwrap(element));
    }

    *[Symbol.iterator](): Iterator<E> {
        for (const element of this.suite) {
            yield wrap(element);
        }
    }

    toArray(): E[] {
        return [...this];
    }
}

export class Vector<E> extends Sequence<E> {
    private get vector(): dsviper.ValueVector {
        return this.vprValue as dsviper.ValueVector;
    }

    set(index: number, element: E): void {
        this.vector.set(index, unwrap(element));
    }

    append(element: E): void {
        this.vector.append(unwrap(element));
    }

    insert(index: number, element: E): void {
        this.vector.insert(index, unwrap(element));
    }

    extend(elements: Iterable<E>): void {
        this.vector.extend([...elements].map(unwrap));
    }

    concat(elements: Iterable<E>): this {
        return wrap(this.vector.concat(elements instanceof Vector
            ? elements.vprValue as dsviper.ValueVector : [...elements].map(unwrap)));
    }

    pop(index?: number): E {
        return wrap(this.vector.pop(index ?? null, false));
    }

    remove(element: E): void {
        this.vector.remove(unwrap(element));
    }

    clear(): void {
        this.vector.clear();
    }

    count(element: E): number {
        return this.vector.count(unwrap(element));
    }

    index(element: E): number {
        return this.vector.index(unwrap(element));
    }

    exchange(first: number, second: number): void {
        this.vector.exchange(first, second);
    }

    front(): E {
        return wrap(this.vector.front(false));
    }

    back(): E {
        return wrap(this.vector.back(false));
    }
}

type SetOperand<E> = SetView<E> | readonly E[] | ReadonlySet<E>;

function setOperand<E>(other: SetOperand<E>): dsviper.InputValue[] | dsviper.ValueSet {
    return other instanceof SetView ? other.vprValue as dsviper.ValueSet : [...other].map(unwrap);
}

export class SetView<E> extends Sequence<E> {
    private get set(): dsviper.ValueSet {
        return this.vprValue as dsviper.ValueSet;
    }

    add(element: E): void {
        this.set.add(unwrap(element));
    }

    remove(element: E): void {
        this.set.remove(unwrap(element));
    }

    discard(element: E): void {
        this.set.discard(unwrap(element));
    }

    pop(): E {
        return wrap(this.set.pop(false));
    }

    popMax(): E {
        return wrap(this.set.popMax(false));
    }

    extend(elements: Iterable<E>): void {
        this.set.extend([...elements].map(unwrap));
    }

    clear(): void {
        this.set.clear();
    }

    min(): E {
        return wrap(this.set.min(false));
    }

    max(): E {
        return wrap(this.set.max(false));
    }

    union(other: SetOperand<E>): this {
        return wrap(this.set.union(setOperand(other)));
    }

    intersection(other: SetOperand<E>): this {
        return wrap(this.set.intersection(setOperand(other)));
    }

    difference(other: SetOperand<E>): this {
        return wrap(this.set.difference(setOperand(other)));
    }

    symmetricDifference(other: SetOperand<E>): this {
        return wrap(this.set.symmetricDifference(setOperand(other)));
    }

    update(other: SetOperand<E>): void {
        this.set.update(setOperand(other));
    }

    intersectionUpdate(other: SetOperand<E>): void {
        this.set.intersectionUpdate(setOperand(other));
    }

    differenceUpdate(other: SetOperand<E>): void {
        this.set.differenceUpdate(setOperand(other));
    }

    symmetricDifferenceUpdate(other: SetOperand<E>): void {
        this.set.symmetricDifferenceUpdate(setOperand(other));
    }

    issubset(other: SetOperand<E>): boolean {
        return this.set.issubset(setOperand(other));
    }

    issuperset(other: SetOperand<E>): boolean {
        return this.set.issuperset(setOperand(other));
    }

    isdisjoint(other: SetOperand<E>): boolean {
        return this.set.isdisjoint(setOperand(other));
    }
}

export class Fixed<E> extends Sequence<E> {
    set(index: number, element: E): void {
        (this.vprValue as unknown as { set(i: number, v: unknown): void }).set(index, unwrap(element));
    }
}

export class Matrix<E> extends View {
    private get mat(): dsviper.ValueMat {
        return this.vprValue as dsviper.ValueMat;
    }

    get size(): number {
        return this.mat.size();
    }

    get columns(): number {
        return this.mat.columns();
    }

    get rows(): number {
        return this.mat.rows();
    }

    at(column: number, row: number): E {
        return wrap(this.mat.at(column, row));
    }

    set(column: number, row: number, element: E): void {
        this.mat.set(column, row, unwrap(element) as number);
    }

    column(index: number): E[] {
        const held: E[] = [];
        for (let row = 0; row < this.rows; row += 1) {
            held.push(this.at(index, row));
        }
        return held;
    }

    setColumn(index: number, elements: readonly E[]): void {
        elements.forEach((element, row) => this.set(index, row, element));
    }

    *[Symbol.iterator](): Iterator<E[]> {
        for (let index = 0; index < this.columns; index += 1) {
            yield this.column(index);
        }
    }

    toArray(): E[][] {
        return [...this];
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

    private *pairs(): Generator<[K, V]> {
        for (const pair of this.map as unknown as Iterable<dsviper.OutputValue>) {
            const [key, element] = pair as unknown as [dsviper.OutputValue, dsviper.OutputValue];
            yield [wrap(key), wrap(element)];
        }
    }

    discard(key: K): void {
        this.map.discard(unwrap(key));
    }

    pop(key: K, fallback?: V): V {
        return fallback === undefined
            ? wrap(this.map.pop(unwrap(key), null, false))
            : wrap(this.map.pop(unwrap(key), unwrap(fallback), false));
    }

    popitem(): [K, V] {
        const [key, element] = this.map.popitem(false);
        return [wrap(key), wrap(element)];
    }

    setdefault(key: K, element: V): V {
        return wrap(this.map.setdefault(unwrap(key), unwrap(element), false));
    }

    update(other: Mapping<K, V> | ReadonlyMap<K, V> | readonly (readonly [K, V])[]): void {
        this.map.update(unwrapDeep(other));
    }

    min(): K {
        return wrap(this.map.min(false));
    }

    max(): K {
        return wrap(this.map.max(false));
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

    toVector(): Vector<E> {
        const flat = this.ordered.toVector();
        const known = boundFor(Vector, flat.type());
        return known === undefined
            ? new Vector<E>(flat)
            : new (known as new (v: unknown) => Vector<E>)(flat);
    }

    has(element: E): boolean {
        return this.ordered.contains(unwrap(element));
    }

    index(position: dsviper.ValueUUId): number | undefined {
        return this.ordered.index(position);
    }

    positionOf(element: E): dsviper.ValueUUId | undefined {
        return this.ordered.positionOf(unwrap(element));
    }

    extend(elements: Iterable<E>): dsviper.ValueUUId {
        return this.ordered.extend([...elements].map(unwrap));
    }

    insertPosition(beforePosition: dsviper.ValueUUId, newPosition: dsviper.ValueUUId): void {
        this.ordered.insertPosition(beforePosition, newPosition);
    }

    disablePosition(position: dsviper.ValueUUId): void {
        this.ordered.disablePosition(position);
    }

    entries(): [dsviper.ValueUUId, E][] {
        return this.elementPositions().map((position) => [position, this.at(position) as E]);
    }

    *[Symbol.iterator](): Iterator<E> {
        for (const element of this.ordered as unknown as Iterable<dsviper.OutputValue>) {
            yield wrap(element);
        }
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

type Bound<V, I> = {
    new (value?: V | I | null): V;
    type(): dsviper.Type;
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
    }

    bound.set(typeOf, BoundView);
    return BoundView as unknown as Bound<V, I>;
}

export function declare<C>(typeOf: () => dsviper.Type, declared: C): C {
    bound.set(typeOf, declared);
    return declared;
}

type OrderedStatics = {
    readonly END: dsviper.ValueUUId;
    end(): dsviper.ValueUUId;
    createPosition(): dsviper.ValueUUId;
};

export const vectorOf = <E, I = never>(typeOf: () => dsviper.Type) =>
    bind<Vector<E>, I>(Vector as never, typeOf,
                       (t, v) => dsviper.Value.create(t, v as dsviper.InputValue));
export const setOf = <E, I = never>(typeOf: () => dsviper.Type) =>
    bind<SetView<E>, I>(SetView as never, typeOf,
                        (t, v) => dsviper.Value.create(t, v as dsviper.InputValue));
export const fixedOf = <E, I = never>(typeOf: () => dsviper.Type) =>
    bind<Fixed<E>, I>(Fixed as never, typeOf,
                      (t, v) => dsviper.Value.create(t, v as dsviper.InputValue));
export const matrixOf = <E, I = never>(typeOf: () => dsviper.Type) =>
    bind<Matrix<E>, I>(Matrix as never, typeOf,
                       (t, v) => dsviper.Value.create(t, v as dsviper.InputValue));
export const mappingOf = <K, V, I = never>(typeOf: () => dsviper.Type) =>
    bind<Mapping<K, V>, I>(Mapping as never, typeOf,
                           (t, v) => new dsviper.ValueMap(t as dsviper.TypeMap, v as dsviper.InputValue));
export const orderedOf = <E, I = never>(typeOf: () => dsviper.Type) =>
    bind<Ordered<E>, I>(Ordered as never, typeOf,
                        (t, v) => new dsviper.ValueXArray(t as dsviper.TypeXArray, v as dsviper.InputValue)) as
        Bound<Ordered<E>, I> & OrderedStatics;
export const optionalOf = <E, I = never>(typeOf: () => dsviper.Type) =>
    bind<Optional<E>, I>(Optional as never, typeOf,
                         (t, v) => new dsviper.ValueOptional(t as dsviper.TypeOptional, v as dsviper.InputValue));
export const variantOf = <E, I = never>(typeOf: () => dsviper.Type) =>
    bind<Variant<E>, I>(Variant as never, typeOf,
                        (t, v) => new dsviper.ValueVariant(t as dsviper.TypeVariant, v as dsviper.InputValue));
