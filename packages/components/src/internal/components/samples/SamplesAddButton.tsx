import React, { FC, memo } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import { PermissionTypes } from '@labkey/api';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { App, RequiresPermission, SubMenuItem } from '../../..';

const SAMPLE_IMPORT_TAB_ID = 2;

interface Props {
    model: QueryModel;
    hideImport?: boolean;
    asSubMenu?: boolean;
}

export const SamplesAddButton: FC<Props> = memo(props => {
    const { model, hideImport, asSubMenu } = props;
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

    const items = (
        <>
            {showInsertNewButton && <MenuItem href={createSampleHref}>Add Manually</MenuItem>}
            {showImportDataButton && !hideImport && <MenuItem href={importSampleHref}>Import from File</MenuItem>}
        </>
    )
    return (
        <RequiresPermission permissionCheck="any" perms={PermissionTypes.Insert}>
            {!asSubMenu && (
            <DropdownButton title="Add" id="samples-add-menu" bsStyle="success">
                {items}
            </DropdownButton>
            )}
            {asSubMenu && (
                <SubMenuItem text="Create Samples">{items}</SubMenuItem>
            )}
        </RequiresPermission>

    );
});
