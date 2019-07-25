import * as React from 'react';
import { Panel } from 'react-bootstrap';
import { Map } from 'immutable';
import { AppURL, AssayDefinitionModel } from '@glass/base';

interface Props {
    hasBatchProperties?: boolean
    assay: AssayDefinitionModel
    replacedRunData: Map<string, any>
}

export class AssayReimportHeader extends React.Component<Props> {

    render() {
        const { assay, hasBatchProperties, replacedRunData } = this.props;
        let assayRunUrl = AppURL.create('assays', assay.type, assay.name, 'runs', replacedRunData.getIn(['RowId', 'value']));
        return (
            <Panel>
                <Panel.Heading>
                    Re-Import Run
                </Panel.Heading>
                <Panel.Body>
                    <p>
                        <strong>Re-importing Run: <a href={assayRunUrl.toHref()}>{replacedRunData.getIn(['Name', 'value'])}</a></strong>
                    </p>
                    <p>
                        Edit the {hasBatchProperties ? 'batch and ' : ''} run properties below or provide updated data for this assay run.  Changes will be reflected in the audit history for this run.
                    </p>
                </Panel.Body>
            </Panel>
        )
    }
}