// The runtime of the kibo-template-viper 2.0.0 TypeScript templates (MIT), copied into
// every generated package. Do not edit by hand.

import dsviper from "@digitalsubstrate/dsviper";

import { definitionsOf, isKnown } from "./registry.js";

export abstract class Proxy<V extends dsviper.Value> {
    readonly vprValue: V;

    protected constructor(value: V) {
        this.vprValue = value;
    }

    equals(other: unknown): boolean {
        return other instanceof Proxy
            && other.constructor === this.constructor
            && this.vprValue.equals(other.vprValue);
    }

    hashKey(): bigint {
        return this.vprValue.hashKey();
    }

    toJSON(): dsviper.NativeValue {
        return this.vprValue.toJSON();
    }

    encode(streamCodecInstancing?: dsviper.StreamCodecInstancing): dsviper.ValueBlob {
        return dsviper.Value.encode(this.vprValue, streamCodecInstancing);
    }

    hexdigest(): string {
        return dsviper.Value.hexdigest(this.vprValue);
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

export class AnyConceptKey extends Proxy<dsviper.ValueKey> {
    constructor(value: dsviper.ValueKey) {
        super(value);
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

    static decode(blob: dsviper.ValueBlob): AnyConceptKey {
        return new AnyConceptKey(dsviper.ValueKey.cast(dsviper.Value.decode(
            blob, new dsviper.TypeKey(dsviper.Type.ANY_CONCEPT), definitionsOf())));
    }

    description(): string {
        return `${this.vprValue.instanceId().encoded()}:AnyConceptKey`
             + `(${this.vprValue.typeConcept().representation()}Key)`;
    }

    as<K>(concept: { type(): dsviper.TypeKey; wrap(value: dsviper.Value): K }): K | undefined {
        return this.vprValue.type().equals(concept.type()) ? concept.wrap(this.vprValue) : undefined;
    }

    override toString(): string {
        return this.description();
    }
}
