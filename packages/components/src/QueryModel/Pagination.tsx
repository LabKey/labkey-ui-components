import React, { PureComponent } from 'react';
import { ButtonGroup, DropdownButton, MenuItem } from 'react-bootstrap';

import { Tip } from '..';
import { PagingButton } from '../components/gridbar/QueryGridPaging';
import { RequiresModelAndActions } from './withQueryModels';

export class PaginationInfo extends PureComponent<RequiresModelAndActions> {
    render() {
        const { model } = this.props;
        const { offset, maxRows, rowCount } = model;
        let message = '';

        if (model.hasData()) {
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

        return (
            <div className="pagination-info">
                {message}
            </div>
        );
    }
}

class PageSelector extends PureComponent<RequiresModelAndActions> {
    render() {
        const { model, actions } = this.props;
        const { loadFirstPage, loadLastPage } = actions;
        const isLoading = model.isLoading();

        return (
            <Tip caption="Current Page" trigger={['hover']}>
                <DropdownButton id={`current-page-drop-${model.id}`} pullRight title={model.getCurrentPage()}>
                    <MenuItem header>
                        Jump To
                    </MenuItem>

                    <MenuItem disabled={isLoading || model.isFirstPage()} onClick={() => loadFirstPage(model.id)}>
                        First Page
                    </MenuItem>

                    <MenuItem disabled={isLoading || model.isLastPage()} onClick={() => loadLastPage(model.id)}>
                        Last Page
                    </MenuItem>

                    <MenuItem header>
                        {isLoading ? '...' :  model.getPageCount()} Total Pages
                    </MenuItem>
                </DropdownButton>
            </Tip>
        );
    }
}

export class PaginationButtons extends PureComponent<RequiresModelAndActions> {
    render() {
        const { model, actions } = this.props;
        const isLoading = model.isLoading();

        return (
            <ButtonGroup>
                <PagingButton
                    disabled={isLoading || model.isFirstPage()}
                    iconClass="fa-chevron-left"
                    tooltip="Previous Page"
                    onClick={() => actions.loadPreviousPage(model.id)}
                />

                <PageSelector model={model} actions={actions} />

                <PagingButton
                    disabled={isLoading || model.isLastPage()}
                    iconClass="fa-chevron-right"
                    tooltip="Next Page"
                    onClick={() => actions.loadNextPage(model.id)}
                />
            </ButtonGroup>
        );
    }
}
