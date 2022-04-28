import React, { FC, memo } from 'react';
import { MenuItem } from 'react-bootstrap';
import { PermissionTypes } from '@labkey/api';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { App, RequiresPermission, ResponsiveMenuButton } from '../../..';

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
    );

    return (
        <RequiresPermission permissionCheck="any" perms={PermissionTypes.Insert}>
            <ResponsiveMenuButton id="samples-add-menu" items={items} text="Create Samples" asSubMenu={asSubMenu} />
        </RequiresPermission>
    );
});
