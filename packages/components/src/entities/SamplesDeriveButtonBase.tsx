import React, { FC, memo } from 'react';
import { PermissionTypes } from '@labkey/api';

import { SchemaQuery } from '../public/SchemaQuery';
import { QueryModel } from '../public/QueryModel/QueryModel';
import { RequiresPermission } from '../internal/components/base/Permissions';
import { ResponsiveMenuButton } from '../internal/components/buttons/ResponsiveMenuButton';
import { AppURL } from '../internal/url/AppURL';
import { SampleCreationType } from '../internal/components/samples/models';
import { MAX_EDITABLE_GRID_ROWS } from '../internal/constants';
import { DisableableButton } from '../internal/components/buttons/DisableableButton';

import { CreateSamplesSubMenu } from './CreateSamplesSubMenu';

interface Props {
    asSubMenu?: boolean;
    currentProductId?: string;
    isSelectingSamples?: (schemaQuery: SchemaQuery) => boolean;
    model: QueryModel;
    navigate: (url: string | AppURL) => any;
    targetProductId?: string;
}

export const SamplesDeriveButtonBase: FC<Props> = memo(props => {
    const { model, asSubMenu } = props;

    const items = (
        <>
            <CreateSamplesSubMenu
                {...props}
                id="aliquot-samples-menu-item"
                parentQueryModel={model}
                selectedQueryInfo={model.queryInfo}
                selectedType={SampleCreationType.Aliquots}
                subMenuText="Aliquot Selected"
            />
            <CreateSamplesSubMenu
                {...props}
                id="derive-samples-menu-item"
                menuText="Derive from Selected"
                parentQueryModel={model}
                selectedType={SampleCreationType.Derivatives}
            />
            <CreateSamplesSubMenu
                {...props}
                id="pool-samples-menu-item"
                parentQueryModel={model}
                selectedQueryInfo={model.queryInfo}
                selectedType={SampleCreationType.PooledSamples}
                subMenuText="Pool Selected"
            />
        </>
    );

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
            <ResponsiveMenuButton id="samples-derive-menu" text="Derive" items={items} asSubMenu={asSubMenu} />
        </RequiresPermission>
    );
});
