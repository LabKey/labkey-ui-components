/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, PureComponent, ReactNode, useCallback, useMemo } from 'react';

import { exportRows as exportRows_, incrementClientSideMetricCount } from '../../internal/actions';

import { EXPORT_TYPES, ExportHeaderTypes, MAX_SELECTION_ACTION_ROWS } from '../../internal/constants';
import { Tip } from '../../internal/components/base/Tip';

import { DropdownButton, MenuDivider, MenuHeader, MenuItem } from '../../internal/dropdowns';

import { QueryModel } from './QueryModel';
import { getQueryModelExportParams } from './utils';
import { Actions } from './withQueryModels';
import { SelectionMenuItem } from '../../internal/components/menus/SelectionMenuItem';
import { Icon } from '../../internal/Icon';
import { OverlayTrigger } from '../../internal/OverlayTrigger';
import { Popover } from '../../internal/Popover';
import { generateId } from '../../internal/util/utils';

interface ExportMenuProps {
    actions: Actions;
    advancedOptions?: Record<string, any>;
    // exportRows needed for tests, defaults to exportRows imported from internal/actions
    exportRows?: (type: EXPORT_TYPES, exportParams: Record<string, any>, containerPath?: string) => void;
    model: QueryModel;
    onExport?: Record<string, (modelId?: string, headerType?: ExportHeaderTypes) => void>;
    supportedHeaderTypes?: Set<ExportHeaderTypes>;
    supportedTypes?: Set<EXPORT_TYPES>;
}

export interface ExportOption {
    headerType?: ExportHeaderTypes;
    hidden?: boolean;
    icon: string;
    label: string;
    type: EXPORT_TYPES;
}

const HEADER_TYPE_TEXT: Record<ExportHeaderTypes, ExportMenuTypeData> = {
    [ExportHeaderTypes.Caption]: {
        dividerText: 'Grid View Labels',
        toolTip: "Uses this view's field labels, which may not be recognized during import.",
    },
    [ExportHeaderTypes.ImportField]: {
        dividerText: 'Field Names',
        toolTip: 'Uses database field names, which work better for import.',
    },
};

const exportOptions = [
    { type: EXPORT_TYPES.CSV, icon: 'fa-file-o', label: 'CSV', headerType: ExportHeaderTypes.Caption },
    { type: EXPORT_TYPES.EXCEL, icon: 'fa-file-excel-o', label: 'Excel', headerType: ExportHeaderTypes.Caption },
    { type: EXPORT_TYPES.TSV, icon: 'fa-file-text-o', label: 'TSV', headerType: ExportHeaderTypes.Caption },
    { type: EXPORT_TYPES.CSV, icon: 'fa-file-o', label: 'CSV', headerType: ExportHeaderTypes.ImportField },
    { type: EXPORT_TYPES.EXCEL, icon: 'fa-file-excel-o', label: 'Excel', headerType: ExportHeaderTypes.ImportField },
    { type: EXPORT_TYPES.TSV, icon: 'fa-file-text-o', label: 'TSV', headerType: ExportHeaderTypes.ImportField },
    { type: EXPORT_TYPES.LABEL, icon: 'fa-print', label: 'Print Label', hidden: true },
    { type: EXPORT_TYPES.LABEL_TEMPLATE, icon: 'fa-file-o', label: 'Download Template', hidden: true },
    { type: EXPORT_TYPES.STORAGE_MAP, icon: 'fa-file-excel-o', label: 'Storage Map (Excel)', hidden: true },
    // Note: EXPORT_TYPES and exportRows (used in export function below) also include support for FASTA and GENBANK,
    // but they were never used in the QueryGridPanel version of export. We're explicitly not supporting them in
    // this implementation until we need them.
] as ExportOption[];

const isOptionVisible = (
    option: ExportOption,
    supportedTypes: Set<EXPORT_TYPES>,
    supportedHeaderTypes: Set<ExportHeaderTypes>
): boolean => {
    if (option.hidden && !supportedTypes?.has(option.type)) return false;
    return !option.headerType || supportedHeaderTypes?.has(option.headerType);
};

interface ExportMenuTypeData {
    dividerText: string;
    toolTip: string;
}
interface HeaderTypeSection extends ExportMenuTypeData {
    showDivider: boolean;
}

interface ExportMenuItemProps {
    headerTypeSection?: HeaderTypeSection;
    model: QueryModel;
    onExport: (option: ExportOption) => void;
    option: ExportOption;
    supportedHeaderTypes?: Set<ExportHeaderTypes>;
    supportedTypes: Set<EXPORT_TYPES>;
}

const ExportMenuItem: FC<ExportMenuItemProps> = ({
    headerTypeSection,
    supportedHeaderTypes,
    model,
    onExport,
    option,
    supportedTypes,
}) => {
    const onClick = useCallback(() => {
        incrementClientSideMetricCount('export', option.label.toLowerCase() + option.headerType);
        onExport(option);
    }, [onExport, option]);
    const popoverId = useMemo(() => generateId('export-header-'), []);

    if (!isOptionVisible(option, supportedTypes, supportedHeaderTypes)) return null;

    if (
        option.type === EXPORT_TYPES.LABEL ||
        (option.type === EXPORT_TYPES.LABEL_TEMPLATE && !supportedTypes?.has(EXPORT_TYPES.LABEL))
    ) {
        const exportAndPrintHeader = 'Bartender';
        return (
            <React.Fragment key={option.type}>
                <MenuDivider />
                <MenuHeader text={exportAndPrintHeader} />
                {option.type === EXPORT_TYPES.LABEL && (
                    <SelectionMenuItem
                        maxSelection={MAX_SELECTION_ACTION_ROWS}
                        nounPlural="samples"
                        onClick={onClick}
                        queryModel={model}
                        text={
                            <>
                                <span className={`fa ${option.icon} export-menu-icon`} />
                                {option.label}
                            </>
                        }
                    />
                )}
                {option.type !== EXPORT_TYPES.LABEL && (
                    <MenuItem onClick={onClick}>
                        <span className={`fa ${option.icon} export-menu-icon`} />
                        {option.label}
                    </MenuItem>
                )}
            </React.Fragment>
        );
    }

    if (option.type === EXPORT_TYPES.STORAGE_MAP) {
        return (
            <React.Fragment key={option.type}>
                <MenuDivider />
                <MenuHeader text="Export Map" />
                <MenuItem onClick={onClick}>
                    <span className={`fa ${option.icon} export-menu-icon`} />
                    {option.label}
                </MenuItem>
            </React.Fragment>
        );
    }

    return (
        <>
            {headerTypeSection?.showDivider && <MenuDivider />}
            {headerTypeSection && (
                <MenuHeader
                    text={
                        <React.Fragment>
                            <span>{headerTypeSection.dividerText}</span>
                            <OverlayTrigger
                                id={popoverId}
                                overlay={
                                    <Popover id={popoverId} placement="right">
                                        {headerTypeSection.toolTip}
                                    </Popover>
                                }
                            >
                                <i className="margin-left-small fa fa-question-circle" />
                            </OverlayTrigger>
                        </React.Fragment>
                    }
                />
            )}
            <MenuItem onClick={onClick}>
                <div className="export-menu__item">
                    <span className={`fa ${option.icon} export-menu-icon`} />
                    <span>{option.label}</span>
                </div>
            </MenuItem>
        </>
    );
};
ExportMenuItem.displayName = 'ExportMenuItem';

export interface ExportMenuImplProps extends ExportMenuProps {
    exportHandler: (option: ExportOption) => void;
    hasData: boolean;
    hasSelections?: boolean;
    id: string;
}

const ExportMenuImpl: FC<ExportMenuImplProps> = memo(props => {
    const { model, id, hasData, supportedHeaderTypes, supportedTypes, hasSelections, exportHandler, onExport } = props;

    const _supportedHeaderTypes = useMemo(
        () =>
            supportedHeaderTypes ??
            new Set<ExportHeaderTypes>([ExportHeaderTypes.Caption, ExportHeaderTypes.ImportField]),
        [supportedHeaderTypes]
    );

    // Indexed like exportOptions; set on each visible option that starts a new header type section
    const headerTypeSections = useMemo<HeaderTypeSection[]>(() => {
        const showSections = _supportedHeaderTypes.size > 1;
        let prevHeaderType: ExportHeaderTypes;
        let hasPriorOption = false;
        const sections: HeaderTypeSection[] = [];
        for (const option of exportOptions) {
            let section: HeaderTypeSection;
            if (isOptionVisible(option, supportedTypes, _supportedHeaderTypes)) {
                if (showSections && option.headerType && option.headerType !== prevHeaderType) {
                    section = { showDivider: hasPriorOption, ...HEADER_TYPE_TEXT[option.headerType] };
                    prevHeaderType = option.headerType;
                }
                hasPriorOption = true;
            }
            sections.push(section);
        }
        return sections;
    }, [_supportedHeaderTypes, supportedTypes]);

    const exportCallback = useCallback(
        (option: ExportOption) => {
            const { headerType, type } = option;
            if (onExport?.[type]) {
                onExport[type]?.(id, headerType);
            } else {
                exportHandler(option);
            }
        },
        [exportHandler, id, onExport]
    );

    const exportHeader = 'Export' + (hasSelections ? ' Selected' : ' All') + ' Data';

    return (
        hasData && (
            <div className="export-menu">
                <Tip caption={exportHeader}>
                    <DropdownButton noCaret pullRight title={<Icon iconClass="fa fa-download" srText="Export" />}>
                        {exportOptions.map((option, i) => (
                            <ExportMenuItem
                                headerTypeSection={headerTypeSections[i]}
                                key={`${option.label}-${option.headerType}`}
                                model={model}
                                onExport={exportCallback}
                                option={option}
                                supportedHeaderTypes={_supportedHeaderTypes}
                                supportedTypes={supportedTypes}
                            />
                        ))}
                    </DropdownButton>
                </Tip>
            </div>
        )
    );
});
ExportMenuImpl.displayName = 'ExportMenu';

export class ExportMenu extends PureComponent<ExportMenuProps> {
    export = (option: ExportOption): void => {
        const { actions, advancedOptions, exportRows = exportRows_, model, onExport } = this.props;
        const { headerType, type } = option;

        if (onExport?.[type]) {
            onExport[type](model.id, headerType);
        } else {
            // Issue 39332: add message about export start
            actions.addMessage(model.id, { type: 'success', content: option.label + ' export started.' }, 5000);
            exportRows(
                type,
                getQueryModelExportParams(model, type, { ...advancedOptions, headerType }),
                model.containerPath
            );
        }
    };

    render(): ReactNode {
        const { model, ...rest } = this.props;
        const { id, hasData, hasSelections } = model;

        return (
            <ExportMenuImpl
                {...rest}
                exportHandler={this.export}
                hasData={hasData}
                hasSelections={hasSelections}
                id={id}
                model={model}
            />
        );
    }
}
