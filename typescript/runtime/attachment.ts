// The runtime of the kibo-template-viper 2.0.3 TypeScript templates (MIT), copied into
// every generated package. Do not edit by hand.

import dsviper from "@digitalsubstrate/dsviper";

import { Optional, SetView } from "./container.js";
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

/**
 * An attachment of the model; each operation takes the store it acts on.
 *
 * Reading - keys, has, get, enumerate - takes an AttachmentGetting (a CommitState's or a
 * mutable state's attachmentGetting()) or a Database.
 *
 * Either database needs the model first: db.extendDefinitions(definitions()). Writing then
 * goes one of two ways. On a Database, set and del write the current state directly, inside a
 * transaction. On a CommitDatabase, set, diff and the field operations write to an
 * AttachmentMutating, which a CommitMutableState gives (attachmentMutating()):
 * new dsviper.CommitMutableState(dsviper.CommitStateBuilder.initialState(db)) for the first
 * commit, CommitStateBuilder.state(db, commitId) to carry on from the commit id the last one
 * returned. Nothing is stored until that state is committed - db.commitMutations(label,
 * state), or a CommitStore's dispatch, which keeps that thread and commits for you. A field
 * operation on a key that holds no document does nothing and throws nothing: set the document
 * first. A Database has no AttachmentMutating, so diff and the field
 * operations are a commit database's only; del is a Database's only, a commit never removing
 * a key.
 */
export class AttachmentProxy<K, D, KS = SetView<K>, DI = D> {
    /**
     * The attachment's runtime id, a constant: it tells which attachment an id names without
     * resolving the definitions.
     */
    readonly runtimeId: dsviper.ValueUUId;
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

    keys(getting: Getting): KS {
        return wrap(getting.keys(this.descriptor)) as KS;
    }

    enumerate(getting: dsviper.AttachmentGetting | dsviper.Database): [K, D][] {
        const reader = getting instanceof dsviper.Database ? getting.attachmentGetting() : getting;
        return reader.enumerate(this.descriptor)
            .map(([key, document]) => [wrap(key) as K, wrap(document) as D]);
    }

    diffKeys(current: Getting, other: Getting): [KS, KS, KS, KS] {
        const groups = dsviper.AttachmentGetting.diffKeys(
            current as unknown as dsviper.AttachmentGetting,
            other as unknown as dsviper.AttachmentGetting, this.descriptor);
        return groups.map((group) => wrap(group)) as unknown as [KS, KS, KS, KS];
    }

    has(getting: Getting, key: K): boolean {
        return getting.has(this.descriptor, unwrap(key) as dsviper.ValueKey);
    }

    /**
     * Return the stored document as an optional. It is a copy: changing it does not change what
     * is stored; write it back with `set`.
     */
    get(getting: Getting, key: K): Optional<D> {
        return wrap(getting.get(this.descriptor, unwrap(key) as dsviper.ValueKey));
    }

    /**
     * Write the document; on a Database, true once written (a refusal throws), on a mutating
     * state, nothing. The document is copied in: changing it afterwards does not reach what was
     * written.
     */
    set(setting: Mutating, key: K, value: DI): void;
    set(setting: dsviper.Database, key: K, value: DI): boolean;
    set(setting: Setting, key: K, value: DI): unknown {
        return setting.set(this.descriptor, unwrap(key) as dsviper.ValueKey, unwrap(value));
    }

    diff(mutating: Mutating, key: K, value: DI, recursive = false): void {
        mutating.diff(this.descriptor, unwrap(key) as dsviper.ValueKey, unwrap(value), recursive);
    }

    del(database: dsviper.Database, key: K): boolean {
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
