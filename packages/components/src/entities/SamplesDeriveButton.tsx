import React, { FC, memo, useEffect, useMemo, useState } from 'react';
import { PermissionTypes } from '@labkey/api';

import { QueryModel } from '../public/QueryModel/QueryModel';
import { RequiresPermission } from '../internal/components/base/Permissions';
import { ResponsiveMenuButton } from '../internal/components/buttons/ResponsiveMenuButton';
import { SampleCreationType } from '../internal/components/samples/models';
import { MAX_EDITABLE_GRID_ROWS } from '../internal/constants';
import { DisableableButton } from '../internal/components/buttons/DisableableButton';

import { getSelectedData } from '../internal/actions';

import { CreateSamplesSubMenu, CreateSamplesSubMenuProps } from './CreateSamplesSubMenu';

export interface SamplesDeriveButtonProps
    extends Omit<
        CreateSamplesSubMenuProps,
        'id' | 'menuText' | 'parentQueryModel' | 'selectedQueryInfo' | 'selectedType' | 'subMenuText'
    > {
    asSubMenu?: boolean;
    model: QueryModel;
}

export const SamplesDeriveButton: FC<SamplesDeriveButtonProps> = memo(props => {
    const { model, asSubMenu, ...createSampleMenuProps } = props;
    const { filterArray, isLoadingSelections, schemaQuery, selections } = model;
    const [selectionData, setSelectionData] = useState<Record<any, any>>();
    const selectedCount = useMemo(() => selections?.size ?? -1, [selections]);
    const requestColumns = useMemo(() => model.getRequestColumnsString(), [model]);
    const useSelectionData = filterArray.length > 0 && selectedCount > 0 && selectedCount <= MAX_EDITABLE_GRID_ROWS;

    useEffect(() => {
        (async () => {
            if (useSelectionData && !isLoadingSelections) {
                try {
                    const { data } = await getSelectedData(
                        schemaQuery.schemaName,
                        schemaQuery.queryName,
                        [...selections],
                        requestColumns
                    );
                    setSelectionData(data.toJS());
                } catch (reason) {
                    console.error(
                        'There was a problem loading the filtered selection data. Your actions will not obey these filters.',
                        reason
                    );
                }
            }
        })();
    }, [useSelectionData, isLoadingSelections, schemaQuery, selections, requestColumns]);

    if (!asSubMenu && selectedCount > MAX_EDITABLE_GRID_ROWS) {
        return (
            <RequiresPermission permissionCheck="any" perms={PermissionTypes.Insert}>
                <DisableableButton
                    bsStyle="default"
                    className="responsive-menu"
                    disabledMsg={'At most ' + MAX_EDITABLE_GRID_ROWS + ' samples can be selected.'}
                    onClick={undefined}
                >
                    Derive
                </DisableableButton>
            </RequiresPermission>
        );
    }

    return (
        <RequiresPermission permissionCheck="any" perms={PermissionTypes.Insert}>
            <ResponsiveMenuButton
                id="samples-derive-menu"
                text="Derive"
                items={
                    <>
                        <CreateSamplesSubMenu
                            {...createSampleMenuProps}
                            id="aliquot-samples-menu-item"
                            parentQueryModel={model}
                            selectedQueryInfo={model.queryInfo}
                            selectedType={SampleCreationType.Aliquots}
                            subMenuText="Aliquot Selected"
                            selectionData={selectionData}
                            useSelectionData={useSelectionData}
                        />
                        <CreateSamplesSubMenu
                            {...createSampleMenuProps}
                            id="derive-samples-menu-item"
                            menuText="Derive from Selected"
                            parentQueryModel={model}
                            selectedType={SampleCreationType.Derivatives}
                            selectionData={selectionData}
                            useSelectionData={useSelectionData}
                        />
                        <CreateSamplesSubMenu
                            {...createSampleMenuProps}
                            id="pool-samples-menu-item"
                            parentQueryModel={model}
                            selectedQueryInfo={model.queryInfo}
                            selectedType={SampleCreationType.PooledSamples}
                            subMenuText="Pool Selected"
                            selectionData={selectionData}
                            useSelectionData={useSelectionData}
                        />
                    </>
                }
                asSubMenu={asSubMenu}
            />
        </RequiresPermission>
    );
});
