/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo } from 'react';

export interface PaginationButtonsProps {
    total: number;
    currentPage: number;
    perPage: number;
    previousPage(): void;
    nextPage(): void;
}

export const PaginationButtons: FC<PaginationButtonsProps> = memo(props => {
    const { total, currentPage, perPage, previousPage, nextPage } = props;
    const pageStart = currentPage * perPage + 1;
    let pageEnd = (currentPage + 1) * perPage;
    const previousDisabled = currentPage === 0;

    if (pageEnd >= total) {
        pageEnd = total;
    }

    const isValid = !isNaN(pageStart) && !isNaN(pageEnd) && !isNaN(total) && pageStart <= pageEnd;

    return (
        <div className="pagination-buttons">
            <div className="pagination-buttons__info">
                {isValid && (
                    <>
                        <span className="pagination-info__start">{pageStart}</span>
                        <span> - </span>
                        <span className="pagination-info__end">{pageEnd}</span>
                        <span> of </span>
                        <span className="pagination-info__total">{total}</span>
                    </>
                )}
            </div>

            <div className="pagination-buttons__buttons btn-group">
                <button
                    className="pagination-buttons__prev btn btn-default"
                    onClick={previousPage}
                    disabled={previousDisabled}
                    type="button"
                >
                    <i className="fa fa-chevron-left" />
                </button>

                <button
                    className="pagination-buttons__next btn btn-default"
                    onClick={nextPage}
                    disabled={pageEnd >= total}
                    type="button"
                >
                    <i className="fa fa-chevron-right" />
                </button>
            </div>
        </div>
    );
});

PaginationButtons.displayName = 'PaginationButtons';
