import React, { FC, memo } from 'react';
import { PermissionTypes } from '@labkey/api';

import { QueryModel } from '../public/QueryModel/QueryModel';
import { RequiresPermission } from '../internal/components/base/Permissions';
import { ResponsiveMenuButton } from '../internal/components/buttons/ResponsiveMenuButton';
import { SampleCreationType } from '../internal/components/samples/models';
import { MAX_EDITABLE_GRID_ROWS } from '../internal/constants';
import { DisableableButton } from '../internal/components/buttons/DisableableButton';

import { CreateSamplesSubMenu, CreateSamplesSubMenuProps } from './CreateSamplesSubMenu';

export interface SamplesDeriveButtonBaseProps
    extends Omit<
        CreateSamplesSubMenuProps,
        'id' | 'menuText' | 'parentQueryModel' | 'selectedQueryInfo' | 'selectedType' | 'subMenuText'
    > {
    asSubMenu?: boolean;
    model: QueryModel;
}

export const SamplesDeriveButtonBase: FC<SamplesDeriveButtonBaseProps> = memo(props => {
    const { model, asSubMenu, ...createSampleMenuProps } = props;

    const selectedCount = model?.selections?.size ?? -1;
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
                        />
                        <CreateSamplesSubMenu
                            {...createSampleMenuProps}
                            id="derive-samples-menu-item"
                            menuText="Derive from Selected"
                            parentQueryModel={model}
                            selectedType={SampleCreationType.Derivatives}
                        />
                        <CreateSamplesSubMenu
                            {...createSampleMenuProps}
                            id="pool-samples-menu-item"
                            parentQueryModel={model}
                            selectedQueryInfo={model.queryInfo}
                            selectedType={SampleCreationType.PooledSamples}
                            subMenuText="Pool Selected"
                        />
                    </>
                }
                asSubMenu={asSubMenu}
            />
        </RequiresPermission>
    );
});
