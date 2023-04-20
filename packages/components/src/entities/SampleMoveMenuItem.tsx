import React, { FC, memo, useCallback, useState } from 'react';

import { QueryModel } from '../public/QueryModel/QueryModel';
import { Actions } from '../public/QueryModel/withQueryModels';

import { MAX_EDITABLE_GRID_ROWS } from '../internal/constants';
import { SelectionMenuItem } from '../internal/components/menus/SelectionMenuItem';
import { SampleTypeDataType } from '../internal/components/entities/constants';
import { EntityMoveModal } from '../internal/components/entities/EntityMoveModal';
import { useAppContext } from '../internal/AppContext';
import { AppURL } from '../internal/url/AppURL';
import { SAMPLES_KEY } from '../internal/app/constants';

const ITEM_TEXT = 'Move to Project';

interface Props {
    actions: Actions;
    handleClick?: (cb: () => void, errorMsg?: string) => void;
    maxSelected?: number;
    queryModel: QueryModel;
}

export const SampleMoveMenuItem: FC<Props> = memo(props => {
    const { handleClick, maxSelected, queryModel, actions } = props;
    const [showMoveSamplesModal, setShowMoveSamplesModal] = useState<boolean>(false);
    const { api } = useAppContext();

    const onClick = useCallback(() => {
        if (queryModel.hasSelections) {
            if (handleClick) {
                handleClick(() => setShowMoveSamplesModal(true), 'Cannot Move Samples');
            } else {
                setShowMoveSamplesModal(true);
            }
        }
    }, [handleClick, queryModel]);

    const onAfterMove = useCallback(() => {
        actions.loadModel(queryModel.id, true, true);
    }, [actions, queryModel.id]);

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
                nounPlural={SampleTypeDataType.nounPlural}
            />
            {showMoveSamplesModal && (
                <EntityMoveModal
                    queryModel={queryModel}
                    useSelected
                    onAfterMove={onAfterMove}
                    onCancel={onClose}
                    maxSelected={maxSelected}
                    entityDataType={SampleTypeDataType}
                    moveFn={api.entity.moveSamples}
                    targetAppURL={AppURL.create(SAMPLES_KEY, queryModel.queryInfo.name)}
                />
            )}
        </>
    );
});

SampleMoveMenuItem.defaultProps = {
    maxSelected: MAX_EDITABLE_GRID_ROWS,
};
