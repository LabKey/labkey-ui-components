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
    const showRemoveAll =
        actionValues.filter(
            actionValue => actionValue.action.keyword === 'filter' || actionValue.action.keyword === 'search'
        ).length > 1;

    return (
        <div className="grid-panel__filter-status">
            {actionValues.map((actionValue, index) => {
                // loop over all actionValues so that the index remains consistent, but don't show SortActions
                if (actionValue.action.keyword === 'sort') {
                    return null;
                }

                // only allow for FilterActions to be edited / clicked
                const _onClick = actionValue.action.keyword === 'filter' ? onClick : undefined;
                // don't allow for ViewActions to be removed
                const _onRemove = actionValue.action.keyword === 'view' ? undefined : onRemove;

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
