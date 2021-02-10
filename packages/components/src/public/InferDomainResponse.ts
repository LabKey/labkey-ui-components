import { fromJS, List, Record } from 'immutable';
import { QueryColumn } from '../index';

export class InferDomainResponse extends Record({
    data: List<any>(),
    fields: List<QueryColumn>(),
}) {
    data: List<any>;
    fields: List<QueryColumn>;

    static create(rawModel): InferDomainResponse {
        let data = List<any>();
        let fields = List<QueryColumn>();

        if (rawModel) {
            if (rawModel.data) {
                data = fromJS(rawModel.data);
            }

            if (rawModel.fields) {
                fields = List(rawModel.fields.map(field => QueryColumn.create(field)));
            }
        }

        return new InferDomainResponse({
            data,
            fields,
        });
    }
}
