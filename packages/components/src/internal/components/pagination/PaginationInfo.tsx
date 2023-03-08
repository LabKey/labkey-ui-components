import React, { FC, memo } from 'react';

import { LoadingSpinner } from '../base/LoadingSpinner';
import { isLoading, LoadingState } from '../../../public/LoadingState';

interface PaginationInfoProps {
    offset: number;
    pageSize: number;
    rowCount: number;
    totalCountLoadingState?: LoadingState;
}
export const PaginationInfo: FC<PaginationInfoProps> = memo(props => {
    const { offset, pageSize, rowCount, totalCountLoadingState } = props;
    const loading = isLoading(totalCountLoadingState);
    const min = offset !== rowCount ? offset + 1 : offset;
    let max = offset + pageSize;

    let text = `${min} - `;

    if (max > rowCount) {
        max = rowCount;
    }

    text += `${max}`;

    return (
        <span className="pagination-info" data-min={min} data-max={max} data-total={rowCount}>
            {text}
            {loading && (
                <>
                    {' of '}
                    <LoadingSpinner msg="" />
                </>
            )}
            {!loading && max !== rowCount && <>{` of ${rowCount}`}</>}
        </span>
    );
});
