import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';

import { resolveErrorMessage } from '../../util/messaging';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { Alert } from '../base/Alert';
import { EntityDataType } from '../entities/models';

import { DataTypeSelector } from '../entities/DataTypeSelector';

import { getProjectConfigurableEntityTypeOptions } from './actions';

interface Props {
    entityDataTypes?: EntityDataType[];
    isNewProject?: boolean;
    showWarning?: boolean;
}

export const ProjectDataTypeSelections: FC<Props> = memo(props => {
    const { entityDataTypes, showWarning, isNewProject } = props;

    const [error, setError] = useState<string>(undefined);
    const [loading, setLoading] = useState<boolean>(true);

    const [disabledTypesMap, setDisabledTypesMap] = useState<{ [key: string]: number[] }>(undefined);
    const [updates, setUpdates] = useState<{ [key: string]: number[] }>({});

    useEffect(() => {
        loadConfigs();
    }, [isNewProject]);

    const loadConfigs = useCallback(async () => {
        try {
            setLoading(true);
            setError(undefined);

            if (!isNewProject) {
                const results = await getProjectConfigurableEntityTypeOptions();
                setDisabledTypesMap(results);
            }
        } catch (e) {
            console.error(e);
            setError(resolveErrorMessage(e));
        } finally {
            setLoading(false);
        }
    }, [isNewProject]);

    const updateUncheckedTypes = useCallback(
        (dataType: string, unchecked: number[]) => {
            const uncheckedUpdates = { ...updates };
            uncheckedUpdates[dataType] = unchecked;
            setUpdates(uncheckedUpdates);
        },
        [updates]
    );

    if (loading) return <LoadingSpinner />;

    return (
        <>
            {error && <Alert>{error}</Alert>}
            <div className="bottom-spacing">Select what types of data will be used in this project.</div>
            <Row>
                {entityDataTypes?.map((entityDataType, index) => {
                    return (
                        <Col key={index} xs={12} md={4} className="bottom-spacing">
                            <DataTypeSelector
                                showWarning={showWarning}
                                entityDataType={entityDataType}
                                updateUncheckedTypes={updateUncheckedTypes}
                                uncheckedEntitiesDB={disabledTypesMap?.[entityDataType.projectConfigurableDataType]}
                            />
                        </Col>
                    );
                })}
            </Row>
        </>
    );
});
