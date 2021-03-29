import React, { FC, memo, useCallback } from 'react';
import { SampleTypeModel } from './models';
import { Alert } from '../../base/Alert';
import { Button } from 'react-bootstrap';
import { IDomainField } from '../models';
import { UNIQUE_ID_TYPE } from '../PropDescType';

interface Props  {
    model: SampleTypeModel
    isFieldsPanel: boolean
    onAddField: (fieldConfig: Partial<IDomainField>) => void
}

export const DEFAULT_UNIQUE_ID_FIELD = {
    dataType: UNIQUE_ID_TYPE,
    conceptURI: UNIQUE_ID_TYPE.conceptURI,
    rangeURI: UNIQUE_ID_TYPE.rangeURI,
    name: 'Barcode',
} as Partial<IDomainField>;

export const UniqueIdBanner: FC<Props> = memo(({ model, isFieldsPanel, onAddField }) => {
    const onClick = useCallback(() => {
        onAddField(DEFAULT_UNIQUE_ID_FIELD);
    }, [onAddField]);


    const uniqueIdFields = model.domain?.fields?.filter(field => field.isUniqueIdField()).toArray();
    if (model.isNew() && !isFieldsPanel && !uniqueIdFields?.length) {
        return <div>Not currently enabled for this sample type</div>
    } else {
        if (!uniqueIdFields?.length) {
            return (
                <Alert bsStyle="info">
                    Do you want to add a unique ID field to create barcodes for this sample type?
                    <Button
                        className="pull-right alert-button"
                        bsStyle="info"
                        onClick={onClick}
                    >
                        Yes, Add Unique ID Field
                    </Button>
                </Alert>
            );
        }
        else if (!isFieldsPanel) {
            return (
                <div>
                    <i className="fa fa-check-circle domain-panel-status-icon-green"/>
                    <span className="left-spacing">
                    { (uniqueIdFields?.length === 1) ?
                        'A Unique ID field for barcodes is defined: ' + uniqueIdFields[0].name  :
                        (uniqueIdFields.length + ' Unique ID fields are defined: ' + uniqueIdFields.map(field => field.name).join(", "))}
                    </span>
                </div>
            )
        }
    }

});
