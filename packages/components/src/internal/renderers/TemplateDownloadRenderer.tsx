import React, { ReactNode } from 'react';

import { Map } from 'immutable';

import { Assay } from '@labkey/api';

import { TemplateDownloadButton } from '../../public/files/TemplateDownloadButton';
import { getSampleTypeTemplateUrl } from '../components/samples/utils';
import { downloadSampleTypeTemplate } from '../components/samples/actions';
import { SCHEMAS } from '../schemas';
import { SchemaQuery } from '../../public/SchemaQuery';

import { downloadAttachment } from '../util/utils';

interface Props {
    row?: Map<any, any>;
    excludeColumns?: string[];
}

export class SampleTypeTemplateDownloadRenderer extends React.PureComponent<Props> {
    onDownload = () => {
        const { row, excludeColumns } = this.props;
        const schemaQuery = SchemaQuery.create(
            SCHEMAS.SAMPLE_SETS.SCHEMA,
            row.getIn(['Name', 'value']) ?? row.getIn(['name', 'value'])
        );
        downloadSampleTypeTemplate(schemaQuery, getSampleTypeTemplateUrl, excludeColumns);
    };

    render(): ReactNode {
        return <TemplateDownloadButton onClick={this.onDownload} text="Download" className="button-small-padding" />;
    }
}

export class AssayResultTemplateDownloadRenderer extends React.PureComponent<Props> {
    onDownload = () => {
        const { row } = this.props;
        Assay.getByName({
            name: row.getIn(['Name', 'value']) ?? row.getIn(['name', 'value']),
            success: assayDef => {
                if (assayDef?.length) {
                    downloadAttachment(assayDef[0].templateLink, true);
                } else {
                    console.error('Assay definition not found for row', row.toJS());
                }
            },
            failure: () => {
                console.error('Error retrieving assay definition for row', row.toJS());
            },
        });
    };

    render(): ReactNode {
        return <TemplateDownloadButton onClick={this.onDownload} text="Download" className="button-small-padding" />;
    }
}
