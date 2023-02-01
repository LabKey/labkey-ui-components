import React, { ReactNode } from 'react';
import { Map } from 'immutable';

import { SchemaQuery } from '../public/SchemaQuery';
import { SCHEMAS } from '../internal/schemas';

import { TemplateDownloadButton } from '../public/files/TemplateDownloadButton';

import { QueryInfo } from '../public/QueryInfo';
import { getQueryDetails } from '../internal/query/api';
import { getSampleTypeDetails } from '../internal/components/samples/actions';
import { downloadAttachment } from '../internal/util/utils';

import { getSampleTypeTemplateUrl } from './utils';

interface Props {
    excludeColumns?: string[];
    row?: Map<any, any>;
}

export class SampleTypeTemplateDownloadRenderer extends React.PureComponent<Props> {
    onDownload = () => {
        const { row, excludeColumns } = this.props;
        const schemaQuery = new SchemaQuery(
            SCHEMAS.SAMPLE_SETS.SCHEMA,
            row.getIn(['Name', 'value']) ?? row.getIn(['name', 'value'])
        );
        downloadSampleTypeTemplate(schemaQuery, getSampleTypeTemplateUrl, excludeColumns);
    };

    render(): ReactNode {
        return <TemplateDownloadButton onClick={this.onDownload} text="Download" className="button-small-padding" />;
    }
}

export const downloadSampleTypeTemplate = (
    schemaQuery: SchemaQuery,
    getUrl: (queryInfo: QueryInfo, importAliases: Record<string, string>, excludeColumns?: string[]) => string,
    excludeColumns?: string[]
): void => {
    const promises = [];
    promises.push(
        getQueryDetails({
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
        })
    );
    promises.push(getSampleTypeDetails(schemaQuery));
    Promise.all(promises)
        .then(results => {
            const [queryInfo, domainDetails] = results;
            downloadAttachment(getUrl(queryInfo, domainDetails.options?.get('importAliases'), excludeColumns), true);
        })
        .catch(reason => {
            console.error('Unable to download sample type template', reason);
        });
};
