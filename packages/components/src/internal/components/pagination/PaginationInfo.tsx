import React, { FC, memo } from 'react';

import { LoadingSpinner } from '../base/LoadingSpinner';
import { isLoading, LoadingState } from '../../../public/LoadingState';

export interface PaginationInfoProps {
    offset: number;
    pageSize: number;
    rowCount: number;
    totalCountLoadingState?: LoadingState;
}
export const PaginationInfo: FC<PaginationInfoProps> = memo(props => {
    const { offset, pageSize, rowCount, totalCountLoadingState } = props;
    const loading = isLoading(totalCountLoadingState);
    const outOfBounds = rowCount <= offset;
    const min = offset !== rowCount ? offset + 1 : offset;
    const max = offset + pageSize;
    const text = outOfBounds ? '' : `${min.toLocaleString()} - `;
    const showRowCount = !loading && !outOfBounds;
    const showTotalCount = !loading && rowCount > max;

    return (
        <span className="pagination-info" data-min={min} data-max={max} data-total={rowCount}>
            {text}
            {loading && <LoadingSpinner msg="" />}
            {showRowCount && <span>{max > rowCount ? rowCount.toLocaleString() : max.toLocaleString()}</span>}
            {showTotalCount && <span>{` of ${rowCount.toLocaleString()}`}</span>}
        </span>
    );
});
