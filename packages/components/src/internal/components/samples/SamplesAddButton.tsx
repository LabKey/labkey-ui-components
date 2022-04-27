import React, { FC, memo } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import { PermissionTypes } from '@labkey/api';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { App, RequiresPermission } from '../../..';

const SAMPLE_IMPORT_TAB_ID = 2;

interface Props {
    model: QueryModel;
    hideImport?: boolean;
}

export const SamplesAddButton: FC<Props> = memo(props => {
    const { model, hideImport } = props;
    const { showInsertNewButton, showImportDataButton, queryInfo } = model;
    const createSampleHref = App.NEW_SAMPLES_HREF.addParams({
        target: queryInfo?.schemaQuery?.queryName,
    }).toHref();
    const importSampleHref = App.NEW_SAMPLES_HREF.addParams({
        target: queryInfo?.schemaQuery?.queryName,
        tab: SAMPLE_IMPORT_TAB_ID,
    }).toHref();

    // Issue 43113: If a queryInfo is associated with this create action then respect its settings for display
    if (!showInsertNewButton && !showImportDataButton) return null;

    return (
        <RequiresPermission permissionCheck="any" perms={PermissionTypes.Insert}>
            <DropdownButton title="Add" id="samples-add-menu" bsStyle="success">
                {showInsertNewButton && <MenuItem href={createSampleHref}>Add Manually</MenuItem>}
                {showImportDataButton && !hideImport && <MenuItem href={importSampleHref}>Import from File</MenuItem>}
            </DropdownButton>
        </RequiresPermission>
    );
});
