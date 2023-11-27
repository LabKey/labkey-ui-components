/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { FC, memo, useEffect, useState } from 'react';
import { List } from 'immutable';
import { Query } from '@labkey/api';

import { processSchemas } from '../../query/utils';
import { GridColumn } from '../base/models/GridColumn';
import { SchemaDetails } from '../../SchemaDetails';
import { AppURL } from '../../url/AppURL';
import { naturalSortByProperty } from '../../../public/sort';
import { isLoading, LoadingState } from '../../../public/LoadingState';
import { resolveErrorMessage } from '../../util/messaging';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { Alert } from '../base/Alert';
import { Grid } from '../base/Grid';

const columns = List([
    new GridColumn({
        index: 'schemaName',
        title: 'Schema',
        cell: (schemaName: string, details: SchemaDetails) => {
            if (details) {
                return (
                    <a className="text-capitalize" href={AppURL.create('q', details.fullyQualifiedName).toHref()}>
                        {schemaName}
                    </a>
                );
            }

            return <span className="text-capitalize">{schemaName}</span>;
        },
    }),
    new GridColumn({
        index: 'description',
        title: 'Description',
    }),
]);

function fetchSchemas(schemaName?: string): Promise<List<SchemaDetails>> {
    return new Promise((resolve, reject) => {
        Query.getSchemas({
            apiVersion: 9.3,
            schemaName,
            success: schemas => {
                resolve(
                    processSchemas(schemas)
                        .filter(schema => {
                            // Here we parse each schema's fullyQualifiedName to determine if it
                            // represents a nested schema (e.g. "assay.General.AminoAcidInClientC")
                            // of the currently supplied "schemaName".
                            const start = schemaName ? schemaName.length + 1 : 0;
                            return schema.fullyQualifiedName.substring(start).indexOf('.') === -1;
                        })
                        .sort(naturalSortByProperty('schemaName'))
                        .toList()
                );
            },
            failure: error => {
                console.error(error);
                reject(error);
            },
        });
    });
}

interface Props {
    asPanel?: boolean;
    hideEmpty?: boolean;
    schemaName?: string;
    title?: string;
}

export const SchemaListing: FC<Props> = memo(({ asPanel, hideEmpty, schemaName, title = 'Schemas' }) => {
    const [error, setError] = useState<string>();
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [schemas, setSchemas] = useState<List<SchemaDetails>>(List());

    useEffect(() => {
        setError(undefined);
        setLoadingState(LoadingState.LOADING);
        (async () => {
            try {
                const schemas_ = await fetchSchemas(schemaName);
                setSchemas(schemas_);
            } catch (e) {
                setError(resolveErrorMessage(e) ?? 'Failed to load schema information.');
            }
            setLoadingState(LoadingState.LOADED);
        })();
    }, [schemaName]);

    if (isLoading(loadingState)) {
        return <LoadingSpinner />;
    } else if (error) {
        return <Alert>{error}</Alert>;
    }

    if (hideEmpty && schemas.count() === 0) {
        return null;
    }

    const grid = <Grid columns={columns} data={schemas} />;

    if (asPanel) {
        return (
            <div className="panel panel-default">
                <div className="panel-heading">{title}</div>
                <div className="panel-body">{grid}</div>
            </div>
        );
    }

    return grid;
});

SchemaListing.displayName = 'SchemaListing';
