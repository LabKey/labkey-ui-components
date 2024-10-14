import React, { FC, memo } from 'react';

import { caseInsensitive } from '../../util/utils';
import { AppURL } from '../../url/AppURL';
import { Alert } from '../base/Alert';

interface PlateAssayReimportHeaderProps {
    replacedRunProperties: Record<string, any>;
}

export const PlateAssayReimportHeader: FC<PlateAssayReimportHeaderProps> = memo(({ replacedRunProperties }) => {
    const runName = caseInsensitive(replacedRunProperties, 'Name').value;

    return (
        <div className="panel panel-default">
            <div className="panel-heading">Update Assay Run Data</div>
            <div className="panel-body">
                <Alert bsStyle="warning">Data for <strong>4 plates in this Plate Set</strong> has already been imported in run: {runName}</Alert>
                <ul>
                    <li>If you update any data for a plate, the entire plate's data will be replaced with the new data.</li>
                    <li>To avoid partial results, upload full plates of data, not just wells with changes.</li>
                    <li>If you don't upload any data for a plate, its current data will be retained.</li>
                </ul>
            </div>
        </div>
    );
});

PlateAssayReimportHeader.displayName = 'PlateAssayReimportHeader';

interface AssayReimportHeaderProps {
    hasBatchProperties?: boolean;
    replacedRunProperties: Record<string, any>;
}

export const AssayReimportHeader: FC<AssayReimportHeaderProps> = memo(props => {
    const { hasBatchProperties, replacedRunProperties } = props;
    const runRowId = caseInsensitive(replacedRunProperties, 'RowId').value;
    const name = caseInsensitive(replacedRunProperties, 'Name').value;
    const assayRunUrl = AppURL.create('rd', 'assayrun', runRowId);

    return (
        <div className="panel panel-default">
            <div className="panel-heading">Re-Import Run</div>
            <div className="panel-body">
                <p>
                    <strong>
                        Replacing Run: <a href={assayRunUrl.toHref()}>{name}</a>
                    </strong>
                </p>
                <p>
                    Edit the {hasBatchProperties ? 'batch and ' : ''} run properties below or provide updated data for
                    this assay run. Changes will be reflected in the audit history for this run.
                </p>
            </div>
        </div>
    );
});

AssayReimportHeader.displayName = 'AssayReimportHeader';
