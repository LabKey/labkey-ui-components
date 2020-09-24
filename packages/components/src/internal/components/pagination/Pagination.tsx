import React, { PureComponent, ReactNode } from 'react';
import { ButtonGroup } from 'react-bootstrap';

import { PaginationButton } from './PaginationButton';
import { PageMenu } from './PageMenu';
import { PageSizeMenu } from './PageSizeMenu';
import { PaginationInfo } from './PaginationInfo';

export interface PaginationData {
    currentPage: number;
    disabled: boolean;
    id: string;
    isFirstPage: boolean;
    isLastPage: boolean;
    offset: number;
    pageCount: number;
    pageSize: number;
    rowCount: number;
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

export class Pagination extends PureComponent<PaginationProps> {
    static defaultProps = {
        pageSizes: [20, 40, 100, 250, 400],
    };

    render(): ReactNode {
        const {
            currentPage,
            disabled,
            id,
            isFirstPage,
            isLastPage,
            loadFirstPage,
            loadLastPage,
            loadPreviousPage,
            loadNextPage,
            offset,
            pageSize,
            pageCount,
            pageSizes,
            rowCount,
            setPageSize,
        } = this.props;
        const showPageSizeMenu = rowCount > pageSizes[0];
        const showPaginationButtons = rowCount > pageSize;

        // Use lk-pagination so we don't conflict with bootstrap pagination class.
        return (
            <div className="lk-pagination">
                <PaginationInfo offset={offset} pageSize={pageSize} rowCount={rowCount} />

                {showPaginationButtons && (
                    <ButtonGroup className="pagination-button-group">
                        <PaginationButton
                            className="pagination-button--previous"
                            disabled={disabled || isFirstPage}
                            iconClass="fa-chevron-left"
                            tooltip="Previous Page"
                            onClick={loadPreviousPage}
                        />

                        <PageMenu
                            currentPage={currentPage}
                            disabled={disabled || (isFirstPage && isLastPage)}
                            id={id}
                            isFirstPage={isFirstPage}
                            isLastPage={isLastPage}
                            pageCount={pageCount}
                            loadFirstPage={loadFirstPage}
                            loadLastPage={loadLastPage}
                        />

                        <PaginationButton
                            className="pagination-button--next"
                            disabled={disabled || isLastPage}
                            iconClass="fa-chevron-right"
                            tooltip="Next Page"
                            onClick={loadNextPage}
                        />
                    </ButtonGroup>
                )}

                {showPageSizeMenu && (
                    <PageSizeMenu
                        disabled={disabled}
                        id={id}
                        pageSize={pageSize}
                        pageSizes={pageSizes}
                        setPageSize={setPageSize}
                    />
                )}
            </div>
        );
    }
}
