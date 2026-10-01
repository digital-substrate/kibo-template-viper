// The runtime of the kibo-template-viper 2.0.0 TypeScript templates (MIT), copied into
// every generated package. Do not edit by hand.

import dsviper from "@digitalsubstrate/dsviper";

import { isKnown } from "./registry.js";

export abstract class Proxy<V extends dsviper.Value> {
    readonly vprValue: V;

    protected constructor(value: V) {
        this.vprValue = value;
    }

    equals(other: unknown): boolean {
        return other instanceof Proxy && this.vprValue.equals(other.vprValue);
    }

    hashKey(): bigint {
        return this.vprValue.hashKey();
    }

    toJSON(): dsviper.NativeValue {
        return this.vprValue.toJSON();
    }

    copy(): this {
        return new (this.constructor as new (value: V) => this)(
            (this.vprValue as unknown as { copy(): V }).copy());
    }

    type(): dsviper.Type {
        return this.vprValue.type();
    }

    hash(): bigint {
        return this.vprValue.hash();
    }

    toString(): string {
        return this.vprValue.toString();
    }
}

export interface KeyClass<K> {
    fromAnyConceptKey(key: Key | dsviper.ValueKey): K | undefined;
}

export abstract class Key extends Proxy<dsviper.ValueKey> {
    override hashKey(): bigint {
        return this.vprValue.toAnyConceptKey().hashKey();
    }

    as<K>(target: KeyClass<K>): K | undefined {
        return target.fromAnyConceptKey(this);
    }

    protected held(): string {
        const concept = this.vprValue.typeConcept();
        if (concept.runtimeId().equals(this.vprValue.typeKey().elementType().runtimeId())) {
            return "";
        }
        return `(${concept.representation()}Key)`;
    }
}

export class AnyConceptKey extends Key {
    declare private readonly anyConceptKeyBrand: never;

    constructor(key: Proxy<dsviper.ValueKey> | dsviper.ValueKey) {
        super((key instanceof Proxy ? key.vprValue : key).toAnyConceptKey());
    }

    static type(): dsviper.TypeKey {
        return new dsviper.TypeKey(dsviper.Type.ANY_CONCEPT);
    }

    static fromAnyConceptKey(key: Proxy<dsviper.ValueKey> | dsviper.ValueKey): AnyConceptKey {
        return new AnyConceptKey(key);
    }

    static wrap(value: dsviper.Value): AnyConceptKey {
        return new AnyConceptKey(dsviper.ValueKey.cast(value));
    }

    instanceId(): dsviper.ValueUUId {
        return this.vprValue.instanceId();
    }

    runtimeId(): dsviper.ValueUUId {
        return this.vprValue.typeConcept().runtimeId();
    }

    isValid(): boolean {
        return this.vprValue.instanceId().isValid();
    }

    isKnown(): boolean {
        return isKnown(this.vprValue);
    }

    description(): string {
        return `${this.vprValue.instanceId().encoded()}:AnyConceptKey`
             + `(${this.vprValue.typeConcept().representation()}Key)`;
    }

    override toString(): string {
        return this.description();
    }
}
