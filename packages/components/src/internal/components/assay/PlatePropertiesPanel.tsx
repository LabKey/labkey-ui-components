import React, { FC, memo, useMemo } from 'react';
import { List } from 'immutable';
import { Filter } from '@labkey/api';
import Formsy from 'formsy-react';

import { ExtendedMap } from '../../../public/ExtendedMap';
import { QueryColumn } from '../../../public/QueryColumn';

import { QueryFormInputs } from '../forms/QueryFormInputs';

import { getContainerFilterForLookups } from '../../query/api';

import { AssayPropertiesPanelProps } from './models';

export const PlatePropertiesPanel: FC<AssayPropertiesPanelProps> = memo(({ model, onChange, operation }) => {
    // FIXME: Update the AssayWizardModel to use ExtendedMap for plateColumns so we don't need to do this conversion.
    const { queryColumns, queryFilters } = useMemo(() => {
        const columns = new ExtendedMap<string, QueryColumn>(model.plateColumns.toJS());
        const filters: Record<string, List<Filter.IFilter>> = {};

        // NK: This is a bit of hack -- we need to filter for only plate instances, as opposed to plate templates,
        // so this is done via LSID. We should consider exposing the "template" column to this assay.PlateTemplate
        // query or querying against plate.Plate directly. Could that mean we can get rid of assay.PlateTemplate?
        if (columns.has('platetemplate')) {
            const col = columns.get('platetemplate');
            filters[col.fieldKey] = List([Filter.create('lsid', 'PlateInstance', Filter.Types.CONTAINS)]);
        }

        return { queryColumns: columns, queryFilters: filters };
    }, [model.plateColumns]);

    if (queryColumns.size === 0) {
        return null;
    }

    return (
        <div className="panel panel-default">
            <div className="panel-heading">Plate Details</div>
            <div className="panel-body">
                <Formsy className="form-horizontal" onChange={onChange}>
                    <QueryFormInputs
                        containerFilter={getContainerFilterForLookups()}
                        fieldValues={model.plateProperties.toObject()}
                        queryFilters={queryFilters}
                        operation={operation}
                        queryColumns={queryColumns}
                        renderFileInputs
                    />
                </Formsy>
            </div>
        </div>
    );
});

PlatePropertiesPanel.displayName = 'PlatePropertiesPanel';
