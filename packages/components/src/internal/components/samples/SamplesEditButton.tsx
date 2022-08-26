import React, { FC, memo, useCallback } from 'react';
import { MenuItem } from 'react-bootstrap';
import { PermissionTypes } from '@labkey/api';

import { EntityDataType } from '../entities/models';

import { RequiresModelAndActions } from '../../../public/QueryModel/withQueryModels';

import { EntityLineageEditMenuItem } from '../entities/EntityLineageEditMenuItem';

import { hasModule } from '../../app/utils';

import { SampleGridButtonProps } from './models';
import { getSampleTypeRowId } from './actions';
import { SamplesEditButtonSections, shouldIncludeMenuItem } from './utils';
import { SampleDeleteMenuItem } from './SampleDeleteMenuItem';
import {useServerContext} from "../base/ServerContext";
import {buildURL} from "../../url/AppURL";
import {hasAnyPermissions} from "../base/models/User";
import {RequiresPermission} from "../base/Permissions";
import {ManageDropdownButton} from "../buttons/ManageDropdownButton";
import {SelectionMenuItem} from "../menus/SelectionMenuItem";
import {MAX_EDITABLE_GRID_ROWS} from "../../constants";
import {SampleTypeDataType} from "../entities/constants";

interface OwnProps {
    combineParentTypes?: boolean;
    parentEntityDataTypes: EntityDataType[];
    showLinkToStudy?: boolean;
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
    } = props;
    const { user, moduleContext } = useServerContext();

    if (!model || model.isLoading) return null;

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

    const showEdit =
        shouldIncludeMenuItem(SamplesEditButtonSections.EDIT, excludedMenuKeys) &&
        hasAnyPermissions(user, [PermissionTypes.Update, PermissionTypes.EditStorageData]);
    const showDelete = shouldIncludeMenuItem(SamplesEditButtonSections.DELETE, excludedMenuKeys);
    const showStudy =
        showLinkToStudy &&
        hasModule('study', moduleContext) &&
        shouldIncludeMenuItem(SamplesEditButtonSections.LINKTOSTUDY, excludedMenuKeys);

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
                            onClick={toggleEditWithGridUpdate}
                            maxSelection={MAX_EDITABLE_GRID_ROWS}
                            queryModel={model}
                            nounPlural={SampleTypeDataType.nounPlural}
                        />
                        {user.canUpdate && (
                            <SelectionMenuItem
                                id="bulk-update-samples-menu-item"
                                text="Edit in Bulk"
                                onClick={showBulkUpdate}
                                queryModel={model}
                                nounPlural={SampleTypeDataType.nounPlural}
                            />
                        )}
                        {user.canUpdate && parentEntityDataTypes?.length > 0 && <MenuItem divider />}
                        {!combineParentTypes &&
                            user.canUpdate &&
                            parentEntityDataTypes.map(parentEntityDataType => {
                                return (
                                    <EntityLineageEditMenuItem
                                        key={parentEntityDataType.nounSingular}
                                        childEntityDataType={SampleTypeDataType}
                                        parentEntityDataTypes={[parentEntityDataType]}
                                        queryModel={model}
                                        onSuccess={afterSampleActionComplete}
                                    />
                                );
                            })}
                        {combineParentTypes && user.canUpdate && (
                            <EntityLineageEditMenuItem
                                childEntityDataType={SampleTypeDataType}
                                parentEntityDataTypes={parentEntityDataTypes}
                                queryModel={model}
                                onSuccess={afterSampleActionComplete}
                            />
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
        </RequiresPermission>
    );
});
