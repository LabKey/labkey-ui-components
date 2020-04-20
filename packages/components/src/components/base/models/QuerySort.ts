import { Record } from 'immutable';

export class QuerySort extends Record({
    dir: '',
    fieldKey: undefined
}) {
    dir: string;
    fieldKey: string;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    toRequestString() {
        const { dir, fieldKey } = this;
        return dir === '-' ? '-' + fieldKey : fieldKey;
    }
}
