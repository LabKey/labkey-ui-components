import React, { FC, memo, PureComponent, ReactNode, useCallback } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import { Set } from 'immutable';

import { EXPORT_TYPES, getQueryModelExportParams, QueryModel, Tip } from '../..';

import { exportRows } from '../../internal/actions';

interface ExportMenuProps {
    // pageSizes is expected to be sorted (ascending)
    model: QueryModel;
    advancedOptions?: { [key: string]: any };
    supportedTypes?: Set<EXPORT_TYPES>;
    onExport?: { [key: string]: (modelId?: string) => any };
}

export interface ExportOption {
    type: EXPORT_TYPES;
    icon: string;
    label: string;
    hidden?: boolean;
}

const exportOptions = [
    { type: EXPORT_TYPES.CSV, icon: 'fa-file-o', label: 'CSV' },
    { type: EXPORT_TYPES.EXCEL, icon: 'fa-file-excel-o', label: 'Excel' },
    { type: EXPORT_TYPES.TSV, icon: 'fa-file-text-o', label: 'TSV' },
    { type: EXPORT_TYPES.LABEL, icon: 'fa-tag', label: 'Label', hidden: true },
    // Note: EXPORT_TYPES and exportRows (used in export function below) also include support for FASTA and GENBANK,
    // but they were never used in the QueryGridPanel version of export. We're explicitly not supporting them in
    // this implementation until we need them.
] as Array<ExportOption>;

export interface ExportMenuImplProps extends Omit<ExportMenuProps, "model"> {
    id: string;
    hasData: boolean;
    hasSelections?: boolean;
    exportHandler: (option: ExportOption) => void;
}

const ExportMenuImpl: FC<ExportMenuImplProps> = memo(props => {
    const { id, hasData, supportedTypes, hasSelections, exportHandler, onExport } = props;

    const exportCallback = useCallback((option: ExportOption) => {
        const {type} = option;
        if (onExport?.[type]) {
            onExport[type]?.(id);
        }
        else {
            exportHandler(option);
        }
    }, [exportHandler, onExport])

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
                        <MenuItem key="export_header" header>
                            Export
                            {hasSelections ? ' Selected' : ''}
                        </MenuItem>

                        {exportOptions.map(option => {
                            if (option.hidden && !supportedTypes?.includes(option.type)) return null;

                            if (option.type === EXPORT_TYPES.LABEL) {
                                return (
                                    <React.Fragment key={option.type}>
                                        <MenuItem divider />
                                        <MenuItem header>
                                            Export and Print {hasSelections ? 'Selected' : ''}
                                        </MenuItem>
                                        <MenuItem onClick={() => exportCallback(option)}>
                                            <span className={`fa ${option.icon} export-menu-icon`} />
                                            &nbsp; {option.label}
                                        </MenuItem>
                                    </React.Fragment>
                                );
                            }
                            return (
                                <MenuItem key={option.type} onClick={() => exportCallback(option)}>
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
});

export class ExportMenu extends PureComponent<ExportMenuProps> {
    export = (option: ExportOption): void => {
        const { model, advancedOptions, onExport } = this.props;
        const {type} = option;
        const exportParams = getQueryModelExportParams(model, type, advancedOptions);
        if (onExport && onExport[type]) {
            onExport[type](model.id);
        } else {
            exportRows(type, exportParams);
        }
    };

    render(): ReactNode {
        const { model, ...rest } = this.props;
        const { id, hasData, hasSelections, } = model;

        return (
            <ExportMenuImpl {...rest} id={id} hasData={hasData} hasSelections={hasSelections} exportHandler={this.export} />
        );
    }
}

export const EditableGridExportMenu: FC<ExportMenuImplProps> = memo(props => {
    return <ExportMenuImpl {...props} />;
});
