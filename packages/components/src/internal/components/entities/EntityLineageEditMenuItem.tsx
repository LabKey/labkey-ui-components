import React, { FC, memo, useCallback, useState } from 'react';
import { MenuItem } from 'react-bootstrap';

import { AuditBehaviorTypes } from '@labkey/api';

import { capitalizeFirstChar, EntityDataType, QueryModel, SelectionMenuItem } from '../../..';
import { EntityLineageEditModal } from './EntityLineageEditModal';
import { getEntityNoun } from './utils';

interface Props {
    queryModel: QueryModel;
    childEntityDataType: EntityDataType;
    parentEntityDataTypes: EntityDataType[];
    auditBehavior?: AuditBehaviorTypes;
}

export const EntityLineageEditMenuItem: FC<Props> = memo(props => {
    const {
        childEntityDataType,
        parentEntityDataTypes,
        queryModel,
        auditBehavior,
    } = props;
    const parentNounPlural = parentEntityDataTypes[0].nounPlural;
    const itemText =  'Edit ' + parentNounPlural + ' for Selected ' + capitalizeFirstChar(getEntityNoun(childEntityDataType, queryModel?.selections?.size) + ' in Bulk');
    const [showEditModal, setShowEditModal] = useState<boolean>(false);

    const onClick = useCallback(() => {
        if (queryModel.hasSelections) {
            setShowEditModal(true);
        }
    }, [queryModel]);

    const onClose = useCallback(() => {
        setShowEditModal(false);
    }, []);

    return (
        <>
            {queryModel !== undefined ? (
                <SelectionMenuItem
                    id={'edit-entity-lineage-menu-item'}
                    text={itemText}
                    onClick={onClick}
                    queryModel={queryModel}
                    nounPlural={childEntityDataType.nounPlural}
                />
            ) : (
                <MenuItem onClick={onClick} key={'edit-entity-lineage-menu-item'}>
                    {itemText}
                </MenuItem>
            )}
            {showEditModal && (
                <EntityLineageEditModal
                    queryModel={queryModel}
                    onCancel={onClose}
                    childEntityDataType={childEntityDataType}
                    auditBehavior={auditBehavior}
                    parentEntityDataTypes={parentEntityDataTypes}
                    onSuccess={onClose}
                />
            )}
        </>
    );
});

EntityLineageEditMenuItem.defaultProps = {
    auditBehavior: AuditBehaviorTypes.DETAILED,
};
