import React, { ReactNode } from 'react';

import { Map } from 'immutable';

import { Assay } from '@labkey/api';

import { TemplateDownloadButton } from '../public/files/TemplateDownloadButton';

import { downloadAttachment } from '../internal/util/utils';

interface Props {
    excludeColumns?: string[];
    row?: Map<any, any>;
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
