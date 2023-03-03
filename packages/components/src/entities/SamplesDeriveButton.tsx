import React, { FC, memo, useEffect, useMemo, useState } from 'react';
import { PermissionTypes } from '@labkey/api';

import { QueryModel } from '../public/QueryModel/QueryModel';
import { RequiresPermission } from '../internal/components/base/Permissions';
import { ResponsiveMenuButton } from '../internal/components/buttons/ResponsiveMenuButton';
import { SampleCreationType } from '../internal/components/samples/models';
import { MAX_EDITABLE_GRID_ROWS } from '../internal/constants';
import { DisableableButton } from '../internal/components/buttons/DisableableButton';

import { CreateSamplesSubMenu, CreateSamplesSubMenuProps } from './CreateSamplesSubMenu';
import { getSelectedData } from '../internal/actions';

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
    const [selectionsAreSet, setSelectionsAreSet] = useState<boolean>(false);
    const [selectionData, setSelectionData] = useState<Map<any, any>>();
    const selectedCount = useMemo(() => model?.selections?.size ?? -1, [model?.selections]);
    const useSelectionData = useMemo(() => model?.filterArray.length > 0 && selectedCount <= MAX_EDITABLE_GRID_ROWS , [model?.filterArray]);

    useEffect(() => {
        (async () => {
            if (useSelectionData) {
                if (!model.isLoadingSelections) {
                    try {
                        const { data } = await getSelectedData(
                            model.schemaName,
                            model.queryName,
                            [...model.selections],
                            model.getRequestColumnsString(),
                            undefined
                        );
                        setSelectionData(data.toJS());
                        setSelectionsAreSet(true);
                    } catch (reason) {
                        console.error(
                            'There was a problem loading the filtered selection data. Your actions will not obey these filters.',
                            reason
                        );
                        setSelectionsAreSet(true);
                    }
                }
            } else {
                setSelectionsAreSet(true);
            }
        })();
    }, [
        useSelectionData,
        selectionsAreSet,
        model?.isLoadingSelections,
        model?.schemaName,
        model?.queryName,
        model?.selections,
        model?.selectionKey,
        model?.filterArray,
    ]);


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
