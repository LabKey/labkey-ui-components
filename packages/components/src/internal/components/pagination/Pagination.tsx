import React, { PureComponent, ReactNode } from 'react';
import { ButtonGroup } from 'react-bootstrap';

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

export class Pagination extends PureComponent<PaginationProps> {
    static defaultProps = {
        pageSizes: [20, 40, 100, 250, 400],
    };

    onLoadFirstPage = () => {
        incrementClientSideMetricCount(PAGINATION_METRIC_AREA, 'loadFirstPage');
        this.props.loadFirstPage();
    };

    onLoadLastPage = () => {
        incrementClientSideMetricCount(PAGINATION_METRIC_AREA, 'loadLastPage');
        this.props.loadLastPage();
    };

    onLoadPreviousPage = () => {
        incrementClientSideMetricCount(PAGINATION_METRIC_AREA, 'loadPreviousPage');
        this.props.loadPreviousPage();
    };

    onLoadNextPage = () => {
        incrementClientSideMetricCount(PAGINATION_METRIC_AREA, 'loadNextPage');
        this.props.loadNextPage();
    };

    onSetPageSize = (pageSize: number) => {
        incrementClientSideMetricCount(PAGINATION_METRIC_AREA, 'setPageSize' + pageSize);
        this.props.setPageSize(pageSize);
    };

    render(): ReactNode {
        const {
            currentPage,
            disabled,
            isFirstPage,
            isLastPage,
            offset,
            pageSize,
            pageCount,
            pageSizes,
            rowCount,
            totalCountLoadingState,
        } = this.props;
        const showPaginationButtons = rowCount > pageSizes[0];

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
                    <ButtonGroup className="pagination-button-group">
                        <PaginationButton
                            className="pagination-button--previous"
                            disabled={disabled || isFirstPage}
                            iconClass="fa-chevron-left"
                            tooltip="Previous Page"
                            onClick={this.onLoadPreviousPage}
                        />

                        <PageMenu
                            currentPage={currentPage}
                            disabled={disabled}
                            isFirstPage={isFirstPage}
                            isLastPage={isLastPage}
                            pageCount={pageCount}
                            loadFirstPage={this.onLoadFirstPage}
                            loadLastPage={this.onLoadLastPage}
                            pageSize={pageSize}
                            pageSizes={pageSizes}
                            setPageSize={this.onSetPageSize}
                        />

                        <PaginationButton
                            className="pagination-button--next"
                            disabled={disabled || isLastPage}
                            iconClass="fa-chevron-right"
                            tooltip="Next Page"
                            onClick={this.onLoadNextPage}
                        />
                    </ButtonGroup>
                )}
            </div>
        );
    }
}
