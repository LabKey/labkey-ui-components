import React from 'react';
import { Panel } from 'react-bootstrap';

import { AssayDefinitionModel } from '../../AssayDefinitionModel';
import {caseInsensitive} from "../../util/utils";
import {AppURL} from "../../url/AppURL";

interface Props {
    hasBatchProperties?: boolean;
    assay: AssayDefinitionModel;
    replacedRunProperties: Record<string, any>;
}

export class AssayReimportHeader extends React.Component<Props> {
    render() {
        const { assay, hasBatchProperties, replacedRunProperties } = this.props;
        const rowId = caseInsensitive(replacedRunProperties, 'RowId').value;
        const name = caseInsensitive(replacedRunProperties, 'Name').value;
        const assayRunUrl = AppURL.create('assays', assay.type, assay.name, 'runs', rowId);
        return (
            <Panel>
                <Panel.Heading>Re-Import Run</Panel.Heading>
                <Panel.Body>
                    <p>
                        <strong>
                            Replacing Run: <a href={assayRunUrl.toHref()}>{name}</a>
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
