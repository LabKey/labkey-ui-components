import { Record } from 'immutable';

export class QuerySort extends Record({
    dir: '',
    fieldKey: undefined,
}) {
    dir: string;
    fieldKey: string;

    toRequestString() {
        const { dir, fieldKey } = this;
        return dir === '-' ? '-' + fieldKey : fieldKey;
    }
}
