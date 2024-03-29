export interface QuerySortJson {
    dir: string;
    fieldKey: string;
}

export class QuerySort implements QuerySortJson {
    declare dir: string;
    declare fieldKey: string;

    constructor(props: Partial<QuerySort>) {
        Object.assign(this, { dir: '' }, props);
    }

    toRequestString(): string {
        const { dir, fieldKey } = this;
        return dir === '-' ? '-' + fieldKey : fieldKey;
    }
}
