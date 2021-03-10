import { fromJS, List, Record } from 'immutable';

import { QueryColumn } from '../index';

export class InferDomainResponse extends Record({
    data: List<any>(),
    fields: List<QueryColumn>(),
}) {
    declare data: List<any>;
    declare fields: List<QueryColumn>;

    static create(rawModel): InferDomainResponse {
        let data = List<any>();
        let fields = List<QueryColumn>();

        if (rawModel) {
            if (rawModel.data) {
                data = fromJS(rawModel.data);
            }

            if (rawModel.fields) {
                fields = List(rawModel.fields.map(QueryColumn.create));
            }
        }

        return new InferDomainResponse({
            data,
            fields,
        });
    }
}
