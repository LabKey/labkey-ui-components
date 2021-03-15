import { Record } from 'immutable';

export class QuerySort extends Record({
    dir: '',
    fieldKey: undefined,
}) {
    declare dir: string;
    declare fieldKey: string;

    toRequestString() {
        const { dir, fieldKey } = this;
        return dir === '-' ? '-' + fieldKey : fieldKey;
    }
}
