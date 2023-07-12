import React, { FC, memo, useMemo } from 'react';
import Formsy from 'formsy-react';

import { ExtendedMap } from '../../../public/ExtendedMap';
import { QueryColumn } from '../../../public/QueryColumn';

import { QueryFormInputs } from '../forms/QueryFormInputs';

import { getContainerFilterForLookups } from '../../query/api';

import { AssayPropertiesPanelProps } from './models';

export const PlatePropertiesPanel: FC<AssayPropertiesPanelProps> = memo(({ model, onChange, operation }) => {
    // FIXME: Update the AssayWizardModel to use ExtendedMap for plateColumns so we don't need to do this conversion.
    const queryColumns = useMemo(
        () => new ExtendedMap<string, QueryColumn>(model.plateColumns.toJS()),
        [model.plateColumns]
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
                        containerFilter={getContainerFilterForLookups()}
                        fieldValues={model.plateProperties.toObject()}
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
