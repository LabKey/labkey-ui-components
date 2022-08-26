import React, { FC, memo, useMemo } from 'react';

import { getSampleAssayQueryConfigs } from './actions';
import {LoadingSpinner} from "../base/LoadingSpinner";
import {SchemaQuery} from "../../../public/SchemaQuery";
import {isLoading} from "../../../public/LoadingState";

import {InjectedAssayModel, withAssayModels} from '../assay/withAssayModels';
import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';

const SampleAliquotAssaysCountBodyImpl: FC<InjectedQueryModels> = memo(props => {
    const { queryModels } = props;
    const allModels = Object.values(queryModels);
    const allLoaded = allModels.every(model => !model.isLoading);

    const totalCount = useMemo(() => {
        let count = 0;
        allModels.forEach(model => {
            count += model.rowCount;
        });
        return count;
    }, [allLoaded, queryModels]);

    if (allModels.length === 0) return <>0</>;

    if (!allLoaded) {
        return <LoadingSpinner />;
    }

    return <>{totalCount}</>;
});

const SampleAliquotAssaysCountBody = withQueryModels<any>(SampleAliquotAssaysCountBodyImpl);

interface Props {
    sampleId: string;
    aliquotIds: number[];
    sampleSchemaQuery: SchemaQuery;
}

const SampleAliquotAssaysCountImpl: FC<Props & InjectedAssayModel> = props => {
    const { assayModel, sampleId, sampleSchemaQuery, aliquotIds } = props;
    const loadingDefinitions = isLoading(assayModel.definitionsLoadingState);

    const queryConfigs = useMemo(() => {
        if (loadingDefinitions) {
            return {};
        }

        const _configs = getSampleAssayQueryConfigs(
            assayModel,
            aliquotIds,
            sampleId + '',
            'aliquot-assay',
            true,
            sampleSchemaQuery
        );

        return _configs.reduce((_configs, config) => {
            const modelId = config.id;
            _configs[modelId] = config;
            return _configs;
        }, {});
    }, [assayModel.definitions, loadingDefinitions, sampleSchemaQuery, sampleId, aliquotIds]);

    if (loadingDefinitions) {
        return <LoadingSpinner />;
    }

    return (
        <SampleAliquotAssaysCountBody
            {...props}
            key={'aliquot-assay-stats-' + sampleId}
            queryConfigs={queryConfigs}
            autoLoad={true}
        />
    );
};

export const SampleAliquotAssaysCount = withAssayModels(SampleAliquotAssaysCountImpl);
