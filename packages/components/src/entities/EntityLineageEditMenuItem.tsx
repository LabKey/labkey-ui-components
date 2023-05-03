import React, { FC, memo, useCallback, useState } from 'react';
import { MenuItem } from 'react-bootstrap';

import { QueryModel } from '../public/QueryModel/QueryModel';

import { SelectionMenuItem } from '../internal/components/menus/SelectionMenuItem';

import { EntityDataType } from '../internal/components/entities/models';

import { EntityLineageEditModal } from './EntityLineageEditModal';

interface Props {
    childEntityDataType: EntityDataType;
    handleClick?: (cb: () => void, errorMsg?: string) => void;
    onSuccess?: () => void;
    parentEntityDataTypes: EntityDataType[];
    queryModel: QueryModel;
}

export const EntityLineageEditMenuItem: FC<Props> = memo(props => {
    const { childEntityDataType, parentEntityDataTypes, queryModel, onSuccess, handleClick } = props;
    const parentNounPlural = parentEntityDataTypes[0].nounPlural;
    const itemText = 'Edit ' + parentNounPlural;
    const [showEditModal, setShowEditModal] = useState<boolean>(false);

    const onClick = useCallback(() => {
        if (queryModel.hasSelections) {
            if (handleClick) handleClick(() => setShowEditModal(true), 'Cannot ' + itemText);
            else setShowEditModal(true);
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
                    parentEntityDataTypes={parentEntityDataTypes}
                    onSuccess={_onSuccess}
                />
            )}
        </>
    );
});
