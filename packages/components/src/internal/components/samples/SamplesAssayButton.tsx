import React, { FC, memo } from 'react';
import { DropdownButton } from 'react-bootstrap';
import { PermissionTypes } from '@labkey/api';

import { RequiresPermission } from '../../..';

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
            text={asSubMenu ? 'Assay' : null} // using null will render the submenu items inline in this button
        />
    );

    return (
        <RequiresPermission permissionCheck="any" perms={PermissionTypes.Insert}>
            {!asSubMenu && (
                <DropdownButton title="Assay" id="samples-assay-menu" className="responsive-menu">
                    {items}
                </DropdownButton>
            )}
            {asSubMenu && items}
        </RequiresPermission>
    );
});
