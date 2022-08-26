import React, { FC, memo } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import { PermissionTypes } from '@labkey/api';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { NEW_SAMPLES_HREF, SAMPLES_KEY } from '../../app/constants';
import {createProductUrlFromParts} from "../../url/AppURL";
import {RequiresPermission} from "../base/Permissions";
import {SubMenuItem} from "../menus/SubMenuItem";

const SAMPLE_IMPORT_TAB_ID = 2;

interface Props {
    asSubMenu?: boolean;
    bsStyle?: string;
    currentProductId?: string;
    hideImport?: boolean;
    model: QueryModel;
    targetProductId?: string;
    text?: string;
}

export const SamplesAddButton: FC<Props> = memo(props => {
    const {
        model,
        hideImport,
        asSubMenu,
        text = 'Add',
        bsStyle = 'default',
        currentProductId,
        targetProductId,
    } = props;
    const { showInsertNewButton, showImportDataButton, queryInfo } = model;
    const cls = bsStyle === 'default' ? 'responsive-menu' : '';
    const createUrlParam = {
        target: queryInfo?.schemaQuery?.queryName,
    };
    const importUrlParam = {
        target: queryInfo?.schemaQuery?.queryName,
        tab: SAMPLE_IMPORT_TAB_ID,
    };

    let createSampleHref: any = NEW_SAMPLES_HREF.addParams(createUrlParam).toHref();
    let importSampleHref: any = NEW_SAMPLES_HREF.addParams(importUrlParam).toHref();
    if (currentProductId && targetProductId && targetProductId !== currentProductId) {
        createSampleHref = createProductUrlFromParts(
            targetProductId,
            currentProductId,
            createUrlParam,
            SAMPLES_KEY,
            'new'
        );
        importSampleHref = createProductUrlFromParts(
            targetProductId,
            currentProductId,
            importUrlParam,
            SAMPLES_KEY,
            'new'
        );
    }

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
            {!asSubMenu && (
                <DropdownButton title={text} id="samples-add-menu" bsStyle={bsStyle} className={cls}>
                    {items}
                </DropdownButton>
            )}
            {asSubMenu && (
                <SubMenuItem text={text} inline>
                    {items}
                </SubMenuItem>
            )}
        </RequiresPermission>
    );
});
