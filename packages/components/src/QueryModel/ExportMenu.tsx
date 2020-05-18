import React, { PureComponent } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import { List } from 'immutable';

import { GRID_CHECKBOX_OPTIONS, QueryModel, Tip } from '..';
import { EXPORT_TYPES } from '../constants';
import { exportRows, ExportOptions } from '../actions';

interface ExportMenuProps {
    // pageSizes is expected to be sorted (ascending)
    model: QueryModel;
    advancedOptions?: { [key: string]: string };
}

export class ExportMenu extends PureComponent<ExportMenuProps> {
    static exportOptions = [
        { type: EXPORT_TYPES.CSV, icon: 'fa-file-o', label: 'CSV' },
        { type: EXPORT_TYPES.EXCEL, icon: 'fa-file-excel-o', label: 'Excel' },
        { type: EXPORT_TYPES.TSV, icon: 'fa-file-text-o', label: 'TSV' },
        // Note: EXPORT_TYPES and exportRows (used in export function below) also include support for FASTA and GENBANK,
        // but they were never used in the QueryGridPanel version of export. We're explicitly not supporting them in
        // this implementation until we need them.
    ];

    export = option => {
        const { model, advancedOptions } = this.props;
        const { id, filters, hasSelections, selectedState, schemaQuery, exportColumnString, sortString } = model;
        const showRows = (hasSelections && selectedState !== GRID_CHECKBOX_OPTIONS.NONE) ? 'SELECTED' : 'ALL';
        const exportOptions: ExportOptions = {
            filters: List(filters),
            columns: exportColumnString,
            sorts: sortString,
            selectionKey: id,
            showRows,
        };

        exportRows(option.type, schemaQuery, exportOptions, advancedOptions);
    };

    render() {
        const { model } = this.props;
        const { id, hasData, hasSelections, selections } = model;

        return (
            hasData && (
                <div className="export-menu">
                    <Tip caption="Export" trigger={['hover']}>
                        <DropdownButton
                            id={`export-drop-${id}`}
                            noCaret
                            pullRight
                            title={<span className="fa fa-download" />}
                        >
                            <MenuItem header>
                                Export
                                {(hasSelections && selections.size > 0) ? ' Selected' : ''}
                            </MenuItem>

                            {ExportMenu.exportOptions.map(option => (
                                <MenuItem key={option.type} onClick={() => this.export(option)}>
                                    <div className="export-menu__item">
                                        <span className={`fa ${option.icon} export-menu-icon`} />
                                        <span>{option.label}</span>
                                    </div>
                                </MenuItem>
                            ))}
                        </DropdownButton>
                    </Tip>
                </div>
            )
        );
    }
}
