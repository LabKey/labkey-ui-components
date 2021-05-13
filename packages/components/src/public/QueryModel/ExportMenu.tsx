import React, { PureComponent, ReactNode } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import { Set } from 'immutable';

import { getQueryModelExportParams, QueryModel, Tip, EXPORT_TYPES } from '../..';

import { exportRows } from '../../internal/actions';

interface ExportMenuProps {
    // pageSizes is expected to be sorted (ascending)
    model: QueryModel;
    advancedOptions?: { [key: string]: any };
    supportedTypes?: Set<EXPORT_TYPES>;
    onExport?: { [key: string]: () => any };
}

export class ExportMenu extends PureComponent<ExportMenuProps> {
    static exportOptions = [
        { type: EXPORT_TYPES.CSV, icon: 'fa-file-o', label: 'CSV' },
        { type: EXPORT_TYPES.EXCEL, icon: 'fa-file-excel-o', label: 'Excel' },
        { type: EXPORT_TYPES.TSV, icon: 'fa-file-text-o', label: 'TSV' },
        { type: EXPORT_TYPES.LABEL, icon: 'fa-tag', label: 'Label', hidden: true },
        // Note: EXPORT_TYPES and exportRows (used in export function below) also include support for FASTA and GENBANK,
        // but they were never used in the QueryGridPanel version of export. We're explicitly not supporting them in
        // this implementation until we need them.
    ];

    export = (option): void => {
        const { model, advancedOptions, onExport } = this.props;
        const type = option.type;
        const exportParams = getQueryModelExportParams(model, type, advancedOptions);
        if (onExport && onExport[type]) {
            onExport[type]();
        } else {
            exportRows(type, exportParams);
        }
    };

    render(): ReactNode {
        const { model, supportedTypes } = this.props;
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
                                {hasSelections ? ' Selected' : ''}
                            </MenuItem>

                            {ExportMenu.exportOptions.map(option => {
                                if (option.hidden && !supportedTypes?.includes(option.type)) return null;

                                if (option.type === EXPORT_TYPES.LABEL) {
                                    return (
                                        <>
                                            <MenuItem header>
                                                Export and Print {model.selections?.size > 0 ? 'Selected' : ''}
                                            </MenuItem>
                                            <MenuItem onClick={() => this.export(option)}>
                                                <span className={`fa ${option.icon} export-menu-icon`} />
                                                &nbsp; {option.label}
                                            </MenuItem>
                                        </>
                                    );
                                }
                                return (
                                    <MenuItem key={option.type} onClick={() => this.export(option)}>
                                        <div className="export-menu__item">
                                            <span className={`fa ${option.icon} export-menu-icon`} />
                                            <span>{option.label}</span>
                                        </div>
                                    </MenuItem>
                                );
                            })}
                        </DropdownButton>
                    </Tip>
                </div>
            )
        );
    }
}
