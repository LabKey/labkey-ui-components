import React, { FC, memo, useEffect, useMemo, useState } from 'react';

import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';
import { SchemaQuery } from '../public/SchemaQuery';
import { isLoading } from '../public/LoadingState';

import { InjectedAssayModel, withAssayModels } from '../internal/components/assay/withAssayModels';
import { InjectedQueryModels, withQueryModels } from '../public/QueryModel/withQueryModels';

import { getSampleAssayQueryConfigs } from '../internal/components/samples/actions';
import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../internal/APIWrapper';

const SampleAliquotAssaysCountBodyImpl: FC<InjectedQueryModels> = memo(props => {
    const { queryModels } = props;
    const allModels = Object.values(queryModels);
    const allLoaded = allModels.every(model => !model.isLoadingTotalCount);

    const totalCount = useMemo(() => {
        let count = 0;
        allModels.forEach(model => {
            count += model.rowCount;
        });
        return count;
    }, [allModels]);

    if (allModels.length === 0) return <>0</>;

    if (!allLoaded) {
        return <LoadingSpinner msg="" />;
    }

    return <>{totalCount}</>;
});

const SampleAliquotAssaysCountBody = withQueryModels<any>(SampleAliquotAssaysCountBodyImpl);

interface Props {
    aliquotIds: number[];
    api?: ComponentsAPIWrapper;
    sampleId: string;
    sampleSchemaQuery: SchemaQuery;
}

const SampleAliquotAssaysCountImpl: FC<Props & InjectedAssayModel> = props => {
    const { assayModel, sampleId, sampleSchemaQuery, aliquotIds, api } = props;
    const [distinctAssays, setDistinctAssays] = useState<string[]>();
    const loadingDefinitions = isLoading(assayModel.definitionsLoadingState);

    useEffect(() => {
        (async () => {
            const distinctAssays_ = await api.samples.getDistinctAssaysPerSample(aliquotIds);
            setDistinctAssays(distinctAssays_);
        })();
    }, [aliquotIds, api.samples]);

    const queryConfigs = useMemo(() => {
        if (loadingDefinitions || !distinctAssays) {
            return;
        }

        const _configs = getSampleAssayQueryConfigs(
            assayModel,
            aliquotIds,
            sampleId + '',
            'aliquot-assay',
            true,
            sampleSchemaQuery,
            distinctAssays
        );

        return _configs.reduce((configs, config) => {
            const modelId = config.id;
            configs[modelId] = config;
            return configs;
        }, {});
    }, [loadingDefinitions, aliquotIds, assayModel, sampleId, sampleSchemaQuery, distinctAssays]);

    if (loadingDefinitions || !queryConfigs) {
        return <LoadingSpinner msg="" />;
    }

    return (
        <SampleAliquotAssaysCountBody
            {...props}
            key={'aliquot-assay-stats-' + sampleId}
            queryConfigs={queryConfigs}
            autoLoad
        />
    );
};

SampleAliquotAssaysCountImpl.defaultProps = {
    api: getDefaultAPIWrapper(),
};

export const SampleAliquotAssaysCount = withAssayModels(SampleAliquotAssaysCountImpl);
