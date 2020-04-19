import React from 'react';
import { MenuItem, OverlayTrigger, Popover } from 'react-bootstrap';
import { List } from 'immutable';

import { MAX_EDITABLE_GRID_ROWS } from '../../constants';
import { ISubItem, SubMenuItem, SubMenuItemProps } from '../menus/SubMenuItem';
import { AssayDefinitionModel, QueryGridModel } from '../base/models/model';

import { getImportItemsForAssayDefinitions } from './actions';

interface Props extends SubMenuItemProps {
    isLoaded: boolean;
    assayDefModels: List<AssayDefinitionModel>;
    model: QueryGridModel;
    requireSelection: boolean;
    nounPlural?: string;
}

export class AssayImportSubMenuItem extends React.Component<Props, any> {
    static defaultProps = {
        text: 'Upload Assay Data',
        nounPlural: 'items',
    };

    getItems(): ISubItem[] {
        const { assayDefModels, model } = this.props;
        const items = getImportItemsForAssayDefinitions(assayDefModels, model);

        const subItems = [];
        items.forEach((href: string, assay: AssayDefinitionModel) => {
            subItems.push({
                text: assay.name,
                href,
            });
        });

        return subItems;
    }

    render() {
        const { isLoaded, model, requireSelection, nounPlural } = this.props;

        if (!isLoaded) {
            return (
                <MenuItem disabled={true}>
                    <span className="fa fa-spinner fa-pulse" /> Loading assays...
                </MenuItem>
            );
        }

        const items = this.getItems();

        // only display menu if valid items are available
        if (items.length) {
            const selectedCount = model ? model.selectedIds.size : -1;
            const overlayMessage =
                requireSelection && selectedCount == 0
                    ? 'Select one or more ' + nounPlural + '.'
                    : selectedCount > MAX_EDITABLE_GRID_ROWS
                    ? 'At most ' + MAX_EDITABLE_GRID_ROWS + ' ' + nounPlural + ' can be selected.'
                    : '';
            const menuProps: Props = Object.assign({}, this.props, {
                disabled: overlayMessage.length > 0,
                items,
            });

            delete menuProps.model;

            if (menuProps.disabled) {
                const overlay = <Popover id="assay-submenu-warning">{overlayMessage}</Popover>;

                return (
                    <OverlayTrigger overlay={overlay} placement="right">
                        <MenuItem disabled={true}>{menuProps.text}</MenuItem>
                    </OverlayTrigger>
                );
            }

            return <SubMenuItem {...menuProps} />;
        }

        return null;
    }
}
