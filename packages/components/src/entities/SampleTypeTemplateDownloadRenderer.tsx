import React, { ReactNode } from 'react';
import { Map } from 'immutable';

import { SchemaQuery } from '../public/SchemaQuery';
import { SCHEMAS } from '../internal/schemas';

import { TemplateDownloadButton } from '../public/files/TemplateDownloadButton';

import { downloadSampleTypeTemplate } from './actions';
import { getSampleTypeTemplateUrl } from './utils';

interface Props {
    excludeColumns?: string[];
    row?: Map<any, any>;
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
