/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo } from 'react';
import classNames from 'classnames';

import { ActionKeyword, ActionValue } from './grid/actions/Action';
import { OnClickValue, OnRemoveValue, Value } from './grid/Value';
import { filterActionValuesByType } from './grid/utils';

interface Props {
    actionValues: ActionValue[];
    lockReadOnlyForDelete?: boolean;
    onAddFilterClick?: () => void;
    onClick: OnClickValue;
    onRemove: OnRemoveValue;
    onRemoveAll?: () => void;
    onSearchClick?: OnClickValue;
}

export const FilterStatus: FC<Props> = memo(props => {
    const { actionValues, onClick, onRemove, onRemoveAll, onSearchClick, lockReadOnlyForDelete, onAddFilterClick } =
        props;
    const filterCount = actionValues?.filter(a => a.action.keyword === ActionKeyword.Filter).length;
    const showRemoveAll = actionValues
        ? filterActionValuesByType(actionValues, ActionKeyword.Filter, lockReadOnlyForDelete).length > 1
        : false;

    return (
        <div className="grid-panel__filter-status">
            {actionValues &&
                actionValues
                    .sort((a, b) => {
                        // sort the view actions to the front
                        if (a.action.keyword !== b.action.keyword) {
                            if (a.action.keyword === ActionKeyword.View) return -1;
                            if (b.action.keyword === ActionKeyword.View) return 1;
                            return 0;
                        }

                        // then sort by filter display value
                        const aDisplayValue = a.displayValue ?? a.value;
                        const bDisplayValue = b.displayValue ?? b.value;
                        return aDisplayValue > bDisplayValue ? 1 : aDisplayValue < bDisplayValue ? -1 : 0;
                    })
                    .map((actionValue, index) => {
                        // loop over all actionValues so that the index remains consistent, but don't show sort actions
                        if (actionValue.action.keyword === ActionKeyword.Sort) {
                            return null;
                        }

                        // FilterActions open the filter modal; SearchActions are editable only when onSearchClick is given
                        let _onClick: OnClickValue;
                        let _onRemove: OnRemoveValue;
                        if (actionValue.action.keyword === ActionKeyword.Filter) {
                            _onClick = onClick;
                            _onRemove = onRemove;
                        } else if (actionValue.action.keyword === ActionKeyword.Search) {
                            _onClick = onSearchClick;
                            _onRemove = onRemove;
                        }

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
                <button className="remove-all-filters clickable-text" onClick={onRemoveAll} type="button">
                    Remove all
                </button>
            )}
        </div>
    );
});
FilterStatus.displayName = 'FilterStatus';
