import React, { FC, memo, useCallback, useState } from 'react';
import { MenuItem } from 'react-bootstrap';

import { AuditBehaviorTypes } from '@labkey/api';

import { EntityDataType } from './models';
import { EntityLineageEditModal } from './EntityLineageEditModal';
import {QueryModel} from "../../../public/QueryModel/QueryModel";
import {SelectionMenuItem} from "../menus/SelectionMenuItem";

interface Props {
    queryModel: QueryModel;
    childEntityDataType: EntityDataType;
    parentEntityDataTypes: EntityDataType[];
    auditBehavior?: AuditBehaviorTypes;
    onSuccess?: () => void;
}

export const EntityLineageEditMenuItem: FC<Props> = memo(props => {
    const { childEntityDataType, parentEntityDataTypes, queryModel, auditBehavior, onSuccess } = props;
    const parentNounPlural = parentEntityDataTypes[0].nounPlural;
    const itemText = 'Edit ' + parentNounPlural;
    const [showEditModal, setShowEditModal] = useState<boolean>(false);

    const onClick = useCallback(() => {
        if (queryModel.hasSelections) {
            setShowEditModal(true);
        }
    }, [queryModel]);

    const onCancel = useCallback(() => {
        setShowEditModal(false);
    }, []);

    const _onSuccess = useCallback(() => {
        setShowEditModal(false);
        onSuccess?.();
    }, [onSuccess]);

    return (
        <>
            {queryModel !== undefined ? (
                <SelectionMenuItem
                    id="edit-entity-lineage-menu-item"
                    text={itemText}
                    onClick={onClick}
                    queryModel={queryModel}
                    nounPlural={childEntityDataType.nounPlural}
                />
            ) : (
                <MenuItem onClick={onClick} key="edit-entity-lineage-menu-item">
                    {itemText}
                </MenuItem>
            )}
            {showEditModal && (
                <EntityLineageEditModal
                    queryModel={queryModel}
                    onCancel={onCancel}
                    childEntityDataType={childEntityDataType}
                    auditBehavior={auditBehavior}
                    parentEntityDataTypes={parentEntityDataTypes}
                    onSuccess={_onSuccess}
                />
            )}
        </>
    );
});

EntityLineageEditMenuItem.defaultProps = {
    auditBehavior: AuditBehaviorTypes.DETAILED,
};
