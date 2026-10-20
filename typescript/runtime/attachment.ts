// The runtime of the kibo-template-viper 2.0.0 TypeScript templates (MIT), copied into
// every generated package. Do not edit by hand.

import dsviper from "@digitalsubstrate/dsviper";

import { wrap, unwrap } from "./registry.js";

/** What a Commit state reads through: a CommitState's or a mutable state's attachmentGetting(). */
export interface Getting {
    keys(attachment: dsviper.Attachment): dsviper.ValueSet;
    has(attachment: dsviper.Attachment, key: dsviper.ValueKey): boolean;
    get(attachment: dsviper.Attachment, key: dsviper.ValueKey): dsviper.ValueOptional;
}

/** What a Commit state writes through: a CommitMutableState's attachmentMutating(). */
export interface Mutating extends Getting {
    set(attachment: dsviper.Attachment, key: dsviper.ValueKey, value: dsviper.InputValue): unknown;
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
 * What every generated attachment shares, whatever its usage: its identity. The generated
 * classes of `database_attachments` (a Database) and `commit_attachments` (a Commit state)
 * declare the operations of their usage; the protected calls below are theirs.
 */
export class AttachmentBase {
    /**
     * The attachment's runtime id, a constant: it tells which attachment an id names without
     * resolving the definitions.
     */
    readonly runtimeId: dsviper.ValueUUId;
    private readonly definitions: () => dsviper.DefinitionsConst;
    private resolved?: dsviper.Attachment;

    constructor(runtimeId: dsviper.ValueUUId, definitions: () => dsviper.DefinitionsConst) {
        this.runtimeId = runtimeId;
        this.definitions = definitions;
    }

    /** The attachment as the definitions declare it. */
    get descriptor(): dsviper.Attachment {
        return (this.resolved ??= this.definitions().checkAttachment(this.runtimeId));
    }

    protected keysIn(getting: Getting | dsviper.Database): unknown {
        return wrap(getting.keys(this.descriptor));
    }

    protected hasIn(getting: Getting | dsviper.Database, key: unknown): boolean {
        return getting.has(this.descriptor, this.keyOf(key));
    }

    protected getIn(getting: Getting | dsviper.Database, key: unknown): unknown {
        return wrap(getting.get(this.descriptor, this.keyOf(key)));
    }

    protected enumerateIn(getting: dsviper.AttachmentGetting): unknown {
        return getting.enumerate(this.descriptor).map(([key, document]) => [wrap(key), wrap(document)]);
    }

    protected diffKeysOf(current: Getting, other: Getting): unknown {
        const groups = dsviper.AttachmentGetting.diffKeys(
            current as unknown as dsviper.AttachmentGetting,
            other as unknown as dsviper.AttachmentGetting, this.descriptor);
        return groups.map((group) => wrap(group));
    }

    protected setInDatabase(database: dsviper.Database, key: unknown, value: unknown): boolean {
        return database.set(this.descriptor, this.keyOf(key), unwrap(value) as dsviper.InputValue);
    }

    protected deleteIn(database: dsviper.Database, key: unknown): boolean {
        return database.delete(this.descriptor, this.keyOf(key));
    }

    protected setInState(state: Mutating, key: unknown, value: unknown): void {
        state.set(this.descriptor, this.keyOf(key), unwrap(value) as dsviper.InputValue);
    }

    protected diffIn(state: Mutating, key: unknown, value: unknown, recursive: boolean): void {
        state.diff(this.descriptor, this.keyOf(key), unwrap(value) as dsviper.InputValue, recursive);
    }

    protected updateField(state: Mutating, key: unknown, path: dsviper.PathConst, value: unknown): void {
        state.update(this.descriptor, this.keyOf(key), path ?? ROOT, unwrap(value) as dsviper.InputValue);
    }

    protected unionInSet(state: Mutating, key: unknown, path: dsviper.PathConst | undefined, value: unknown): void {
        state.unionInSet(this.descriptor, this.keyOf(key), path ?? ROOT, this.valueAt(path, value));
    }

    protected subtractInSet(state: Mutating, key: unknown, path: dsviper.PathConst | undefined, value: unknown): void {
        state.subtractInSet(this.descriptor, this.keyOf(key), path ?? ROOT, this.valueAt(path, value));
    }

    protected unionInMap(state: Mutating, key: unknown, path: dsviper.PathConst | undefined, value: unknown): void {
        state.unionInMap(this.descriptor, this.keyOf(key), path ?? ROOT, this.valueAt(path, value));
    }

    protected subtractInMap(state: Mutating, key: unknown, path: dsviper.PathConst | undefined, value: unknown): void {
        state.subtractInMap(this.descriptor, this.keyOf(key), path ?? ROOT, this.valueAt(path, value, "keys"));
    }

    protected updateInMap(state: Mutating, key: unknown, path: dsviper.PathConst | undefined, value: unknown): void {
        state.updateInMap(this.descriptor, this.keyOf(key), path ?? ROOT, this.valueAt(path, value));
    }

    protected insertInXArray(state: Mutating, key: unknown, path: dsviper.PathConst | undefined,
                             beforePosition: dsviper.ValueUUId, newPosition: dsviper.ValueUUId,
                             value: unknown): void {
        state.insertInXarray(this.descriptor, this.keyOf(key), path ?? ROOT,
                             beforePosition, newPosition, this.valueAt(path, value, "element"));
    }

    protected updateInXArray(state: Mutating, key: unknown, path: dsviper.PathConst | undefined,
                             position: dsviper.ValueUUId, value: unknown): void {
        state.updateInXarray(this.descriptor, this.keyOf(key), path ?? ROOT, position, this.valueAt(path, value, "element"));
    }

    protected removeInXArray(state: Mutating, key: unknown, path: dsviper.PathConst | undefined,
                             position: dsviper.ValueUUId): void {
        state.removeInXarray(this.descriptor, this.keyOf(key), path ?? ROOT, position);
    }

    private keyOf(key: unknown): dsviper.ValueKey {
        return unwrap(key) as dsviper.ValueKey;
    }

    private valueAt(path: dsviper.PathConst | undefined, value: unknown,
                    part: "whole" | "keys" | "element" = "whole"): dsviper.Value {
        const document = this.descriptor.documentType();
        const aggregate = path === undefined ? document : path.checkType(document)!;
        const type = part === "keys"
            ? new dsviper.TypeSet((aggregate as dsviper.TypeMap).keyType())
            : part === "element"
                ? (aggregate as dsviper.TypeXArray).elementType()
                : aggregate;
        const native = unwrap(value);
        return native instanceof dsviper.Value ? native : dsviper.Value.create(type, native);
    }
}

// The whole document: what an operation on a set, a map or an xarray document addresses.
const ROOT: dsviper.PathConst = new dsviper.Path().const();
