import React, { ReactNode } from 'react';
import { List, Map } from 'immutable';

import {
    EditableColumnMetadata,
    EditableGridLoaderFromSelection,
    EntityDataType,
    GroupedSampleFields,
    IEntityTypeOption,
    QueryColumn,
    QueryModel,
    SAMPLE_STATE_COLUMN_NAME,
    SampleTypeDataType,
} from '../../..';

import { getUniqueIdColumnMetadata } from '../entities/utils';
import { SampleStatusLegend } from './SampleStatusLegend';
import { EditableGridPanelForUpdateWithLineage } from "../editable/EditableGridPanelForUpdateWithLineage";

export enum GridTab {
    Samples,
    Storage,
    Lineage,
}

interface Props {
    queryModel: QueryModel;
    loaders: EditableGridLoaderFromSelection[];
    selectionData?: Map<string, any>;
    updateAllTabRows: (updateData: any[]) => Promise<any>;
    onCancel: () => any;
    onComplete: () => any;
    idField: string;
    singularNoun?: string;
    pluralNoun?: string;
    readOnlyColumns?: List<string>;
    getUpdateColumns?: (tabId?: number) => List<QueryColumn>;
    includedTabs: GridTab[];

    // passed through from SampleEditableGrid
    parentDataTypes: List<EntityDataType>;
    combineParentTypes?: boolean;
    aliquots: any[];
    noStorageSamples: any[];
    sampleTypeDomainFields: GroupedSampleFields;
    parentTypeOptions: Map<string, List<IEntityTypeOption>>;
}

export class SamplesEditableGridPanelForUpdate extends React.Component<Props> {

    hasAliquots = (): boolean => {
        const { aliquots } = this.props;
        return aliquots && aliquots.length > 0;
    };

    getCurrentTab = (tabInd: number): number => {
        const { includedTabs } = this.props;
        return tabInd === undefined ? includedTabs[0] : includedTabs[tabInd];
    };

    getTabTitle = (tabInd: number): string => {
        const { includedTabs } = this.props;

        if (includedTabs[tabInd] === GridTab.Storage) return 'Storage Details';
        if (includedTabs[tabInd] === GridTab.Lineage) return 'Lineage Details';
        return 'Sample Data';
    };

    getParentTypeWarning = (): ReactNode => {
        return <div className="sample-status-warning">Lineage for aliquots cannot be changed.</div>
    }

    getAdditionalTabs = (tab: number): ReactNode => {
        if (tab === GridTab.Storage) {
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
    }

    getReadOnlyRows = (tabInd: number): List<string> => {
        const { aliquots, noStorageSamples, includedTabs } = this.props;

        if (includedTabs[tabInd] === GridTab.Storage) {
            return List<string>(noStorageSamples);
        } else if (includedTabs[tabInd] === GridTab.Lineage) {
            return List<string>(aliquots);
        } else {
            return undefined;
        }
    };

    getSamplesColumnMetadata = (tabInd: number): Map<string, EditableColumnMetadata> => {
        if (this.getCurrentTab(tabInd) !== GridTab.Samples) return undefined;

        const { aliquots, sampleTypeDomainFields, queryModel } = this.props;
        let columnMetadata = getUniqueIdColumnMetadata(queryModel.queryInfo);
        columnMetadata = columnMetadata.set(SAMPLE_STATE_COLUMN_NAME, {
            hideTitleTooltip: true,
            toolTip: <SampleStatusLegend />,
            popoverClassName: 'label-help-arrow-left',
        });

        const allSamples = !aliquots || aliquots.length === 0;
        if (allSamples) return columnMetadata.asImmutable();

        const allAliquots = this.hasAliquots() && aliquots.length === queryModel.selections.size;
        sampleTypeDomainFields.aliquotFields.forEach(field => {
            columnMetadata = columnMetadata.set(field, {
                isReadOnlyCell: key => {
                    return aliquots.indexOf(key) === -1;
                },
            });
        });

        sampleTypeDomainFields.metaFields.forEach(field => {
            columnMetadata = columnMetadata.set(field, {
                isReadOnlyCell: key => {
                    return allAliquots || aliquots.indexOf(key) > -1;
                },
            });
        });

        return columnMetadata.asImmutable();
    };

    render() {
        const { ...editableGridProps } = this.props;

        return (
            <>
                <EditableGridPanelForUpdateWithLineage
                    {...editableGridProps}
                    getColumnMetadata={this.getSamplesColumnMetadata}
                    getTabTitle={this.getTabTitle}
                    getReadOnlyRows={this.getReadOnlyRows}
                    getAdditionalTabs={this.getAdditionalTabs}
                    targetEntityDataType={SampleTypeDataType}
                    getParentTypeWarning={this.getParentTypeWarning}
                />
            </>
        );
    }
}
