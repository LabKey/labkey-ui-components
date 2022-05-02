import React, { FC, memo } from 'react';
import { PermissionTypes } from '@labkey/api';

import { RequiresPermission, ResponsiveMenuButton } from '../../..';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { AssayImportSubMenuItem } from '../assay/AssayImportSubMenuItem';

import { isSamplesSchema } from './utils';

interface Props {
    model: QueryModel;
    providerType?: string;
    asSubMenu?: boolean;
}

export const SamplesAssayButton: FC<Props> = memo(props => {
    const { model, providerType, asSubMenu } = props;

    if (!isSamplesSchema(model?.schemaQuery)) return null;

    const items = (
        <AssayImportSubMenuItem
            queryModel={model?.hasSelections ? model : undefined}
            providerType={providerType}
            requireSelection={false}
            text={asSubMenu ? 'Import Assay Data' : null} // using null will render the submenu items inline in this button
        />
    );

    return (
        <RequiresPermission permissionCheck="any" perms={PermissionTypes.Insert}>
            <ResponsiveMenuButton id="samples-assay-menu" items={items} text="Assay" asSubMenu={asSubMenu} />
        </RequiresPermission>
    );
});
