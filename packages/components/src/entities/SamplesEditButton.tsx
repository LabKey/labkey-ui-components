import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { MenuItem } from 'react-bootstrap';
import { PermissionTypes } from '@labkey/api';

import { CrossFolderSelectionResult, EntityDataType } from '../internal/components/entities/models';

import { RequiresModelAndActions } from '../public/QueryModel/withQueryModels';

import { hasModule } from '../internal/app/utils';

import { useServerContext } from '../internal/components/base/ServerContext';
import { buildURL, createProductUrlFromParts } from '../internal/url/AppURL';
import { hasAnyPermissions } from '../internal/components/base/models/User';
import { RequiresPermission } from '../internal/components/base/Permissions';
import { ManageDropdownButton } from '../internal/components/buttons/ManageDropdownButton';
import { SelectionMenuItem } from '../internal/components/menus/SelectionMenuItem';
import { MAX_EDITABLE_GRID_ROWS } from '../internal/constants';
import { SampleTypeDataType } from '../internal/components/entities/constants';

import { getCrossFolderSelectionResult } from '../internal/components/entities/actions';

import { EntityCrossProjectSelectionConfirmModal } from '../internal/components/entities/EntityCrossProjectSelectionConfirmModal';

import { SamplesEditButtonSections } from '../internal/components/samples/utils';

import { getSampleTypeRowId } from '../internal/components/samples/actions';
import { SampleGridButtonProps } from '../internal/components/samples/models';
import { NEW_SAMPLES_HREF, SAMPLES_KEY } from '../internal/app/constants';

import { setSnapshotSelections } from '../internal/actions';

import { shouldIncludeMenuItem } from './utils';
import { SampleDeleteMenuItem } from './SampleDeleteMenuItem';
import { EntityLineageEditMenuItem } from './EntityLineageEditMenuItem';

interface OwnProps {
    combineParentTypes?: boolean;
    currentProductId?: string;
    parentEntityDataTypes: EntityDataType[];
    showLinkToStudy?: boolean;
    targetProductId?: string;
}

export const SamplesEditButton: FC<OwnProps & SampleGridButtonProps & RequiresModelAndActions> = memo(props => {
    const {
        afterSampleDelete,
        afterSampleActionComplete,
        showBulkUpdate,
        showLinkToStudy,
        parentEntityDataTypes,
        combineParentTypes,
        toggleEditWithGridUpdate,
        excludedMenuKeys,
        model,
        metricFeatureArea,
        currentProductId,
        targetProductId,
    } = props;
    const [crossFolderSelectionResult, setCrossFolderSelectionResult] = useState<CrossFolderSelectionResult>();
    const { user, moduleContext } = useServerContext();

    const handleMenuClick = useCallback(
        async (onClick: () => void, errorMsg?: string): Promise<void> => {
            if (model?.hasSelections) {
                setCrossFolderSelectionResult(undefined);
                const useSnapshotSelection = model.filterArray.length > 0;
                if (useSnapshotSelection) await setSnapshotSelections(model.id, [...model.selections]);
                const result = await getCrossFolderSelectionResult(model.id, 'sample', useSnapshotSelection);
                if (result.crossFolderSelectionCount > 0) {
                    setCrossFolderSelectionResult({
                        ...result,
                        title: errorMsg,
                    });
                } else {
                    onClick();
                }
            }
        },
        [model.filterArray.length, model?.hasSelections, model.id, model.selections]
    );

    const onToggleEditWithGridUpdate = useCallback(() => {
        handleMenuClick(toggleEditWithGridUpdate, 'Cannot Edit Samples');
    }, [handleMenuClick, toggleEditWithGridUpdate]);

    const onShowBulkUpdate = useCallback(() => {
        handleMenuClick(showBulkUpdate, 'Cannot Edit Samples');
    }, [handleMenuClick, showBulkUpdate]);

    const dismissCrossFolderError = useCallback(() => {
        setCrossFolderSelectionResult(undefined);
    }, []);

    const onLinkToStudy = useCallback(async (): Promise<void> => {
        if (model?.hasSelections) {
            const sampleTypeId = await getSampleTypeRowId(model.schemaQuery.queryName);
            window.location.href = buildURL('publish', 'sampleTypePublishStart.view', {
                dataRegionSelectionKey: model.id,
                containerFilterName: 'current',
                rowId: sampleTypeId,
            });
        }
    }, [model?.hasSelections, model.id, model.schemaQuery.queryName]);

    const updateSampleHref = useMemo(() => {
        const updateUrlParam = {
            target: model?.schemaQuery?.queryName,
            mode: 'update',
        };

        let href: any = NEW_SAMPLES_HREF.addParams(updateUrlParam).toHref();
        if (currentProductId && targetProductId && targetProductId !== currentProductId) {
            href = createProductUrlFromParts(targetProductId, currentProductId, updateUrlParam, SAMPLES_KEY, 'new');
        }

        return href;
    }, [currentProductId, targetProductId, model.schemaQuery.queryName]);

    if (!model || model.isLoading) return null;

    const showEdit =
        shouldIncludeMenuItem(SamplesEditButtonSections.EDIT, excludedMenuKeys) &&
        hasAnyPermissions(user, [PermissionTypes.Update, PermissionTypes.EditStorageData]);
    const showEditParent =
        shouldIncludeMenuItem(SamplesEditButtonSections.EDIT_PARENT, excludedMenuKeys) &&
        hasAnyPermissions(user, [PermissionTypes.Update]);
    const showDelete =
        shouldIncludeMenuItem(SamplesEditButtonSections.DELETE, excludedMenuKeys) &&
        hasAnyPermissions(user, [PermissionTypes.Delete]);
    const showStudy =
        showLinkToStudy &&
        hasModule('study', moduleContext) &&
        shouldIncludeMenuItem(SamplesEditButtonSections.LINKTOSTUDY, excludedMenuKeys) &&
        hasAnyPermissions(user, [PermissionTypes.Insert]);

    return (
        <RequiresPermission
            permissionCheck="any"
            perms={[
                PermissionTypes.Insert,
                PermissionTypes.Update,
                PermissionTypes.Delete,
                PermissionTypes.EditStorageData,
            ]}
        >
            <ManageDropdownButton id="samples-manage-btn" title="Edit" className="responsive-menu">
                {showEdit && (
                    <RequiresPermission
                        perms={[PermissionTypes.Update, PermissionTypes.EditStorageData]}
                        permissionCheck="any"
                    >
                        <SelectionMenuItem
                            id="update-samples-menu-item"
                            text="Edit in Grid"
                            onClick={onToggleEditWithGridUpdate}
                            maxSelection={MAX_EDITABLE_GRID_ROWS}
                            queryModel={model}
                            nounPlural={SampleTypeDataType.nounPlural}
                        />
                        {user.canUpdate && (
                            <SelectionMenuItem
                                id="bulk-update-samples-menu-item"
                                text="Edit in Bulk"
                                onClick={onShowBulkUpdate}
                                queryModel={model}
                                nounPlural={SampleTypeDataType.nounPlural}
                            />
                        )}
                        {model?.showImportDataButton && <MenuItem href={updateSampleHref}>Update from File</MenuItem>}
                        {showEditParent && (
                            <>
                                {user.canUpdate && parentEntityDataTypes?.length > 0 && <MenuItem divider />}
                                {!combineParentTypes &&
                                    user.canUpdate &&
                                    parentEntityDataTypes.map(parentEntityDataType => (
                                        <EntityLineageEditMenuItem
                                            key={parentEntityDataType.nounSingular}
                                            childEntityDataType={SampleTypeDataType}
                                            parentEntityDataTypes={[parentEntityDataType]}
                                            queryModel={model}
                                            onSuccess={afterSampleActionComplete}
                                            handleClick={handleMenuClick}
                                        />
                                    ))}
                                {combineParentTypes && user.canUpdate && (
                                    <EntityLineageEditMenuItem
                                        childEntityDataType={SampleTypeDataType}
                                        parentEntityDataTypes={parentEntityDataTypes}
                                        queryModel={model}
                                        onSuccess={afterSampleActionComplete}
                                        handleClick={handleMenuClick}
                                    />
                                )}
                            </>
                        )}
                    </RequiresPermission>
                )}
                {showEdit && (showDelete || showStudy) && <MenuItem divider />}
                {showDelete && (
                    <RequiresPermission perms={PermissionTypes.Delete}>
                        <SampleDeleteMenuItem
                            queryModel={model}
                            afterSampleDelete={afterSampleDelete}
                            metricFeatureArea={metricFeatureArea}
                            handleClick={handleMenuClick}
                        />
                    </RequiresPermission>
                )}
                {showStudy && (
                    <RequiresPermission perms={PermissionTypes.Insert}>
                        <SelectionMenuItem
                            id="link-to-study"
                            text="Link to LabKey Study"
                            onClick={onLinkToStudy}
                            queryModel={model}
                            nounPlural={SampleTypeDataType.nounPlural}
                        />
                    </RequiresPermission>
                )}
            </ManageDropdownButton>
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
        </RequiresPermission>
    );
});
