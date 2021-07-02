import React, { FC, memo, useCallback, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { Alert } from '../base/Alert';
import { LabelHelpTip } from '../base/LabelHelpTip';
import { FindFieldType } from './constants';
import { getFindSamplesQueryId } from './actions';

interface Props {
    show: boolean
    onCancel: () => void
    onFind: (fieldType: FindFieldType, ids: string[], queryId: string) => void
    nounPlural: string
}

// TODO still references to Samples here.  Rename or parameterize.
export const FindByIdsModal: FC<Props> = memo(props => {
    const { show, onCancel, onFind, nounPlural } = props;

    const [fieldType, setFieldType] = useState<FindFieldType>(FindFieldType.uniqueId);
    const [idString, setIdString] = useState<string>(undefined);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>(undefined);

    const closeModal = useCallback(() => {
        onCancel();
    }, [onCancel])

    const onFieldTypeChange = useCallback((event: any) => {
        setFieldType(event.target.value);
        setIdString("");
    }, [setFieldType]);

    const onIdTextChange = useCallback((event: any) => {
        setIdString(event.target.value);
    }, [setIdString]);

    const onFindSamples = useCallback(() => {
        const ids = idString.split("\n").filter(id => id.trim().length > 0);
        if (ids.length > 0) {
            setSubmitting(true);
            getFindSamplesQueryId(fieldType, ids).then(queryId => {
                onFind(fieldType, ids, queryId);
            }).catch((error) => {
                setError(error);
            });
        }
    }, [setSubmitting, idString, setError, onFind, fieldType, ]);


    return (
        <Modal show={show} bsSize="medium" onHide={closeModal}>
            <Modal.Header closeButton>
                <Modal.Title>Find {nounPlural}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                Find {nounPlural} using:
                </p>

                <label key={FindFieldType.uniqueId.valueOf()} className="find-by-ids-field-label">
                    <input
                        name={FindFieldType.uniqueId.valueOf()}
                        type="radio"
                        onChange={onFieldTypeChange}
                        value={FindFieldType.uniqueId.valueOf()}
                        checked={fieldType === FindFieldType.uniqueId}
                    />
                    Barcodes (Unique ID Field)
                    <LabelHelpTip
                        placement="right"
                        title="Unique ID fields"
                    >
                        The ids provided will be matched against all of the fields of type Unique ID defined in your sample types.
                    </LabelHelpTip>
                </label>
                <label key={FindFieldType.name.valueOf()} className="find-by-ids-field-label">
                    <input
                        name={FindFieldType.name.valueOf()}
                        type="radio"
                        onChange={onFieldTypeChange}
                        value={FindFieldType.name.valueOf()}
                        checked={fieldType === FindFieldType.name}
                    />
                    Sample IDs
                </label>

                <Alert bsStyle={error ? "danger" : "info"}>
                    {error}
                    <p>
                    Scan or paste {fieldType === FindFieldType.name ? 'sample IDs' : 'barcodes'} below, providing one per line.
                    </p>
                </Alert>
                <textarea
                    placeholder={`List ${fieldType === FindFieldType.name ? 'sample IDs' : 'barcodes'} here`}
                    rows={8}
                    cols={50}
                    onChange={onIdTextChange}
                    value={idString}
                />
            </Modal.Body>
            <Modal.Footer>
                <div className="pull-left">
                    <button type="button" className="btn btn-default" onClick={closeModal}>
                        Cancel
                    </button>
                </div>

                <div className="pull-right">
                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={onFindSamples}
                        disabled={!idString || idString.trim().length === 0 || submitting}
                    >
                        {submitting ? 'Finding Samples...' : 'Find Samples'}
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    );
});
