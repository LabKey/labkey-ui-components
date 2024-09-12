import React, { FC, memo, useMemo } from 'react';
import { List } from 'immutable';

import { Filter } from '@labkey/api';

import { ExtendedMap } from '../../../public/ExtendedMap';
import { QueryColumn } from '../../../public/QueryColumn';

import { Formsy } from '../forms/formsy';
import { QueryFormInputs } from '../forms/QueryFormInputs';

import { getContainerFilterForLookups } from '../../query/api';

import { PLATE_SET_COLUMN } from './constants';
import { AssayPropertiesPanelProps } from './models';

export const PlatePropertiesPanel: FC<AssayPropertiesPanelProps> = memo(props => {
    const { containerPath, model, onChange, operation } = props;
    // FIXME: Update the AssayWizardModel to use ExtendedMap for plateColumns so we don't need to do this conversion.
    const queryColumns = useMemo(
        () => new ExtendedMap<string, QueryColumn>(model.plateColumns.toJS()),
        [model.plateColumns]
    );

    const queryFilters = useMemo(
        () => ({
            [PLATE_SET_COLUMN]: List.of(Filter.create('Archived', false), Filter.create('Type', 'assay')),
        }),
        []
    );

    if (queryColumns.size === 0) {
        return null;
    }

    return (
        <div className="panel panel-default">
            <div className="panel-heading">Plate Details</div>
            <div className="panel-body">
                <Formsy className="form-horizontal" onChange={onChange}>
                    <QueryFormInputs
                        containerPath={containerPath}
                        containerFilter={getContainerFilterForLookups()}
                        fieldValues={model.plateProperties.toObject()}
                        operation={operation}
                        queryColumns={queryColumns}
                        queryFilters={queryFilters}
                        renderFileInputs
                    />
                </Formsy>
            </div>
        </div>
    );
});

PlatePropertiesPanel.displayName = 'PlatePropertiesPanel';
