import React, { FC, memo, useCallback, useState } from 'react';

import { QueryModel } from '../public/QueryModel/QueryModel';
import { Actions } from '../public/QueryModel/withQueryModels';

import { MAX_EDITABLE_GRID_ROWS } from '../internal/constants';
import { SelectionMenuItem } from '../internal/components/menus/SelectionMenuItem';
import { SampleTypeDataType } from '../internal/components/entities/constants';
import { EntityMoveModal } from '../internal/components/entities/EntityMoveModal';
import { AppURL } from '../internal/url/AppURL';
import { EntityDataType } from '../internal/components/entities/models';
import { capitalizeFirstChar } from '../internal/util/utils';

const ITEM_TEXT = 'Move to Project';

interface Props {
    actions: Actions;
    entityDataType?: EntityDataType;
    handleClick?: (cb: () => void, errorMsg?: string) => void;
    maxSelected?: number;
    onSuccess?: (requiresModelReload: boolean) => void;
    queryModel: QueryModel;
    fromTypeRowId: number;
}

export const EntityMoveMenuItem: FC<Props> = memo(props => {
    const { handleClick, maxSelected, queryModel, actions, onSuccess, fromTypeRowId, entityDataType = SampleTypeDataType } = props;
    const [showModal, setShowModal] = useState<boolean>(false);

    const onClick = useCallback(() => {
        if (queryModel.hasSelections) {
            if (handleClick) {
                handleClick(
                    () => setShowModal(true),
                    'Cannot Move ' + capitalizeFirstChar(entityDataType.nounPlural)
                );
            } else {
                setShowModal(true);
            }
        }
    }, [entityDataType, handleClick, queryModel]);

    const onAfterMove = useCallback(() => {
        actions.loadModel(queryModel.id, true, true);
        onSuccess?.(true);
    }, [actions, queryModel.id, onSuccess]);

    const onClose = useCallback(() => {
        setShowModal(false);
    }, []);

    return (
        <>
            <SelectionMenuItem
                id="move-samples-menu-item"
                text={ITEM_TEXT}
                onClick={onClick}
                queryModel={queryModel}
                maxSelection={maxSelected}
                nounPlural={entityDataType.nounPlural.toLowerCase()}
            />
            {showModal && (
                <EntityMoveModal
                    queryModel={queryModel}
                    useSelected
                    onAfterMove={onAfterMove}
                    onCancel={onClose}
                    maxSelected={maxSelected}
                    entityDataType={entityDataType}
                    targetAppURL={AppURL.create(entityDataType.instanceKey, queryModel.queryName)}
                    fromTypeRowId={fromTypeRowId}
                />
            )}
        </>
    );
});

EntityMoveMenuItem.defaultProps = {
    maxSelected: MAX_EDITABLE_GRID_ROWS,
};
