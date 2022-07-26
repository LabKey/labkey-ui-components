import React, { FC, memo } from 'react';

import { PermissionTypes } from '@labkey/api';

import {CreateSamplesSubMenu} from "./CreateSamplesSubMenu";
import {SampleCreationType} from "./models";
import {RequiresPermission} from "../base/Permissions";
import {ResponsiveMenuButton} from "../buttons/ResponsiveMenuButton";
import {QueryModel} from "../../../public/QueryModel/QueryModel";
import {AppURL} from "../../url/AppURL";
import {ProductMenuModel} from "../navigation/model";
import {SchemaQuery} from "../../../public/SchemaQuery";


interface Props {
    model: QueryModel;
    asSubMenu?: boolean;
    navigate: (url: string | AppURL) => any;
    isSelectingSamples: (schemaQuery: SchemaQuery) => boolean;
    currentProductId?: string;
    targetProductId?: string;
}

export const SamplesDeriveButtonBase: FC<Props> = memo(props => {
    const { model, asSubMenu } = props;

    const items = (
        <>
            <CreateSamplesSubMenu
                {...props}
                id={'aliquot-samples-menu-item'}
                subMenuText={'Aliquot Selected'}
                selectedType={SampleCreationType.Aliquots}
                parentQueryModel={model}
            />
            <CreateSamplesSubMenu
                {...props}
                id={'derive-samples-menu-item'}
                menuText={'Derive from Selected'}
                selectedType={SampleCreationType.Derivatives}
                parentQueryModel={model}
                inlineItemsCount={0}
            />
            <CreateSamplesSubMenu
                {...props}
                id={'pool-samples-menu-item'}
                subMenuText={'Pool Selected'}
                selectedType={SampleCreationType.PooledSamples}
                parentQueryModel={model}
            />
        </>
    )

    return (
        <RequiresPermission permissionCheck="any" perms={PermissionTypes.Insert}>
            <ResponsiveMenuButton id="samples-derive-menu" text="Derive" items={items} asSubMenu={asSubMenu} />
        </RequiresPermission>
    )
});
