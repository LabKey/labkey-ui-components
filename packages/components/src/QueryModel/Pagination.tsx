import React, { PureComponent } from 'react';
import { ButtonGroup, DropdownButton, MenuItem } from 'react-bootstrap';

import { QueryModel, Tip } from '..';
import { PagingButton } from '../components/gridbar/QueryGridPaging';

import { RequiresModelAndActions } from './withQueryModels';

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
    render() {
        const { model, actions } = this.props;
        const { loadFirstPage, loadLastPage } = actions;
        const { id, currentPage, isFirstPage, isLastPage, isLoading, isPaged, pageCount } = model;

        return (
            isPaged && (
                <Tip caption="Current Page" trigger={['hover']}>
                    <DropdownButton id={`current-page-drop-${id}`} pullRight title={currentPage}>
                        <MenuItem header>Jump To</MenuItem>

                        <MenuItem disabled={isLoading || isFirstPage} onClick={() => loadFirstPage(id)}>
                            First Page
                        </MenuItem>

                        <MenuItem disabled={isLoading || isLastPage} onClick={() => loadLastPage(id)}>
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
    render() {
        const { model, actions } = this.props;
        const { id, isFirstPage, isLastPage, isLoading, isPaged } = model;
        return (
            isPaged && (
                <ButtonGroup className="pagination-button-group">
                    <PagingButton
                        disabled={isLoading || isFirstPage}
                        iconClass="fa-chevron-left"
                        tooltip="Previous Page"
                        onClick={() => actions.loadPreviousPage(id)}
                    />

                    <PageSelector model={model} actions={actions} />

                    <PagingButton
                        disabled={isLoading || isLastPage}
                        iconClass="fa-chevron-right"
                        tooltip="Next Page"
                        onClick={() => actions.loadNextPage(id)}
                    />
                </ButtonGroup>
            )
        );
    }
}
