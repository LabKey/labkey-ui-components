import * as React from "react";
import { MenuItem, OverlayTrigger, Popover } from "react-bootstrap";
import { List } from 'immutable'

import { getImportItemsForAssayDefinitions } from "./actions";
import { MAX_EDITABLE_GRID_ROWS } from "../../constants";
import { ISubItem, SubMenuItem, SubMenuItemProps } from '../base/menus/SubMenuItem';
import { AssayDefinitionModel, QueryGridModel } from '../base/models/model';

interface Props extends SubMenuItemProps {
    isLoaded: boolean
    assayDefModels: List<AssayDefinitionModel>
    model: QueryGridModel
    requireSelection: boolean
}

export class AssayImportSubMenuItem extends React.Component<Props, any> {

    static defaultProps = {
        text: 'Upload Assay Data'
    };

    getItems(): Array<ISubItem> {
        const { assayDefModels, model } = this.props;
        const items = getImportItemsForAssayDefinitions(assayDefModels, model);

        let subItems = [];
        items.forEach((href: string, assay: AssayDefinitionModel) => {
            subItems.push({
                text: assay.name,
                href
            });
        });

        return subItems;
    }

    render() {
        const { isLoaded, model, requireSelection } = this.props;

        if (!isLoaded) {
            return <MenuItem disabled={true}><span className='fa fa-spinner fa-spin' /> Loading assays...</MenuItem>;
        }

        const items = this.getItems();

        // only display menu if valid items are available
        if (items.length) {
            const selectedCount = model ? model.selectedIds.size : -1;
            const overlayMessage = (requireSelection && selectedCount == 0) ? "Select one or more items"
                : (selectedCount > MAX_EDITABLE_GRID_ROWS ? "Too many items selected (Limit " + MAX_EDITABLE_GRID_ROWS + ")" : "");
            let menuProps: Props = Object.assign({}, this.props, {
                disabled: overlayMessage.length > 0,
                items
            });

            delete menuProps.model;

            const item = <SubMenuItem {...menuProps} />;

            if (menuProps.disabled) {
                return (
                    <OverlayTrigger
                        overlay={<Popover id="assay-submenu-warning">{overlayMessage}</Popover>}
                        placement="right">
                        {item}
                    </OverlayTrigger>
                )
            }

            return item;
        }

        return null;
    }

}