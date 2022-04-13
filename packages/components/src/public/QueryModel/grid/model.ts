
export enum ChangeType {
    add = 'add',
    remove = 'remove',
    modify = 'modify',
    none = 'none',
}

export interface Change {
    type: ChangeType;
    index?: number;
}
