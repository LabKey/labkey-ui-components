import React, {ComponentType, FC, memo, useCallback, useEffect, useMemo, useState} from "react";

import {AuditBehaviorTypes, Filter} from "@labkey/api";

import {InjectedQueryModels, RequiresModelAndActions} from "../../../public/QueryModel/withQueryModels";

import { SamplesTabbedGridPanel } from "../samples/SamplesTabbedGridPanel";
import { SamplesEditButtonSections } from "../samples/utils";
import { sampleTypesEqual } from "./utils";
import { FIND_SAMPLE_BY_ID_METRIC_AREA } from "../search/utils";
import { SAMPLE_DATA_EXPORT_CONFIG } from "../samples/constants";
import { QueryModel } from "../../../public/QueryModel/QueryModel";
import {createGridModelId} from "../../models";
import {SCHEMAS} from "../../schemas";
import {SchemaQuery} from "../../../public/SchemaQuery";
import {getSampleTypesFromFindByIdQuery} from "./actions";
import {SampleGridButtonProps} from "../samples/models";
import {SamplesEditableGridProps} from "../samples/SamplesEditableGrid";
import {User} from "../base/models/User";
import {LoadingSpinner} from "../base/LoadingSpinner";

const GRID_PREFIX = "find-by-id-";

interface Props extends InjectedQueryModels {
    allSamplesModel: QueryModel;
    getGridPanelDisplay?: (activeGridId: string) => React.ReactNode;
    sampleGridIds?: string[]
    gridButtons?: ComponentType<SampleGridButtonProps & RequiresModelAndActions>;
    samplesEditableGridProps: Partial<SamplesEditableGridProps>;
    user: User;
}

export const FindSamplesByIdsTabbedGridPanelImpl: FC<Props> = memo(props => {
    const { actions, allSamplesModel, sampleGridIds, queryModels, getGridPanelDisplay, gridButtons, user, samplesEditableGridProps } = props;

    const afterSampleActionComplete = useCallback((): void => {
        actions.loadAllModels();
    }, [actions]);

    const getSampleAuditBehaviorType = useCallback(() => AuditBehaviorTypes.DETAILED, []);

    const getAdvancedExportOptions = useCallback(
        (tabId: string): { [key: string]: any } => {
            return SAMPLE_DATA_EXPORT_CONFIG;
        },
        []
    );

    const allQueryModels = useMemo(() => {
        let models = {};
        models[allSamplesModel.id] = allSamplesModel;
        sampleGridIds.forEach(sampleGridId => {
            models[sampleGridId] = queryModels[sampleGridId];
        });
        return models;
    }, [allSamplesModel.id, sampleGridIds, queryModels]);

    return (
        <>
            <SamplesTabbedGridPanel
                {...props}
                queryModels={allQueryModels}
                asPanel={true}
                withTitle={false}
                afterSampleActionComplete={afterSampleActionComplete}
                actions={actions}
                getSampleAuditBehaviorType={getSampleAuditBehaviorType}
                samplesEditableGridProps={samplesEditableGridProps}
                gridButtons={gridButtons}
                gridButtonProps={{
                    excludedMenuKeys: [SamplesEditButtonSections.IMPORT],
                    metricFeatureArea: FIND_SAMPLE_BY_ID_METRIC_AREA,
                }}
                tabbedGridPanelProps={{
                    alwaysShowTabs: true,
                    getAdvancedExportOptions,
                    exportFilename: 'SamplesFoundById',
                    allowViewCustomization: false,
                    showViewMenu: false,
                    getGridPanelDisplay: getGridPanelDisplay,
                }}
                user={user}
            />
        </>
    );
});

export const FindSamplesByIdsTabbedGridPanel: FC<Props> = memo((props) => {
    const { actions, allSamplesModel } = props;

    const [sampleGridIds, setSampleGridIds] = useState<string[]>(undefined);

    useEffect(() => {
        const gridIds = [];

        getSampleTypesFromFindByIdQuery(allSamplesModel.schemaQuery).then((sampleTypesRows) => {
            if (sampleTypesRows) {
                Object.keys(sampleTypesRows).forEach(sampleType => {
                    const sampleSchemaQuery = SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleType);

                    const sampleGridId = createGridModelId(
                        GRID_PREFIX,
                        sampleSchemaQuery
                    );

                    const filter = Filter.create('RowId', sampleTypesRows[sampleType], Filter.Types.IN);

                    if (!sampleGridIds || sampleGridIds.indexOf(sampleGridId) === -1) {
                        const queryConfig = {
                            id: sampleGridId,
                            schemaQuery: sampleSchemaQuery,
                            baseFilters: [filter],
                            bindURL: false,
                            title: sampleType
                        };

                        actions.addModel(queryConfig, true, false);
                    }

                    gridIds.push(sampleGridId);
                });
            }
            if (!sampleTypesEqual(gridIds, sampleGridIds)) {
                setSampleGridIds(gridIds);
            }

        }).catch((error) => {
            console.error("There was a problem retrieving sample types");
        });
    }, [sampleGridIds, allSamplesModel.id]);

    if (!sampleGridIds)
        return <LoadingSpinner/>;

    return (
        <FindSamplesByIdsTabbedGridPanelImpl
            {...props}
            sampleGridIds={sampleGridIds}
        />
    )
});
