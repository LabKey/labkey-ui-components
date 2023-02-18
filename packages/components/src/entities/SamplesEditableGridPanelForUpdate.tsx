import React, { ReactNode } from 'react';
import { List, Map } from 'immutable';

import { getUniqueIdColumnMetadata } from '../internal/components/entities/utils';

import {
    EditableGridPanelForUpdateWithLineage,
    EditableGridPanelForUpdateWithLineageProps,
    UpdateGridTab,
} from '../internal/components/editable/EditableGridPanelForUpdateWithLineage';

import { QueryColumn } from '../public/QueryColumn';
import { EditableColumnMetadata } from '../internal/components/editable/EditableGrid';

import { SampleTypeDataType } from '../internal/components/entities/constants';

import { SAMPLE_STATE_COLUMN_NAME } from '../internal/components/samples/constants';
import { GroupedSampleFields } from '../internal/components/samples/models';
import { SampleStatusLegend } from '../internal/components/samples/SampleStatusLegend';

const extraExportColumns = [
    {
        fieldKey: QueryColumn.ALIQUOTED_FROM_LSID,
        caption: QueryColumn.ALIQUOTED_FROM,
    },
];

interface Props
    extends Omit<
        EditableGridPanelForUpdateWithLineageProps,
        | 'extraExportColumns'
        | 'getColumnMetadata'
        | 'getParentTypeWarning'
        | 'getReadOnlyRows'
        | 'getTabHeader'
        | 'getTabTitle'
        | 'targetEntityDataType'
    > {
    aliquots: any[]; // passed through from SampleEditableGrid
    noStorageSamples: any[];
    readOnlyColumns?: List<string>;
    sampleTypeDomainFields: GroupedSampleFields;
}

export class SamplesEditableGridPanelForUpdate extends React.Component<Props> {
    hasAliquots = (): boolean => {
        return this.props.aliquots?.length > 0;
    };

    getCurrentTab = (tabInd: number): number => {
        const { includedTabs } = this.props;
        return tabInd === undefined ? includedTabs[0] : includedTabs[tabInd];
    };

    getTabTitle = (tabInd: number): string => {
        const { includedTabs } = this.props;

        if (includedTabs[tabInd] === UpdateGridTab.Storage) return 'Storage Details';
        if (includedTabs[tabInd] === UpdateGridTab.Lineage) return 'Lineage Details';
        return 'Sample Data';
    };

    getParentTypeWarning = (): ReactNode => {
        return <div className="sample-status-warning">Lineage for aliquots cannot be changed.</div>;
    };

    getTabHeader = (tab: number): ReactNode => {
        if (tab === UpdateGridTab.Storage) {
            return (
                <div className="top-spacing sample-status-warning">
                    Samples that are not currently in storage are not editable here.
                </div>
            );
        } else {
            return (
                <div className="top-spacing sample-status-warning">
                    Aliquot data inherited from the original sample cannot be updated here.
                </div>
            );
        }
    };

    getReadOnlyRows = (tabInd: number): List<string> => {
        const { aliquots, noStorageSamples, includedTabs } = this.props;

        if (includedTabs[tabInd] === UpdateGridTab.Storage) {
            return List<string>(noStorageSamples);
        } else if (includedTabs[tabInd] === UpdateGridTab.Lineage) {
            return List<string>(aliquots);
        } else {
            return undefined;
        }
    };


    getSamplesColumnMetadata = (tabInd: number): Map<string, EditableColumnMetadata> => {
        if (this.getCurrentTab(tabInd) !== UpdateGridTab.Samples) return undefined;

        const { aliquots, sampleTypeDomainFields, queryModel } = this.props;
        let columnMetadata = getUniqueIdColumnMetadata(queryModel.queryInfo);
        columnMetadata = columnMetadata.set(SAMPLE_STATE_COLUMN_NAME, {
            hideTitleTooltip: true,
            toolTip: <SampleStatusLegend />,
            popoverClassName: 'label-help-arrow-left',
        });

        // TODO move MetricUnit classes and functions so we can properly filter based on sampleTypeDomainFields.metricUnit
        // columnMetadata = columnMetadata.set(SAMPLE_UNITS_COLUMN_NAME, {
        //     linkedColInd: 0,
        //     filteredLookupKeys: List<any>(['kL', 'L', 'mL', 'uL', 'g', 'mg', 'ug', 'unit']),
        // });

        const allSamples = !aliquots || aliquots.length === 0;
        if (allSamples) return columnMetadata.asImmutable();

        const allAliquots = this.hasAliquots() && aliquots.length === queryModel.selections.size;
        sampleTypeDomainFields.aliquotFields.forEach(field => {
            columnMetadata = columnMetadata.set(field, {
                isReadOnlyCell: key => aliquots.indexOf(key) === -1,
            });
        });

        sampleTypeDomainFields.metaFields.forEach(field => {
            columnMetadata = columnMetadata.set(field, {
                isReadOnlyCell: key => allAliquots || aliquots.indexOf(key) > -1,
            });
        });

        return columnMetadata.asImmutable();
    };

    render() {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { aliquots, noStorageSamples, readOnlyColumns, sampleTypeDomainFields, ...editableGridProps } =
            this.props;

        return (
            <EditableGridPanelForUpdateWithLineage
                {...editableGridProps}
                extraExportColumns={extraExportColumns}
                getColumnMetadata={this.getSamplesColumnMetadata}
                getParentTypeWarning={this.getParentTypeWarning}
                getReadOnlyRows={this.getReadOnlyRows}
                getTabHeader={this.getTabHeader}
                getTabTitle={this.getTabTitle}
                targetEntityDataType={SampleTypeDataType}
            />
        );
    }
}
