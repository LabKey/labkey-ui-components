import { fromJS, List, Map, Record } from 'immutable';

import { ActionURL, Ajax, Utils } from '@labkey/api';

import { QueryColumn } from './QueryColumn';

export class InferDomainResponse extends Record({
    data: List<any>(),
    fields: List<QueryColumn>(),
    reservedFields: List<QueryColumn>(),
    commentLineCount: undefined,
    distinctValues: Map<string, List<string>>(),
}) {
    declare data: List<any>;
    declare fields: List<QueryColumn>;
    declare reservedFields: List<QueryColumn>;
    declare commentLineCount?: number;
    declare distinctValues: Map<string, List<string>>;

    static create(rawModel): InferDomainResponse {
        let data = List<any>();
        let fields = List<QueryColumn>();
        let reservedFields = List<QueryColumn>();
        let distinctValues = Map<string, List<string>>();

        if (rawModel) {
            if (rawModel.data) {
                data = fromJS(rawModel.data);
            }

            if (rawModel.fields) {
                fields = List(rawModel.fields.map(field => new QueryColumn(field)));
            }

            if (rawModel.reservedFields) {
                reservedFields = List(rawModel.reservedFields.map(field => new QueryColumn(field)));
            }

            if (rawModel.distinctValues) {
                distinctValues = Map<string, List<string>>(
                    Object.entries(rawModel.distinctValues).map(([key, value]) => [key, List<string>(value)])
                );
            }
        }

        return new InferDomainResponse({
            data,
            fields,
            reservedFields,
            commentLineCount: rawModel.commentLineCount,
            distinctValues,
        });
    }

    // get the distinct values for a specific column, return empty list if the column doesn't exist
    getDistinctValuesForColumn(columnName: string): List<string> {
        return this.distinctValues.get(columnName, List<string>());
    }
}

export function inferDomainFromFile(
    file: File | string, // file or webdav url path
    numLinesToInclude: number,
    domainKindName?: string,
    distinctValueColumns?: string[]
): Promise<InferDomainResponse> {
    return new Promise((resolve, reject) => {
        const form = new FormData();
        form.append('file', file);
        form.append('checkCommentLineCount', 'true');
        form.append('numLinesToInclude', numLinesToInclude ? (numLinesToInclude + 1).toString() : undefined);
        if (domainKindName) {
            form.append('domainKindName', domainKindName);
        }
        if (distinctValueColumns && distinctValueColumns.length > 0) {
            // append each value separately so they are received as an array on the server
            distinctValueColumns.forEach(col => form.append('distinctValueColumns', col));
        }

        Ajax.request({
            url: ActionURL.buildURL('property', 'inferDomain.api'),
            method: 'POST',
            form,
            success: Utils.getCallbackWrapper(response => {
                resolve(InferDomainResponse.create(response));
            }),
            failure: Utils.getCallbackWrapper(error => {
                console.error(error);
                reject(
                    'There was a problem determining the fields in the uploaded file.  Please check the format of the file.'
                );
            }),
        });
    });
}
