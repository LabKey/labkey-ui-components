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
    const min = offset !== rowCount ? offset + 1 : offset;
    const max = offset + pageSize;
    const text = `${min} - `;

    return (
        <span className="pagination-info" data-min={min} data-max={max} data-total={rowCount}>
            {text}
            {loading && <LoadingSpinner msg="" />}
            {!loading && <span>{max > rowCount ? rowCount : max}</span>}
            {!loading && rowCount > max && <span>{` of ${rowCount}`}</span>}
        </span>
    );
});
