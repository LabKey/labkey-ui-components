import React, { FC, memo, useCallback, useState } from 'react';
import { MenuItem } from 'react-bootstrap';

import { AuditBehaviorTypes } from '@labkey/api';

import { capitalizeFirstChar, EntityDataType, QueryModel, SelectionMenuItem } from '../../..';
import { EntityLineageEditModal } from './EntityLineageEditModal';
import { getEntityNoun } from './utils';

interface Props {
    queryModel: QueryModel;
    childEntityDataType: EntityDataType;
    parentNounPlural: string;
    parentNounSingular: string;
    parentEntityDataTypes: EntityDataType[];
    itemText?: string;
    auditBehavior?: AuditBehaviorTypes;
}

export const EntityLineageEditMenuItem: FC<Props> = memo(props => {
    const {
        childEntityDataType,
        parentEntityDataTypes,
        queryModel,
        auditBehavior,
        parentNounPlural,
        parentNounSingular,
    } = props;
    const itemText = props.itemText ?? 'Edit ' + parentNounPlural + ' for Selected ' + capitalizeFirstChar(getEntityNoun(childEntityDataType, queryModel?.selections?.size) + ' in Bulk');
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
                    parentNounPlural={parentNounPlural}
                    parentNounSingular={parentNounSingular}
                    onSuccess={onSuccess}
                />
            )}
        </>
    );
});

EntityLineageEditMenuItem.defaultProps = {
    auditBehavior: AuditBehaviorTypes.DETAILED,
};
