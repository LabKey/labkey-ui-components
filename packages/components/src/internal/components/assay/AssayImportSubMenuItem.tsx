import React, { FC, useMemo } from 'react';
import { MenuItem, OverlayTrigger, Popover } from 'react-bootstrap';

import { InjectedAssayModel, SubMenuItem, SubMenuItemProps, withAssayModels, QueryModel } from '../../..';
import { MAX_EDITABLE_GRID_ROWS } from '../../constants';

import { getImportItemsForAssayDefinitions } from './actions';

interface Props extends SubMenuItemProps {
    isLoaded?: boolean;
    queryModel?: QueryModel;
    requireSelection: boolean;
    nounPlural?: string;
    providerType?: string;
}

// exported for jest testing
export const AssayImportSubMenuItemImpl: FC<Props & InjectedAssayModel> = props => {
    const {
        assayModel,
        isLoaded = true,
        nounPlural = 'items',
        providerType,
        queryModel,
        requireSelection,
        text = 'Upload Assay Data',
    } = props;

    const items = useMemo(() => {
        if (!isLoaded) {
            return [];
        }

        const importItems = getImportItemsForAssayDefinitions(assayModel, queryModel, providerType);

        // Convert OrderedMap to array.
        return importItems.reduce((subItems, href, assay) => {
            subItems.push({ text: assay.name, href });
            return subItems;
        }, []);
    }, [assayModel, isLoaded, providerType, queryModel]);

    if (!isLoaded) {
        return (
            <MenuItem disabled={true}>
                <span className="fa fa-spinner fa-pulse" /> Loading assays...
            </MenuItem>
        );
    }

    // Only display menu if valid items are available
    if (items.length === 0) {
        return null;
    }

    let selectedCount = -1;
    if (queryModel !== undefined) {
        selectedCount = queryModel.selections?.size ?? -1;
    }

    const overlayMessage =
        requireSelection && selectedCount === 0
            ? 'Select one or more ' + nounPlural + '.'
            : selectedCount > MAX_EDITABLE_GRID_ROWS
            ? 'At most ' + MAX_EDITABLE_GRID_ROWS + ' ' + nounPlural + ' can be selected.'
            : '';
    const menuProps: Props = Object.assign({}, props, {
        disabled: overlayMessage.length > 0,
        items,
        model: undefined,
        queryModel: undefined,
        text,
    });

    if (menuProps.disabled) {
        const overlay = <Popover id="assay-submenu-warning">{overlayMessage}</Popover>;

        return (
            <OverlayTrigger overlay={overlay} placement="right">
                <MenuItem disabled={true}>{menuProps.text}</MenuItem>
            </OverlayTrigger>
        );
    }

    return <SubMenuItem {...menuProps} />;
};

export const AssayImportSubMenuItem = withAssayModels<Props>(AssayImportSubMenuItemImpl);
