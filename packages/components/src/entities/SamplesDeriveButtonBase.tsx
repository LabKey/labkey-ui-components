import React, { FC, memo } from 'react';

import { PermissionTypes } from '@labkey/api';

import { RequiresPermission } from '../internal/components/base/Permissions';
import { ResponsiveMenuButton } from '../internal/components/buttons/ResponsiveMenuButton';
import { QueryModel } from '../public/QueryModel/QueryModel';
import { AppURL } from '../internal/url/AppURL';
import { SchemaQuery } from '../public/SchemaQuery';

import { SampleCreationType } from '../internal/components/samples/models';
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
                subMenuText="Aliquot Selected"
                selectedType={SampleCreationType.Aliquots}
                parentQueryModel={model}
            />
            <CreateSamplesSubMenu
                {...props}
                id="derive-samples-menu-item"
                menuText="Derive from Selected"
                selectedType={SampleCreationType.Derivatives}
                parentQueryModel={model}
                inlineItemsCount={0}
            />
            <CreateSamplesSubMenu
                {...props}
                id="pool-samples-menu-item"
                subMenuText="Pool Selected"
                selectedType={SampleCreationType.PooledSamples}
                parentQueryModel={model}
            />
        </>
    );

    return (
        <RequiresPermission permissionCheck="any" perms={PermissionTypes.Insert}>
            <ResponsiveMenuButton id="samples-derive-menu" text="Derive" items={items} asSubMenu={asSubMenu} />
        </RequiresPermission>
    );
});
