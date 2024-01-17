import React, { FC, memo, PureComponent, ReactNode, useCallback } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import { Set } from 'immutable';

import { exportRows } from '../../internal/actions';

import { EXPORT_TYPES } from '../../internal/constants';
import { Tip } from '../../internal/components/base/Tip';

import { QueryModel } from './QueryModel';
import { getQueryModelExportParams } from './utils';

interface ExportMenuProps {
    advancedOptions?: Record<string, any>;
    model: QueryModel;
    onExport?: Record<string, (modelId?: string) => void>;
    supportedTypes?: Set<EXPORT_TYPES>;
}

export interface ExportOption {
    hidden?: boolean;
    icon: string;
    label: string;
    type: EXPORT_TYPES;
}

const exportOptions = [
    { type: EXPORT_TYPES.CSV, icon: 'fa-file-o', label: 'CSV' },
    { type: EXPORT_TYPES.EXCEL, icon: 'fa-file-excel-o', label: 'Excel' },
    { type: EXPORT_TYPES.TSV, icon: 'fa-file-text-o', label: 'TSV' },
    { type: EXPORT_TYPES.LABEL, icon: 'fa-tag', label: 'Label', hidden: true },
    // Note: EXPORT_TYPES and exportRows (used in export function below) also include support for FASTA and GENBANK,
    // but they were never used in the QueryGridPanel version of export. We're explicitly not supporting them in
    // this implementation until we need them.
] as ExportOption[];

export interface ExportMenuImplProps extends Omit<ExportMenuProps, 'model'> {
    exportHandler: (option: ExportOption) => void;
    hasData: boolean;
    hasSelections?: boolean;
    id: string;
}

const ExportMenuImpl: FC<ExportMenuImplProps> = memo(props => {
    const { id, hasData, supportedTypes, hasSelections, exportHandler, onExport } = props;

    const exportCallback = useCallback(
        (option: ExportOption) => {
            const { type } = option;
            if (onExport?.[type]) {
                onExport[type]?.(id);
            } else {
                exportHandler(option);
            }
        },
        [exportHandler, id, onExport]
    );

    return (
        hasData && (
            <div className="export-menu">
                <Tip caption="Export">
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
                                        <MenuItem header>Export and Print {hasSelections ? 'Selected' : ''}</MenuItem>
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
        const { type } = option;

        if (onExport?.[type]) {
            onExport[type](model.id);
        } else {
            exportRows(type, getQueryModelExportParams(model, type, advancedOptions), model.containerPath);
        }
    };

    render(): ReactNode {
        const { model, ...rest } = this.props;
        const { id, hasData, hasSelections } = model;

        return (
            <ExportMenuImpl
                {...rest}
                id={id}
                hasData={hasData}
                hasSelections={hasSelections}
                exportHandler={this.export}
            />
        );
    }
}

export const EditableGridExportMenu: FC<ExportMenuImplProps> = memo(props => {
    return <ExportMenuImpl {...props} />;
});
