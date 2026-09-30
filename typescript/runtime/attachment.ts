// The runtime of the kibo-template-viper 2.0.0 TypeScript templates (MIT), copied into
// every generated package. Do not edit by hand.

import dsviper from "@digitalsubstrate/dsviper";

import { Sequence } from "./container.js";
import { wrap, unwrap, type Wrapping } from "./registry.js";

export interface Getting {
    keys(attachment: dsviper.Attachment): dsviper.ValueSet;
    has(attachment: dsviper.Attachment, key: dsviper.ValueKey): boolean;
    get(attachment: dsviper.Attachment, key: dsviper.ValueKey): dsviper.ValueOptional;
}

export interface Setting extends Getting {
    set(attachment: dsviper.Attachment, key: dsviper.ValueKey, value: dsviper.InputValue): unknown;
}

export interface Mutating extends Setting {
    diff(attachment: dsviper.Attachment, key: dsviper.ValueKey, value: dsviper.InputValue,
         recursive?: boolean): void;
    update(attachment: dsviper.Attachment, key: dsviper.ValueKey, path: dsviper.PathConst,
           value: dsviper.InputValue): void;
    unionInSet(attachment: dsviper.Attachment, key: dsviper.ValueKey, path: dsviper.PathConst,
               value: dsviper.InputValue): void;
    subtractInSet(attachment: dsviper.Attachment, key: dsviper.ValueKey, path: dsviper.PathConst,
                  value: dsviper.InputValue): void;
    unionInMap(attachment: dsviper.Attachment, key: dsviper.ValueKey, path: dsviper.PathConst,
               value: dsviper.InputValue): void;
    subtractInMap(attachment: dsviper.Attachment, key: dsviper.ValueKey, path: dsviper.PathConst,
                  value: dsviper.InputValue): void;
    updateInMap(attachment: dsviper.Attachment, key: dsviper.ValueKey, path: dsviper.PathConst,
                value: dsviper.InputValue): void;
    insertInXarray(attachment: dsviper.Attachment, key: dsviper.ValueKey, path: dsviper.PathConst,
                   beforePosition: dsviper.ValueUUId, newPosition: dsviper.ValueUUId,
                   value: dsviper.InputValue): void;
    updateInXarray(attachment: dsviper.Attachment, key: dsviper.ValueKey, path: dsviper.PathConst,
                   position: dsviper.ValueUUId, value: dsviper.InputValue): void;
    removeInXarray(attachment: dsviper.Attachment, key: dsviper.ValueKey, path: dsviper.PathConst,
                   position: dsviper.ValueUUId): void;
}

export class AttachmentProxy<K, D> {
    private readonly runtimeId: dsviper.ValueUUId;
    private readonly definitions: () => dsviper.DefinitionsConst;
    private resolved?: dsviper.Attachment;

    constructor(runtimeId: dsviper.ValueUUId,
                definitions: () => dsviper.DefinitionsConst,
                _key: Wrapping,
                _document: Wrapping | undefined) {
        this.runtimeId = runtimeId;
        this.definitions = definitions;
    }

    get descriptor(): dsviper.Attachment {
        return (this.resolved ??= this.definitions().checkAttachment(this.runtimeId));
    }

    keys(getting: Getting): Sequence<K> {
        return new Sequence<K>(getting.keys(this.descriptor));
    }

    enumerate(getting: Getting): [K, D | undefined][] {
        const source = (getting as unknown as { enumerate?: unknown; attachmentGetting?: () => dsviper.AttachmentGetting });
        const reader = typeof source.enumerate === "function"
            ? (getting as unknown as dsviper.AttachmentGetting)
            : (source.attachmentGetting as () => dsviper.AttachmentGetting)();
        return reader.enumerate(this.descriptor)
            .map(([key, document]) => [wrap(key), wrap(document)]);
    }

    diffKeys(current: Getting, other: Getting):
            [Sequence<K>, Sequence<K>, Sequence<K>, Sequence<K>] {
        const groups = dsviper.AttachmentGetting.diffKeys(
            current as unknown as dsviper.AttachmentGetting,
            other as unknown as dsviper.AttachmentGetting, this.descriptor);
        return groups.map((group) => new Sequence<K>(group)) as unknown as
            [Sequence<K>, Sequence<K>, Sequence<K>, Sequence<K>];
    }

    has(getting: Getting, key: K): boolean {
        return getting.has(this.descriptor, unwrap(key) as dsviper.ValueKey);
    }

    get(getting: Getting, key: K): D | undefined {
        const document = getting.get(this.descriptor, unwrap(key) as dsviper.ValueKey);
        return document.isNil() ? undefined : wrap(document.unwrap());
    }

    set(setting: Setting, key: K, value: D): unknown {
        const document = unwrap(value);
        if (document instanceof dsviper.Value
            && !document.type().equals(this.descriptor.documentType())) {
            throw new TypeError(
                `a document of type ${document.type().representation()} for `
                + `${this.descriptor.representation()}, which expects `
                + `${this.descriptor.documentType().representation()}`);
        }
        return setting.set(this.descriptor, unwrap(key) as dsviper.ValueKey, document);
    }

    diff(mutating: Mutating, key: K, value: D, recursive = false): void {
        mutating.diff(this.descriptor, unwrap(key) as dsviper.ValueKey, unwrap(value), recursive);
    }

    delete(database: { delete(a: dsviper.Attachment, k: dsviper.ValueKey): boolean }, key: K): boolean {
        return database.delete(this.descriptor, unwrap(key) as dsviper.ValueKey);
    }

    protected updateField(mutating: Mutating, key: K, field: string, value: unknown): void {
        mutating.update(this.descriptor, this.keyOf(key), path(field), unwrap(value));
    }

    protected unionInSet(mutating: Mutating, key: K, field: string | undefined, value: unknown): void {
        mutating.unionInSet(this.descriptor, this.keyOf(key), path(field), this.valueAt(field, value));
    }

    protected subtractInSet(mutating: Mutating, key: K, field: string | undefined, value: unknown): void {
        mutating.subtractInSet(this.descriptor, this.keyOf(key), path(field), this.valueAt(field, value));
    }

    protected unionInMap(mutating: Mutating, key: K, field: string | undefined, value: unknown): void {
        mutating.unionInMap(this.descriptor, this.keyOf(key), path(field), this.valueAt(field, value));
    }

    protected subtractInMap(mutating: Mutating, key: K, field: string | undefined, value: unknown): void {
        mutating.subtractInMap(this.descriptor, this.keyOf(key), path(field), this.valueAt(field, value, "keys"));
    }

    protected updateInMap(mutating: Mutating, key: K, field: string | undefined, value: unknown): void {
        mutating.updateInMap(this.descriptor, this.keyOf(key), path(field), this.valueAt(field, value));
    }

    protected insertInXArray(mutating: Mutating, key: K, field: string | undefined,
                             beforePosition: dsviper.ValueUUId, newPosition: dsviper.ValueUUId,
                             value: unknown): void {
        mutating.insertInXarray(this.descriptor, this.keyOf(key), path(field),
                                beforePosition, newPosition, this.valueAt(field, value, "element"));
    }

    protected updateInXArray(mutating: Mutating, key: K, field: string | undefined,
                             position: dsviper.ValueUUId, value: unknown): void {
        mutating.updateInXarray(this.descriptor, this.keyOf(key), path(field), position, this.valueAt(field, value, "element"));
    }

    protected removeInXArray(mutating: Mutating, key: K, field: string | undefined,
                             position: dsviper.ValueUUId): void {
        mutating.removeInXarray(this.descriptor, this.keyOf(key), path(field), position);
    }

    private keyOf(key: K): dsviper.ValueKey {
        return unwrap(key) as dsviper.ValueKey;
    }

    private valueAt(field: string | undefined, value: unknown,
                    part: "whole" | "keys" | "element" = "whole"): dsviper.Value {
        const document = this.descriptor.documentType();
        const aggregate = field === undefined
            ? document
            : (document as dsviper.TypeStructure).check(field).type();
        const type = part === "keys"
            ? new dsviper.TypeSet((aggregate as dsviper.TypeMap).keyType())
            : part === "element"
                ? (aggregate as dsviper.TypeXArray).elementType()
                : aggregate;
        const native = unwrap(value);
        return native instanceof dsviper.Value ? native : dsviper.Value.create(type, native);
    }
}

const paths = new Map<string | undefined, dsviper.PathConst>();

function path(field: string | undefined): dsviper.PathConst {
    let found = paths.get(field);
    if (found === undefined) {
        found = (field === undefined ? new dsviper.Path() : dsviper.Path.fromField(field)).const();
        paths.set(field, found);
    }
    return found;
}
