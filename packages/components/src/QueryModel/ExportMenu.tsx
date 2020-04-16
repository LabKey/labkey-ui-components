import React, { PureComponent } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import { QueryModel, Tip } from '..';
import { EXPORT_TYPES } from '../constants';
import { exportRows } from '../actions';
import { List } from 'immutable';

interface ExportMenuProps {
    // pageSizes is expected to be sorted (ascending)
    model: QueryModel;
    advancedOptions?: { [key: string]: string };
}

export class ExportMenu extends PureComponent<ExportMenuProps> {
    static exportOptions = [
        { type: EXPORT_TYPES.CSV, icon: 'fa-file-o',  label: 'CSV' },
        { type: EXPORT_TYPES.EXCEL, icon: 'fa-file-excel-o', label: 'Excel' },
        { type: EXPORT_TYPES.TSV, icon: 'fa-file-text-o', label: 'TSV' },
        // Note: EXPORT_TYPES and exportRows (used in export function below) also include support for FASTA and GENBANK,
        // but they were never used in the QueryGridPanel version of export. We're explicitly not supporting them in
        // this implementation until we need them.
    ];

    export = (option) => {
        const { model, advancedOptions } = this.props;
        const { id, schemaQuery, exportColumnString, sortString, filters } = model;
        const exportOptions = {
            filters: List(filters),
            columns: exportColumnString,
            sorts: sortString,
            selectionKey: id,
            // TODO: Implement showRows when selections are implemented.
        };

        exportRows(option.type, schemaQuery, exportOptions, advancedOptions);
    };

    render() {
        const { model } = this.props;
        const { id, hasData } = model;
        const menuItems = ExportMenu.exportOptions.map((option) => (
            <MenuItem key={option.type} onClick={() => this.export(option)}>
                <div className="export-menu__item">
                    <span className={`fa ${option.icon}`} /><span>{option.label}</span>
                </div>
            </MenuItem>
        ));

        return (hasData &&
            <div className="export-menu">
                <Tip caption="Export" trigger={['hover']}>
                    <DropdownButton
                        id={`export-drop-${id}`}
                        noCaret
                        pullRight
                        title={<span className="fa fa-download"/>}
                    >
                        {/* TODO: render selection size when selections are implemented */}
                        <MenuItem header>Export</MenuItem>

                        {menuItems}
                    </DropdownButton>
                </Tip>
            </div>
        );
    }
}
