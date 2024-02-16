import React, { FC, memo } from 'react';

import { ActionValue } from './grid/actions/Action';
import { Value } from './grid/Value';
import { filterActionValuesByType } from './grid/utils';

interface Props {
    actionValues: ActionValue[];
    onClick: (actionValue: ActionValue, event: any) => void;
    onRemove: (actionValueIndex: number, event: any) => void;
    onRemoveAll?: () => void;
}

export const FilterStatus: FC<Props> = memo(props => {
    const { actionValues, onClick, onRemove, onRemoveAll } = props;
    const showRemoveAll = filterActionValuesByType(actionValues, 'filter').length > 1;

    return (
        <div className="grid-panel__filter-status">
            {actionValues
                .sort((a, b) => {
                    // sort the view actions to the front
                    if (a.action.keyword !== b.action.keyword) {
                        return a.action.keyword === 'view' ? -1 : b.action.keyword === 'view' ? 1 : 0;
                    }

                    // then sort by filter display value
                    const aDisplayValue = a.displayValue ?? a.value;
                    const bDisplayValue = b.displayValue ?? b.value;
                    return aDisplayValue > bDisplayValue ? 1 : aDisplayValue < bDisplayValue ? -1 : 0;
                })
                .map((actionValue, index) => {
                    // loop over all actionValues so that the index remains consistent, but don't show sort actions
                    if (actionValue.action.keyword === 'sort') {
                        return null;
                    }

                    // only FilterActions can be edited via click
                    const _onClick = actionValue.action.keyword === 'filter' ? onClick : undefined;
                    // search and filter actions can be removed via click
                    const _onRemove =
                        actionValue.action.keyword === 'filter' || actionValue.action.keyword === 'search'
                            ? onRemove
                            : undefined;

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
