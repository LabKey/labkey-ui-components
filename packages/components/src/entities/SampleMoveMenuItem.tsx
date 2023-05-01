import React, { FC, memo, useCallback, useState } from 'react';

import { QueryModel } from '../public/QueryModel/QueryModel';
import { Actions } from '../public/QueryModel/withQueryModels';

import { MAX_EDITABLE_GRID_ROWS } from '../internal/constants';
import { SelectionMenuItem } from '../internal/components/menus/SelectionMenuItem';
import { SampleTypeDataType } from '../internal/components/entities/constants';
import { EntityMoveModal } from '../internal/components/entities/EntityMoveModal';
import { useAppContext } from '../internal/AppContext';
import { AppURL } from '../internal/url/AppURL';
import { MEDIA_KEY, SAMPLES_KEY } from '../internal/app/constants';
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
}

export const SampleMoveMenuItem: FC<Props> = memo(props => {
    const { handleClick, maxSelected, queryModel, actions, onSuccess, entityDataType = SampleTypeDataType } = props;
    const [showMoveSamplesModal, setShowMoveSamplesModal] = useState<boolean>(false);
    const { api } = useAppContext();
    const isMedia = queryModel.queryInfo?.isMedia;

    const onClick = useCallback(() => {
        if (queryModel.hasSelections) {
            if (handleClick) {
                handleClick(
                    () => setShowMoveSamplesModal(true),
                    'Cannot Move ' + capitalizeFirstChar(entityDataType.nounPlural)
                );
            } else {
                setShowMoveSamplesModal(true);
            }
        }
    }, [entityDataType, handleClick, queryModel]);

    const onAfterMove = useCallback(() => {
        actions.loadModel(queryModel.id, true, true);
        onSuccess?.(true);
    }, [actions, queryModel.id, onSuccess]);

    const onClose = useCallback(() => {
        setShowMoveSamplesModal(false);
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
            {showMoveSamplesModal && (
                <EntityMoveModal
                    queryModel={queryModel}
                    useSelected
                    onAfterMove={onAfterMove}
                    onCancel={onClose}
                    maxSelected={maxSelected}
                    entityDataType={entityDataType}
                    moveFn={api.entity.moveSamples}
                    targetAppURL={AppURL.create(isMedia ? MEDIA_KEY : SAMPLES_KEY, queryModel.queryName)}
                />
            )}
        </>
    );
});

SampleMoveMenuItem.defaultProps = {
    maxSelected: MAX_EDITABLE_GRID_ROWS,
};
