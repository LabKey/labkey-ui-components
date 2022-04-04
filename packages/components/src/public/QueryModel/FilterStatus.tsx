import React, { FC, memo } from 'react';

import { ActionValue } from '../../internal/components/omnibox/actions/Action';
import { Value } from '../../internal/components/omnibox/Value';

interface Props {
    actionValues: ActionValue[];
    onClick: (actionValue: ActionValue, event: any) => void;
    onRemove: (actionValueIndex: number, event: any) => void;
    onRemoveAll?: () => void;
}

export const FilterStatus: FC<Props> = memo(props => {
    const { actionValues, onClick, onRemove, onRemoveAll } = props;
    const showRemoveAll = actionValues.filter(actionValue => actionValue.action.keyword === 'filter').length > 1;

    return (
        <div className="grid-panel__filter-status">
            {actionValues.map((actionValue, index) => {
                // loop over all actionValues so that the index remains consistent, but don't show search or sort actions
                if (!(actionValue.action.keyword === 'filter' || actionValue.action.keyword === 'view')) {
                    return null;
                }

                // only allow for FilterActions to be edited / clicked and removed
                const _onClick = actionValue.action.keyword === 'filter' ? onClick : undefined;
                const _onRemove = actionValue.action.keyword === 'filter' ? onRemove : undefined;

                return (
                    <Value
                        key={index}
                        index={index}
                        actionValue={actionValue}
                        onClick={_onClick}
                        onRemove={_onRemove}
                    />
                );
            })}
            {onRemoveAll && showRemoveAll && (
                <a className="remove-all-filters" onClick={onRemoveAll}>
                    Remove all
                </a>
            )}
        </div>
    );
});
