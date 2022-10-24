import React, { FC, useMemo } from 'react';
import { MenuItem, OverlayTrigger, Popover } from 'react-bootstrap';

import { MAX_EDITABLE_GRID_ROWS } from '../internal/constants';

import { SubMenuItem, SubMenuItemProps } from '../internal/components/menus/SubMenuItem';
import { QueryModel } from '../public/QueryModel/QueryModel';
import { DisableableMenuItem } from '../internal/components/samples/DisableableMenuItem';

import { InjectedAssayModel, withAssayModels } from '../internal/components/assay/withAssayModels';
import { getImportItemsForAssayDefinitions } from './utils';

interface Props extends SubMenuItemProps {
    currentProductId?: string;
    disabled?: boolean;
    ignoreFilter?: boolean;
    isLoaded?: boolean;
    nounPlural?: string;
    picklistName?: string;
    providerType?: string;
    queryModel: QueryModel;
    requireSelection: boolean;
    targetProductId?: string;
}

// exported for jest testing
export const AssayImportSubMenuItemImpl: FC<Props & InjectedAssayModel> = props => {
    const {
        assayModel,
        disabled,
        isLoaded = true,
        nounPlural = 'items',
        picklistName,
        providerType,
        queryModel,
        requireSelection,
        text = 'Import Assay Data',
        currentProductId,
        targetProductId,
        ignoreFilter,
    } = props;

    const items = useMemo(() => {
        if (!isLoaded) {
            return [];
        }

        return getImportItemsForAssayDefinitions(
            assayModel,
            queryModel,
            providerType,
            !!picklistName,
            currentProductId,
            targetProductId,
            ignoreFilter
        ).reduce((subItems, href, assay) => {
            subItems.push({ text: assay.name, href });
            return subItems;
        }, []);
    }, [assayModel, isLoaded, providerType, queryModel, currentProductId, targetProductId, ignoreFilter]);

    if (disabled) {
        return <DisableableMenuItem operationPermitted={false}>{text}</DisableableMenuItem>;
    }
    if (!isLoaded) {
        return (
            <MenuItem disabled>
                <span className="fa fa-spinner fa-pulse" /> Loading assays...
            </MenuItem>
        );
    }

    // Only display menu if valid items are available
    if (items.length === 0) {
        return null;
    }

    const selectedCount = queryModel?.selections?.size ?? -1;

    const overlayMessage =
        requireSelection && selectedCount === 0
            ? 'Select one or more ' + nounPlural + '.'
            : selectedCount > MAX_EDITABLE_GRID_ROWS
            ? 'At most ' + MAX_EDITABLE_GRID_ROWS + ' ' + nounPlural + ' can be selected.'
            : '';
    const menuProps: Props = Object.assign({}, props, {
        disabled: overlayMessage.length > 0,
        items,
        queryModel: undefined,
        text,
        inline: text === null,
    });

    if (menuProps.disabled) {
        const overlay = <Popover id="assay-submenu-warning">{overlayMessage}</Popover>;

        return (
            <OverlayTrigger overlay={overlay} placement="right">
                <MenuItem disabled>{menuProps.text}</MenuItem>
            </OverlayTrigger>
        );
    }

    return <SubMenuItem {...menuProps} />;
};

export const AssayImportSubMenuItem = withAssayModels<Props>(AssayImportSubMenuItemImpl);
