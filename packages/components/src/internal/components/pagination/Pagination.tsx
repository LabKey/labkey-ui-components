import React, { FC, memo, useCallback } from 'react';

import { LoadingState } from '../../../public/LoadingState';

import { incrementClientSideMetricCount } from '../../actions';

import { PaginationButton } from './PaginationButton';
import { PageMenu } from './PageMenu';
import { PaginationInfo } from './PaginationInfo';

export interface PaginationData {
    currentPage: number;
    disabled: boolean;
    isFirstPage: boolean;
    isLastPage: boolean;
    offset: number;
    pageCount: number;
    pageSize: number;
    rowCount: number;
    totalCountLoadingState?: LoadingState;
}

export interface PaginationProps extends PaginationData {
    loadFirstPage: () => void;
    loadLastPage: () => void;
    loadNextPage: () => void;
    loadPreviousPage: () => void;
    // pageSizes is expected to be sorted (ascending)
    pageSizes?: number[];
    setPageSize: (pageSize) => void;
}

const PAGINATION_METRIC_AREA = 'pagination';
const DEFAULT_PAGE_SIZES = [20, 40, 100, 250, 400];

export const Pagination: FC<PaginationProps> = memo(props => {
    const {
        currentPage,
        disabled,
        isFirstPage,
        isLastPage,
        loadFirstPage,
        loadLastPage,
        loadNextPage,
        loadPreviousPage,
        offset,
        pageCount,
        pageSize,
        pageSizes = DEFAULT_PAGE_SIZES,
        rowCount,
        setPageSize,
        totalCountLoadingState,
    } = props;
    const hasPages = rowCount > pageSizes[0];
    const outOfBounds = rowCount <= offset;
    const showPaginationButtons = hasPages || outOfBounds;

    const onLoadFirstPage = useCallback(() => {
        incrementClientSideMetricCount(PAGINATION_METRIC_AREA, 'loadFirstPage');
        loadFirstPage();
    }, [loadFirstPage]);

    const onLoadLastPage = useCallback(() => {
        incrementClientSideMetricCount(PAGINATION_METRIC_AREA, 'loadLastPage');
        loadLastPage();
    }, [loadLastPage]);

    const onLoadPreviousPage = useCallback(() => {
        incrementClientSideMetricCount(PAGINATION_METRIC_AREA, 'loadPreviousPage');
        // If the user accidentally landed out of bounds (can happen via a bug in our UI or a bookmark) then navigate
        // them to the last page when they hit the previous button.
        if (outOfBounds) loadLastPage();
        else loadPreviousPage();
    }, [outOfBounds, loadLastPage, loadPreviousPage]);

    const onLoadNextPage = useCallback(() => {
        incrementClientSideMetricCount(PAGINATION_METRIC_AREA, 'loadNextPage');
        loadNextPage();
    }, [loadNextPage]);

    const onSetPageSize = useCallback(
        (newPageSize: number) => {
            incrementClientSideMetricCount(PAGINATION_METRIC_AREA, 'setPageSize' + newPageSize);
            setPageSize(newPageSize);
        },
        [setPageSize]
    );

    // Use lk-pagination so we don't conflict with bootstrap pagination class.
    return (
        <div className="lk-pagination">
            <PaginationInfo
                offset={offset}
                pageSize={pageSize}
                rowCount={rowCount}
                totalCountLoadingState={totalCountLoadingState}
            />

            {showPaginationButtons && (
                <div className="pagination-button-group btn-group">
                    <PaginationButton
                        className="pagination-button--previous"
                        disabled={disabled || isFirstPage}
                        iconClass="fa-chevron-left"
                        tooltip="Previous Page"
                        onClick={onLoadPreviousPage}
                    />

                    <PageMenu
                        currentPage={currentPage}
                        disabled={disabled}
                        isFirstPage={isFirstPage}
                        isLastPage={isLastPage}
                        pageCount={pageCount}
                        loadFirstPage={onLoadFirstPage}
                        loadLastPage={onLoadLastPage}
                        pageSize={pageSize}
                        pageSizes={pageSizes}
                        setPageSize={onSetPageSize}
                    />

                    <PaginationButton
                        className="pagination-button--next"
                        disabled={disabled || isLastPage || outOfBounds}
                        iconClass="fa-chevron-right"
                        tooltip="Next Page"
                        onClick={onLoadNextPage}
                    />
                </div>
            )}
        </div>
    );
});
