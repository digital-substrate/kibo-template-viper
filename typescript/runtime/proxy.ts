// The runtime of the kibo-template-viper 2.0.0 TypeScript templates (MIT), copied into
// every generated package. Do not edit by hand.

import dsviper from "@digitalsubstrate/dsviper";

import { isKnown } from "./registry.js";
import { VALUE, adopt } from "./value.js";

/**
 * A box around one Viper value, with the API of the class it faces; `unwrapValue()` returns
 * the value.
 *
 * It follows Viper's reference semantics. A field read hands back what the value holds:
 * changing a nested structure or container read from a field changes this object. A field
 * write keeps the object it is given: changing that object afterwards shows here too, and a
 * constructor given a Viper value boxes it. Copied instead: a set element and a map key, and a
 * document crossing a Database or a CommitDatabase, on set as on get. A copy is otherwise
 * explicit: `copy()`, or `new Cls(value.copy())`.
 */
export abstract class Proxy<V extends dsviper.Value> {
    readonly [VALUE]: V;

    protected constructor(value: V) {
        this[VALUE] = value;
        Object.preventExtensions(this);
    }

    /** The Viper value this object wraps, not a copy. */
    unwrapValue(): V {
        return this[VALUE];
    }

    /** -1, 0 or 1, as the runtime orders the two values: `list.sort((a, b) => a.compare(b))`. */
    compare(other: Proxy<dsviper.Value>): number {
        return this[VALUE].compare(other.unwrapValue());
    }

    equals(other: unknown): boolean {
        return other instanceof Proxy && this[VALUE].equals(other.unwrapValue());
    }

    /** A bigint equal for equal values: key a native Map or Set by it, which compare objects
     *  by identity. */
    hashKey(): bigint {
        return this[VALUE].hashKey();
    }

    toJSON(): dsviper.NativeValue {
        return this[VALUE].toJSON();
    }

    copy(): this {
        return adopt(this.constructor as { prototype: object },
                     (this[VALUE] as unknown as { copy(): V }).copy()) as this;
    }

    type(): dsviper.Type {
        return this[VALUE].type();
    }

    toString(): string {
        return this[VALUE].toString();
    }
}

export abstract class Key extends Proxy<dsviper.ValueKey> {
    /**
     * A bigint equal for equal keys, whatever the view (parent, club, any concept): key a
     * native Map or Set by it, which compare objects by identity.
     */
    override hashKey(): bigint {
        return this[VALUE].toAnyConceptKey().hashKey();
    }

    protected held(): string {
        const concept = this[VALUE].typeConcept();
        if (concept.runtimeId().equals(this[VALUE].typeKey().elementType().runtimeId())) {
            return "";
        }
        return `(${concept.representation()}Key)`;
    }
}

export class AnyConceptKey extends Key {
    declare private readonly anyConceptKeyBrand: never;

    constructor(key: Proxy<dsviper.ValueKey> | dsviper.ValueKey) {
        super((key instanceof Proxy ? key.unwrapValue() : key).toAnyConceptKey());
    }

    static type(): dsviper.TypeKey {
        return new dsviper.TypeKey(dsviper.Type.ANY_CONCEPT);
    }

    static fromAnyConceptKey(key: Proxy<dsviper.ValueKey> | dsviper.ValueKey): AnyConceptKey {
        return new AnyConceptKey(key);
    }

    /** The key a Viper value of exactly this type holds; another type throws TypeError. */
    static wrapValue(value: dsviper.Value): AnyConceptKey {
        if (!(value instanceof dsviper.Value) || !value.type().equals(AnyConceptKey.type())) {
            throw new TypeError(`this value is not a ${AnyConceptKey.type().representation()}`);
        }
        return new AnyConceptKey(dsviper.ValueKey.cast(value));
    }

    instanceId(): dsviper.ValueUUId {
        return this[VALUE].instanceId();
    }

    runtimeId(): dsviper.ValueUUId {
        return this[VALUE].typeConcept().runtimeId();
    }

    isValid(): boolean {
        return this[VALUE].instanceId().isValid();
    }

    isKnown(): boolean {
        return isKnown(this[VALUE]);
    }

    description(): string {
        return `${this[VALUE].instanceId().encoded()}:AnyConceptKey`
             + `(${this[VALUE].typeConcept().representation()}Key)`;
    }

    override toString(): string {
        return this.description();
    }
}
