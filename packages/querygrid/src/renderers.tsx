/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import classNames from 'classnames'
import { OrderedMap } from 'immutable'
import { Dropdown, MenuItem, Modal } from 'react-bootstrap'
import { GridColumn } from '@glass/grid'
import { GRID_CHECKBOX_OPTIONS, QueryColumn, QueryGridModel } from '@glass/models'
import { CustomToggle } from '@glass/utils'

import { AliasRenderer } from './renderers/AliasRenderer'
import { AppendUnits } from './renderers/AppendUnits'
import { DefaultRenderer } from './renderers/DefaultRenderer'
import { FileColumnRenderer } from './renderers/FileColumnRenderer'
import { MultiValueRenderer } from './renderers/MultiValueRenderer'

export function headerCell(handleSort: any, column: GridColumn, i: number, selectable?: boolean, sortable: boolean = true) {

    const col: QueryColumn = column.raw;

    if (!col) {
        return null;
    }

    const isSortAsc = col.sorts === '+';
    const isSortDesc = col.sorts === '-';

    return (
        <span>
            {col.caption === '&nbsp;' ? '' : col.caption}
            {sortable && col.sortable && (
                <span className={classNames({'pull-right': i === 0 && !selectable || selectable && i === 1})}>
                <Dropdown id={`grid-menu-${i}`} className={classNames('hidden-xs hidden-sm', {'pull-right': i > 0 && !selectable || i > 1})}>
                    <CustomToggle bsRole="toggle">
                        <span className="fa fa-chevron-circle-down" style={{color: 'lightgray', fontSize: '12px'}}/>
                    </CustomToggle>
                    <Dropdown.Menu>
                        <MenuItem disabled={isSortAsc} onClick={!isSortAsc ? handleSort.bind(this, column, '+') : undefined}>
                            <span className="fa fa-sort-amount-asc"/>&nbsp;
                            Sort ascending
                        </MenuItem>
                        <MenuItem disabled={isSortDesc} onClick={!isSortDesc ? handleSort.bind(this, column, '-') : undefined}>
                            <span className="fa fa-sort-amount-desc"/>&nbsp;
                            Sort descending
                        </MenuItem>
                    </Dropdown.Menu>
                 </Dropdown>
            </span>
            )}
        </span>
    );
}

export function headerSelectionCell(handleSelection: any, model: QueryGridModel) {
    const { selectedState, isLoaded } = model;

    const isChecked = selectedState === GRID_CHECKBOX_OPTIONS.ALL,
        isIndeterminate = selectedState === GRID_CHECKBOX_OPTIONS.SOME,
        disabled = !(isLoaded && model.totalRows !== 0);
    // Ref below is required as indeterminate is not an actual HTML attribute
    // See: https://github.com/facebook/react/issues/1798

    return (
        <input
            checked={isChecked}
            disabled={disabled}
            onChange={handleSelection}
            ref={elem => elem && (elem.indeterminate = isIndeterminate)}
            type="checkbox"/>
    )
}

const columnRenderers = {
    aliasrenderer: AliasRenderer,
    appendunits: AppendUnits,
    defaultrenderer: DefaultRenderer,
    filecolumnrenderer: FileColumnRenderer,
    multivaluecolumnrenderer: MultiValueRenderer,
};

export function bindColumnRenderers(columns: OrderedMap<string, QueryColumn>): OrderedMap<string, QueryColumn> {

    if (columns) {
        return columns.map((col: QueryColumn) => {
            let node = columnRenderers.defaultrenderer;
            if (col && col.columnRenderer && columnRenderers[col.columnRenderer.toLowerCase()]) {
                node = columnRenderers[col.columnRenderer.toLowerCase()];
            }

            // TODO: Just generate one function per type
            return col.set('cell', (data) => {
                return React.createElement(node, { data, col });
            });
        }) as OrderedMap<string, QueryColumn>;
    }

    return columns;
}