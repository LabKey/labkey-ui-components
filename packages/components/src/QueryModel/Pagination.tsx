import React, { PureComponent } from 'react';
import { ButtonGroup, DropdownButton, MenuItem } from 'react-bootstrap';

import { QueryModel, Tip } from '..';
import { PagingButton } from '../components/gridbar/QueryGridPaging';

import { RequiresModelAndActions } from './withQueryModels';
import { blurActiveElement } from '../util/utils';

interface PaginationInfoProps {
    model: QueryModel;
}

export class PaginationInfo extends PureComponent<PaginationInfoProps> {
    render() {
        const { model } = this.props;
        const { hasData, offset, maxRows, rowCount } = model;
        let message = '';

        if (hasData) {
            const min = offset !== rowCount ? offset + 1 : offset;
            let max = offset + maxRows;

            message = `${min} - `;

            if (max > rowCount) {
                max = rowCount;
            }

            message += `${max}`;

            if (max !== rowCount) {
                message += ` of ${rowCount}`;
            }
        }

        return <div className="pagination-info">{message}</div>;
    }
}

export class PageSelector extends PureComponent<RequiresModelAndActions> {
    loadFirstPage = () => {
        const { model, actions } = this.props;
        actions.loadFirstPage(model.id);
        blurActiveElement();
    };

    loadLastPage = () => {
        const { model, actions } = this.props;
        actions.loadLastPage(model.id);
        blurActiveElement();
    };

    render() {
        const { model } = this.props;
        const { id, currentPage, isFirstPage, isLastPage, isLoading, isPaged, pageCount } = model;

        return (
            isPaged && (
                <Tip caption="Current Page" trigger={['hover']}>
                    <DropdownButton id={`current-page-drop-${id}`} pullRight title={currentPage}>
                        <MenuItem header>Jump To</MenuItem>

                        <MenuItem disabled={isLoading || isFirstPage} onClick={this.loadFirstPage}>
                            First Page
                        </MenuItem>

                        <MenuItem disabled={isLoading || isLastPage} onClick={this.loadLastPage}>
                            Last Page
                        </MenuItem>

                        <MenuItem header>{isLoading ? '...' : pageCount} Total Pages</MenuItem>
                    </DropdownButton>
                </Tip>
            )
        );
    }
}

export class PaginationButtons extends PureComponent<RequiresModelAndActions> {
    loadPreviousPage = () => {
        const { model, actions } = this.props;
        actions.loadPreviousPage(model.id);
        blurActiveElement();
    };

    loadNextPage = () => {
        const { model, actions } = this.props;
        actions.loadNextPage(model.id);
        blurActiveElement();
    };

    render() {
        const { model, actions } = this.props;
        const { isFirstPage, isLastPage, isLoading, isPaged } = model;
        return (
            isPaged && (
                <ButtonGroup className="pagination-button-group">
                    <PagingButton
                        disabled={isLoading || isFirstPage}
                        iconClass="fa-chevron-left"
                        tooltip="Previous Page"
                        onClick={this.loadPreviousPage}
                    />

                    <PageSelector model={model} actions={actions} />

                    <PagingButton
                        disabled={isLoading || isLastPage}
                        iconClass="fa-chevron-right"
                        tooltip="Next Page"
                        onClick={this.loadNextPage}
                    />
                </ButtonGroup>
            )
        );
    }
}
