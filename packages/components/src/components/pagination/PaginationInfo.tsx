import React, { FC } from 'react';

interface PaginationInfoProps {
    offset: number;
    pageSize: number;
    rowCount: number;
}
export const PaginationInfo: FC<PaginationInfoProps> = ({ offset, pageSize, rowCount }) => {
    const min = offset !== rowCount ? offset + 1 : offset;
    let max = offset + pageSize;

    let text = `${min} - `;

    if (max > rowCount) {
        max = rowCount;
    }

    text += `${max}`;

    if (max !== rowCount) {
        text += ` of ${rowCount}`;
    }

    return (
        <span className="pagination-info" data-min={min} data-max={max} data-total={rowCount}>
            {text}
        </span>
    );
};
