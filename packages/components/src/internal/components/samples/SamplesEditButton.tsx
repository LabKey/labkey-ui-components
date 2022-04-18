import React, { FC, memo } from 'react';
import { MenuItem } from 'react-bootstrap';
import { PermissionTypes } from '@labkey/api';

import {
    App,
    buildURL,
    hasAnyPermissions,
    ManageDropdownButton,
    MAX_EDITABLE_GRID_ROWS,
    RequiresPermission,
    SampleTypeDataType,
    SelectionMenuItem,
    useServerContext,
} from '../../..';

import { EntityDataType } from '../entities/models';

import { RequiresModelAndActions } from '../../../public/QueryModel/withQueryModels';

import { SampleGridButtonProps } from './models';
import { getSampleTypeRowId } from './actions';
import { SamplesEditButtonSections, shouldShowButtons } from './utils';
import { SampleDeleteMenuItem } from './SampleDeleteMenuItem';
import { EntityLineageEditMenuItem } from '../entities/EntityLineageEditMenuItem';

interface OwnProps {
    showLinkToStudy?: boolean;
    parentEntityDataTypes: EntityDataType[];
    combineParentTypes?: boolean;
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
        hideButtons,
        model,
        metricFeatureArea,
    } = props;
    const { user } = useServerContext();

    if (!model || model.isLoading) return null;

    const onLinkToStudy = async (): Promise<void> => {
        if (model?.hasSelections) {
            const sampleTypeId = await getSampleTypeRowId(model.schemaQuery.queryName);
            window.location.href = buildURL('publish', 'sampleTypePublishStart.view', {
                dataRegionSelectionKey: model.id,
                containerFilterName: 'current',
                rowId: sampleTypeId,
            });
        }
    };

    const showEdit =
        shouldShowButtons(SamplesEditButtonSections.EDIT, hideButtons) &&
        hasAnyPermissions(user, [PermissionTypes.Update, PermissionTypes.EditStorageData]);
    const showDelete = shouldShowButtons(SamplesEditButtonSections.DELETE, hideButtons);
    const showStudy =
        showLinkToStudy &&
        App.hasModule('study') &&
        shouldShowButtons(SamplesEditButtonSections.LINKTOSTUDY, hideButtons);

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
            <ManageDropdownButton id="samples-manage-btn" title="Edit">
                {/*TODO can this be removed after all usages updated?*/}
                {props.children}
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
                        {user.canUpdate && <MenuItem divider />}
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
