import React, { ReactNode } from 'react';
import { List, Map } from 'immutable';

import { getUniqueIdColumnMetadata } from '../entities/utils';

import {
    EditableGridPanelForUpdateWithLineage,
    UpdateGridTab,
} from '../editable/EditableGridPanelForUpdateWithLineage';

import { EditableGridLoaderFromSelection } from '../editable/EditableGridLoaderFromSelection';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { EntityDataType, IEntityTypeOption } from '../entities/models';

import { QueryColumn } from '../../../public/QueryColumn';
import { EditableColumnMetadata } from '../editable/EditableGrid';

import { SampleTypeDataType } from '../entities/constants';

import { SAMPLE_STATE_COLUMN_NAME } from './constants';
import { GroupedSampleFields } from './models';
import { SampleStatusLegend } from './SampleStatusLegend';

interface Props {
    idField: string;
    includedTabs: UpdateGridTab[];
    loaders: EditableGridLoaderFromSelection[];
    onCancel: () => any;
    onComplete: () => any;
    getIsDirty?: () => boolean;
    setIsDirty?: (isDirty: boolean) => void;
    pluralNoun?: string;
    queryModel: QueryModel;
    readOnlyColumns?: List<string>;
    updateAllTabRows: (updateData: any[]) => Promise<any>;
    singularNoun?: string;
    selectionData?: Map<string, any>;

    // passed through from SampleEditableGrid
    aliquots: any[];
    combineParentTypes?: boolean;
    noStorageSamples: any[];
    parentDataTypes: List<EntityDataType>;
    parentTypeOptions: Map<string, List<IEntityTypeOption>>;
    sampleTypeDomainFields: GroupedSampleFields;

    getUpdateColumns?: (tabId?: number) => List<QueryColumn>;
    exportColFilter?: (col: QueryColumn) => boolean;
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
                    getTabHeader={this.getTabHeader}
                    targetEntityDataType={SampleTypeDataType}
                    getParentTypeWarning={this.getParentTypeWarning}
                    extraExportColumns={[
                        {
                            fieldKey: QueryColumn.ALIQUOTED_FROM_LSID,
                            caption: QueryColumn.ALIQUOTED_FROM,
                        },
                    ]}
                />
            </>
        );
    }
}
