import React from 'react';
import { Panel } from 'react-bootstrap';
import { Map } from 'immutable';

import { AppURL } from '../../url/AppURL';
import { AssayDefinitionModel } from '../../AssayDefinitionModel';

interface Props {
    hasBatchProperties?: boolean;
    assay: AssayDefinitionModel;
    replacedRunProperties: Map<string, any>;
}

export class AssayReimportHeader extends React.Component<Props> {
    render() {
        const { assay, hasBatchProperties, replacedRunProperties } = this.props;
        const assayRunUrl = AppURL.create('assays', assay.type, assay.name, 'runs', replacedRunProperties.get('RowId'));
        return (
            <Panel>
                <Panel.Heading>Re-Import Run</Panel.Heading>
                <Panel.Body>
                    <p>
                        <strong>
                            Replacing Run: <a href={assayRunUrl.toHref()}>{replacedRunProperties.get('Name')}</a>
                        </strong>
                    </p>
                    <p>
                        Edit the {hasBatchProperties ? 'batch and ' : ''} run properties below or provide updated data
                        for this assay run. Changes will be reflected in the audit history for this run.
                    </p>
                </Panel.Body>
            </Panel>
        );
    }
}
