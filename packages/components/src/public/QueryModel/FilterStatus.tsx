import React, { FC, memo } from 'react';

import { ActionValue } from './grid/actions/Action';
import { Value } from './grid/Value';
import { filterActionValuesByType } from './grid/utils';
import classNames from 'classnames';

interface Props {
    actionValues: ActionValue[];
    lockReadOnlyForDelete?: boolean;
    onAddFilterClick?: () => void;
    onClick: (actionValue: ActionValue, event: any) => void;
    onRemove: (actionValueIndex: number, event: any) => void;
    onRemoveAll?: () => void;
}

export const FilterStatus: FC<Props> = memo(props => {
    const { actionValues, onClick, onRemove, onRemoveAll, lockReadOnlyForDelete, onAddFilterClick } = props;
    const filterCount = actionValues?.filter(a => a.action.keyword === 'filter').length;
    const showRemoveAll = actionValues
        ? filterActionValuesByType(actionValues, 'filter', lockReadOnlyForDelete).length > 1
        : false;

    return (
        <div className="grid-panel__filter-status">
            {actionValues &&
                actionValues
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
                                actionValue={actionValue}
                                index={index}
                                key={index}
                                lockReadOnlyForDelete={lockReadOnlyForDelete}
                                onClick={_onClick}
                                onRemove={_onRemove}
                            />
                        );
                    })}

            {onAddFilterClick && (
                <button
                    className={classNames('btn btn-default', { 'margin-left': filterCount > 0 })}
                    onClick={onAddFilterClick}
                    type="button"
                >
                    <span className="fa fa-filter grid-panel__menu-icon" />
                    Add Filter
                </button>
            )}
            {onRemoveAll && showRemoveAll && (
                <a className="remove-all-filters" onClick={onRemoveAll}>
                    Remove all
                </a>
            )}
        </div>
    );
});
FilterStatus.displayName = 'FilterStatus';
