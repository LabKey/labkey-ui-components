import { SchemaQuery } from '../../public/SchemaQuery';
import { SCHEMAS } from '../schemas';

import React, { ReactNode } from 'react';

import { Map } from 'immutable';
import { getQueryDetails } from '../query/api';
import { downloadAttachment } from '../util/utils';
import { TemplateDownloadButton } from '../../public/files/TemplateDownloadButton';

interface Props {
    row?: Map<string, any>;
}

export class DataClassTemplateDownloadRenderer extends React.PureComponent<Props> {
    onDownload = (): void => {
        const { row } = this.props;
        const schemaQuery = new SchemaQuery(
            SCHEMAS.DATA_CLASSES.SCHEMA,
            row.getIn(['Name', 'value']) ?? row.getIn(['name', 'value'])
        );
        getQueryDetails({
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
        })
            .then(queryInfo => {
                downloadAttachment(queryInfo?.importTemplates?.[0].url, true);
            })
            .catch(reason => {
                console.error('Unable to retrieve queryDetails for schemaQuery', schemaQuery, reason);
            });
    };

    render(): ReactNode {
        return <TemplateDownloadButton onClick={this.onDownload} text="Download" className="button-small-padding" />;
    }
}
