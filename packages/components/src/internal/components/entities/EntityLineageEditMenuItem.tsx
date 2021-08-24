import React, { FC, memo, useCallback, useState } from 'react';
import { MenuItem } from 'react-bootstrap';

import { AuditBehaviorTypes } from '@labkey/api';

import { capitalizeFirstChar, EntityDataType, QueryModel, SelectionMenuItem } from '../../..';
import { EntityLineageEditModal } from './EntityLineageEditModal';
import { getEntityNoun } from './utils';

interface Props {
    queryModel: QueryModel;
    childEntityDataType: EntityDataType;
    childName: string;
    parentEntityDataTypes: EntityDataType[][];
    key?: string;
    itemText?: string;
    auditBehavior?: AuditBehaviorTypes;
}

export const EntityLineageEditMenuItem: FC<Props> = memo(props => {
    const {
        childEntityDataType,
        childName,
        key,
        parentEntityDataTypes,
        queryModel,
        auditBehavior,
    } = props;
    const itemText = props.itemText ?? 'Edit Lineage for Selected ' + capitalizeFirstChar(getEntityNoun(childEntityDataType, queryModel.selections.size,));
    const [showEditModal, setShowEditModal] = useState<boolean>(false);

    const onClick = useCallback(() => {
        if (!queryModel || queryModel.hasSelections) {
            setShowEditModal(true);
        }
    }, [queryModel]);

    const onClose = useCallback(() => {
        setShowEditModal(false);
    }, []);

    const onSuccess = useCallback(() => {
        setShowEditModal(false)
    }, []);

    return (
        <>
            {queryModel !== undefined ? (
                <SelectionMenuItem
                    id={key}
                    text={itemText}
                    onClick={onClick}
                    queryModel={queryModel}
                    nounPlural={childEntityDataType.nounPlural}
                />
            ) : (
                <MenuItem onClick={onClick} key={key}>
                    {itemText}
                </MenuItem>
            )}
            {showEditModal && (
                <EntityLineageEditModal
                    queryModel={queryModel}
                    onCancel={onClose}
                    childEntityDataType={childEntityDataType}
                    childName={childName}
                    auditBehavior={auditBehavior}
                    parentEntityDataTypes={parentEntityDataTypes}
                    onSuccess={onSuccess}
                />
            )}
        </>
    );
});

EntityLineageEditMenuItem.defaultProps = {
    key: 'edit-entity-lineage-menu-item',
    auditBehavior: AuditBehaviorTypes.DETAILED,
};
