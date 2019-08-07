import * as React from 'react';
import { Panel } from 'react-bootstrap';
import { Map } from 'immutable';
import { AppURL, AssayDefinitionModel } from '@glass/base';

interface Props {
    hasBatchProperties?: boolean
    assay: AssayDefinitionModel
    replacedRunProperties: Map<string, any>
}

export class AssayReimportHeader extends React.Component<Props> {

    render() {
        const { assay, hasBatchProperties, replacedRunProperties } = this.props;
        let assayRunUrl = AppURL.create('assays', assay.type, assay.name, 'runs', replacedRunProperties.getIn(['RowId']));
        return (
            <Panel>
                <Panel.Heading>
                    Reimport Run
                </Panel.Heading>
                <Panel.Body>
                    <p>
                        <strong>Reimporting Run: <a href={assayRunUrl.toHref()}>{replacedRunProperties.getIn(['Name'])}</a></strong>
                    </p>
                    <p>
                        Edit the {hasBatchProperties ? 'batch and ' : ''} run properties below or provide updated data for this assay run.  Changes will be reflected in the audit history for this run.
                    </p>
                </Panel.Body>
            </Panel>
        )
    }
}