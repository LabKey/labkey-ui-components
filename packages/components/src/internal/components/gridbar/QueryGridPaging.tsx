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
import React, { Component, ReactNode } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import { loadPage } from '../../actions';
import { QueryGridModel, Tip } from '../../..';
import { blurActiveElement } from '../../util/utils';
import { PaginationButton } from '../pagination/PaginationButton';

interface Props {
    model: QueryGridModel;
    showCounts?: boolean;
}

export class QueryGridPaging extends Component<Props> {
    static defaultProps = {
        showCounts: true,
    };

    shouldComponentUpdate(nextProps: Props): boolean {
        const { model } = this.props;
        const nextModel = nextProps.model;

        return !(
            model.isPaged === nextModel.isPaged &&
            model.totalRows === nextModel.totalRows &&
            model.selectedState === nextModel.selectedState &&
            model.getMinRowIndex() === nextModel.getMinRowIndex() &&
            model.getMaxRowIndex() === nextModel.getMaxRowIndex()
        );
    }

    getCurrentPage(): number {
        return this.props.model.pageNumber || 1;
    }

    nextPage = (): void => {
        this.goToPage(this.getCurrentPage() + 1);
    };

    prevPage = (): void => {
        this.goToPage(this.getCurrentPage() - 1);
    };

    goToPage = (pageNumber: number): void => {
        const { model } = this.props;
        loadPage(model, pageNumber);
        blurActiveElement(); // Issue 39418
    };

    render(): ReactNode {
        const { model, showCounts } = this.props;
        const min = model.getMinRowIndex();
        const max = model.getMaxRowIndex();
        const total = model.totalRows;
        const firstPageNumber = 1;
        const lastPageNumber = model.maxRows && model.maxRows > 0 ? Math.ceil(total / model.maxRows) : 1;
        const currentPage = this.getCurrentPage();

        if (!model.isPaged) {
            return null;
        }

        // hidden when "0 of 0" or "1 - N of N" and pageNumber is 1
        const showButtons = !(max === 0 || (min === 1 && max === total)) || currentPage > 1;

        return (
            <>
                {showCounts && total != 0 ? (
                    <span
                        className={showButtons ? 'paging-counts-with-buttons' : ''}
                        data-min={min}
                        data-max={max}
                        data-total={total}
                    >
                        {min === max ? (
                            <span>{max}</span>
                        ) : (
                            <span>
                                {max === 0 ? 0 : min}&nbsp;-&nbsp;{max}
                            </span>
                        )}{' '}
                        of {total}
                    </span>
                ) : null}
                {showButtons ? (
                    <div className="btn-group">
                        <PaginationButton
                            disabled={currentPage <= 1}
                            tooltip="Previous Page"
                            onClick={this.prevPage}
                            iconClass="fa-chevron-left"
                        />

                        <Tip caption="Current Page" trigger={['hover']}>
                            <DropdownButton id={`current-page-drop-${model.getId()}`} pullRight title={currentPage}>
                                <MenuItem header>Jump To</MenuItem>
                                <MenuItem
                                    key="first"
                                    disabled={currentPage === firstPageNumber}
                                    onClick={() => this.goToPage(firstPageNumber)}
                                >
                                    First Page
                                </MenuItem>
                                <MenuItem
                                    key="last"
                                    disabled={currentPage === lastPageNumber}
                                    onClick={() => this.goToPage(lastPageNumber)}
                                >
                                    Last Page
                                </MenuItem>
                                <MenuItem header>{lastPageNumber} Total Pages</MenuItem>
                            </DropdownButton>
                        </Tip>

                        <PaginationButton
                            disabled={max === total}
                            tooltip="Next Page"
                            onClick={this.nextPage}
                            iconClass="fa-chevron-right"
                        />
                    </div>
                ) : null}
            </>
        );
    }
}
