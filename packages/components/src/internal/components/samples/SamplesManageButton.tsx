import React, { FC, memo } from 'react';
import { MenuItem } from 'react-bootstrap';

import { PermissionTypes } from '@labkey/api';

import {
    AddToPicklistMenuItem,
    App,
    buildURL,
    EntityLineageEditMenuItem,
    ManageDropdownButton,
    MAX_EDITABLE_GRID_ROWS,
    RequiresPermission,
    SampleDeleteMenuItem,
    SampleTypeDataType,
    SelectionMenuItem,
} from '../../..';

import { EntityDataType } from '../entities/models';

import { RequiresModelAndActions } from '../../../public/QueryModel/withQueryModels';

import { SampleGridButtonProps } from './models';
import { getSampleTypeRowId } from './actions';
import { shouldShowButtons } from './utils';

const SAMPLE_IMPORT_TAB_ID = 2;

interface OwnProps {
    showLinkToStudy?: boolean;
    parentEntityDataTypes: EntityDataType[];
    combineParentTypes?: boolean;
}

export const SamplesManageButton: FC<OwnProps & SampleGridButtonProps & RequiresModelAndActions> = memo(props => {
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
        user,
    } = props;
    const { showImportDataButton, queryInfo } = model;
    const importSampleHref = App.NEW_SAMPLES_HREF.addParams({
        target: queryInfo?.schemaQuery?.queryName,
        tab: SAMPLE_IMPORT_TAB_ID,
    }).toHref();

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

    return (
        <RequiresPermission
            permissionCheck="any"
            perms={[PermissionTypes.Insert, PermissionTypes.Update, PermissionTypes.Delete]}
        >
            <ManageDropdownButton id="samples-manage-btn">
                {props.children}
                {shouldShowButtons('import', hideButtons) && showImportDataButton && (
                    <RequiresPermission perms={PermissionTypes.Insert}>
                        <MenuItem href={importSampleHref}>Import Samples</MenuItem>
                    </RequiresPermission>
                )}
                {shouldShowButtons('delete', hideButtons) && (
                    <RequiresPermission perms={PermissionTypes.Delete}>
                        <SampleDeleteMenuItem queryModel={model} afterSampleDelete={afterSampleDelete} />
                    </RequiresPermission>
                )}
                {shouldShowButtons('picklist', hideButtons) && <AddToPicklistMenuItem queryModel={model} user={user} />}
                {shouldShowButtons('edit', hideButtons) && (
                    <RequiresPermission perms={PermissionTypes.Update}>
                        <SelectionMenuItem
                            id="update-samples-menu-item"
                            text="Edit Selected Samples in Grid"
                            onClick={toggleEditWithGridUpdate}
                            maxSelection={MAX_EDITABLE_GRID_ROWS}
                            queryModel={model}
                            nounPlural={SampleTypeDataType.nounPlural}
                        />
                        <SelectionMenuItem
                            id="bulk-update-samples-menu-item"
                            text="Edit Selected Samples in Bulk"
                            onClick={showBulkUpdate}
                            queryModel={model}
                            nounPlural={SampleTypeDataType.nounPlural}
                        />
                        {!combineParentTypes &&
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
                        {combineParentTypes && (
                            <EntityLineageEditMenuItem
                                childEntityDataType={SampleTypeDataType}
                                parentEntityDataTypes={parentEntityDataTypes}
                                queryModel={model}
                                onSuccess={afterSampleActionComplete}
                            />
                        )}
                    </RequiresPermission>
                )}
                {showLinkToStudy && App.hasModule('study') && shouldShowButtons('linktostudy', hideButtons) && (
                    <RequiresPermission perms={PermissionTypes.Insert}>
                        <SelectionMenuItem
                            id="link-to-study"
                            text="Link to Study in LabKey Server"
                            onClick={onLinkToStudy}
                            queryModel={model}
                            nounPlural="samples"
                        />
                    </RequiresPermission>
                )}
            </ManageDropdownButton>
        </RequiresPermission>
    );
});
