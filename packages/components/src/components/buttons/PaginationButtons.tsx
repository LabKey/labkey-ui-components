/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { Button } from 'react-bootstrap';

export interface PaginationButtonsProps {
    total: number;
    currentPage: number;
    perPage: number;
    previousPage(): void;
    nextPage(): void;
}

export class PaginationButtons extends React.PureComponent<PaginationButtonsProps> {
    render() {
        const { total, currentPage, perPage, previousPage, nextPage } = this.props;
        const pageStart = currentPage * perPage + 1;
        let pageEnd = (currentPage + 1) * perPage;
        const previousDisabled = currentPage === 0;

        if (pageEnd >= total) {
            pageEnd = total;
        }

        const nextDisabled = pageEnd >= total;
        const isValid = !isNaN(pageStart) && !isNaN(pageEnd) && !isNaN(total) && pageStart <= pageEnd;
        let pageInfo;

        if (isValid) {
            pageInfo = (
                <>
                    <span className="pagination-info__start">{pageStart}</span>
                    <span> - </span>
                    <span className="pagination-info__end">{pageEnd}</span>
                    <span> of </span>
                    <span className="pagination-info__total">{total}</span>
                </>
            );
        }

        return (
            <div className="pagination-buttons">
                <div className="pagination-buttons__info">{pageInfo}</div>

                <div className="pagination-buttons__buttons btn-group">
                    <Button className="pagination-buttons__prev" onClick={previousPage} disabled={previousDisabled}>
                        <i className="fa fa-chevron-left" />
                    </Button>

                    <Button className="pagination-buttons__next" onClick={nextPage} disabled={nextDisabled}>
                        <i className="fa fa-chevron-right" />
                    </Button>
                </div>
            </div>
        );
    }
}
