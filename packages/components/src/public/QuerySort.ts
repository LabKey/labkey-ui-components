export const SORT_ASC = '+';
export const SORT_DESC = '-';

export type SortDirection = typeof SORT_ASC | typeof SORT_DESC;

export interface QuerySortJson {
    dir?: SortDirection;
    fieldKey: string;
}

export class QuerySort implements QuerySortJson {
    public dir?: SortDirection;
    public fieldKey: string;

    static fromString(sortStr: string): QuerySort {
        if (sortStr.startsWith(SORT_DESC)) {
            return new QuerySort({ dir: SORT_DESC, fieldKey: sortStr.slice(1) });
        } else if (sortStr.startsWith(SORT_ASC)) {
            return new QuerySort({ dir: SORT_ASC, fieldKey: sortStr.slice(1) });
        }

        return new QuerySort({ fieldKey: sortStr });
    }

    constructor(props: Partial<QuerySort>) {
        this.dir = props.dir === SORT_DESC ? SORT_DESC : SORT_ASC;
        this.fieldKey = props.fieldKey;
    }

    toRequestString(): string {
        return `${this.dir}${this.fieldKey}`;
    }
}
