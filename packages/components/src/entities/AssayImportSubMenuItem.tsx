import React, { FC, useCallback, useMemo, useState } from 'react';
import { MenuItem, OverlayTrigger, Popover } from 'react-bootstrap';

import { List } from 'immutable';

import { MAX_EDITABLE_GRID_ROWS } from '../internal/constants';

import { SubMenuItemProps } from '../internal/components/menus/SubMenuItem';
import { QueryModel } from '../public/QueryModel/QueryModel';
import { DisableableMenuItem } from '../internal/components/samples/DisableableMenuItem';

import { InjectedAssayModel, withAssayModels } from '../internal/components/assay/withAssayModels';

import { getCrossFolderSelectionResult } from '../internal/components/entities/actions';
import { MenuOption, SubMenu } from '../internal/components/menus/SubMenu';
import { isProjectContainer } from '../internal/app/utils';
import { EntityCrossProjectSelectionConfirmModal } from '../internal/components/entities/EntityCrossProjectSelectionConfirmModal';

import { setSnapshotSelections } from '../internal/actions';

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
    const [crossFolderSelectionResult, setCrossFolderSelectionResult] = useState(undefined);

    const onImportDataMenuSelectOnClick = useCallback(
        async (href: string) => {
            // check cross folder selection
            if (queryModel?.hasSelections) {
                setCrossFolderSelectionResult(undefined);
                const useSnapshotSelection = queryModel.filterArray.length > 0;
                if (useSnapshotSelection) await setSnapshotSelections(queryModel.id, [...queryModel.selections]);
                const result = await getCrossFolderSelectionResult(
                    queryModel.id,
                    'sample',
                    useSnapshotSelection,
                    undefined,
                    picklistName
                );

                if (result.crossFolderSelectionCount > 0) {
                    setCrossFolderSelectionResult({
                        ...result,
                        title: 'Cannot Import Assay Data',
                    });
                    return;
                }
            }

            window.location.href = href;
        },
        [queryModel]
    );

    const dismissCrossFolderError = useCallback(() => {
        setCrossFolderSelectionResult(undefined);
    }, []);

    const items: List<MenuOption> = useMemo(() => {
        if (!isLoaded) {
            return List();
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
            subItems = subItems.push({
                href: isProjectContainer() ? undefined : href,
                onClick: disabled || !isProjectContainer() ? undefined : () => onImportDataMenuSelectOnClick(href),
                name: assay.name,
                key: assay.name,
            });
            return subItems;
        }, List());
    }, [assayModel, isLoaded, providerType, queryModel, currentProductId, targetProductId, ignoreFilter]);

    const overlayMessage = useMemo(() => {
        if (!requireSelection) return '';

        const selectedCount = queryModel?.selections?.size;
        if (!selectedCount) {
            return 'Select one or more ' + nounPlural + '.';
        } else if (selectedCount > MAX_EDITABLE_GRID_ROWS) {
            return 'At most ' + MAX_EDITABLE_GRID_ROWS + ' ' + nounPlural + ' can be selected.';
        } else {
            return '';
        }
    }, [requireSelection, queryModel?.selections, nounPlural]);

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
    if (items.size === 0) {
        return null;
    }

    const badSelection = overlayMessage.length > 0;
    const menuProps = Object.assign({}, props, {
        disabled: badSelection,
        options: items,
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

    return (
        <>
            <SubMenu {...menuProps} />
            {crossFolderSelectionResult && (
                <EntityCrossProjectSelectionConfirmModal
                    crossFolderSelectionCount={crossFolderSelectionResult.crossFolderSelectionCount}
                    currentFolderSelectionCount={crossFolderSelectionResult.currentFolderSelectionCount}
                    onDismiss={dismissCrossFolderError}
                    title={crossFolderSelectionResult.title}
                    noun="sample"
                    nounPlural="samples"
                />
            )}
        </>
    );
};

export const AssayImportSubMenuItem = withAssayModels<Props>(AssayImportSubMenuItemImpl);
