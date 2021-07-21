import React, { FC, memo, ReactNode, useCallback, useState } from 'react';
import { Modal } from 'react-bootstrap';

import { LabelHelpTip } from '../base/LabelHelpTip';
import { FindField } from '../samples/models';
import { capitalizeFirstChar } from '../../util/utils';
import { SAMPLE_ID_FIND_FIELD, UNIQUE_ID_FIND_FIELD } from '../samples/constants';
import { saveIdsToFind } from '../samples/actions';
import { incrementClientSideMetricCount } from '../../actions';
import { resolveErrorMessage } from '../../util/messaging';
import { Alert } from '../base/Alert';

// exported for Jest testing
export const FindFieldOption: FC<{
    field: FindField;
    checked: boolean;
    onFieldChange: (field: FindField) => void;
}> = memo(({ field, checked, onFieldChange }) => {
    const onChange = useCallback(
        (event: any) => {
            onFieldChange(field);
        },
        [onFieldChange]
    );

    return (
        <label key={field.name} className="find-by-ids-field-label">
            <input name={field.name} type="radio" onChange={onChange} value={field.name} checked={checked} />
            {field.label}
            {field.helpText && (
                <LabelHelpTip placement="right" title={field.helpTextTitle}>
                    {field.helpText}
                </LabelHelpTip>
            )}
        </label>
    );
});

interface Props {
    show: boolean;
    onCancel: () => void;
    onFind: (sessionKey: string) => void;
    nounPlural: string;
    sessionKey?: string; // when defined, ids entered will be added to the existing ones in session
}

export const FindByIdsModal: FC<Props> = memo(props => {
    const { show, onCancel, onFind, nounPlural, sessionKey } = props;

    const [fieldType, setFieldType] = useState<FindField>(UNIQUE_ID_FIND_FIELD);
    const [idString, setIdString] = useState<string>(undefined);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<ReactNode>(undefined);

    const reset = () => {
        setIdString(undefined);
        setFieldType(UNIQUE_ID_FIND_FIELD);
        setError(undefined);
    };
    const closeModal = useCallback(() => {
        reset();
        onCancel();
    }, [onCancel]);

    const onFieldTypeChange = useCallback((field: FindField) => {
        setFieldType(field);
    }, []);

    const onIdTextChange = useCallback((event: any) => {
        setIdString(event.target.value);
    }, []);

    const _onFind = useCallback(async () => {
        const ids = idString
            .split('\n')
            .map(id => id.trim())
            .filter(id => id.length > 0);
        if (ids.length > 0) {
            incrementClientSideMetricCount('find' + capitalizeFirstChar(nounPlural) + 'ById', 'findCount');
            setSubmitting(true);
            try {
                const _sessionKey = await saveIdsToFind(fieldType, ids, sessionKey);
                setSubmitting(false);
                reset();
                onFind(_sessionKey);
            } catch (e) {
                setSubmitting(false);
                setError(resolveErrorMessage(e));
            }
        }
    }, [idString, onFind, fieldType]);

    return (
        <Modal show={show} onHide={closeModal}>
            <Modal.Header closeButton>
                <Modal.Title>Find {capitalizeFirstChar(nounPlural)}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert>{error}</Alert>
                <p>Find {nounPlural} using:</p>
                <FindFieldOption
                    field={UNIQUE_ID_FIND_FIELD}
                    checked={fieldType.name === UNIQUE_ID_FIND_FIELD.name}
                    onFieldChange={onFieldTypeChange}
                />
                <FindFieldOption
                    field={SAMPLE_ID_FIND_FIELD}
                    checked={fieldType.name === SAMPLE_ID_FIND_FIELD.name}
                    onFieldChange={onFieldTypeChange}
                />
                <textarea
                    placeholder={`List ${fieldType.nounPlural} here`}
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
                        onClick={_onFind}
                        disabled={!idString || idString.trim().length === 0 || submitting}
                    >
                        {submitting ? `Finding ${nounPlural}...` : `Find ${nounPlural}`}
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    );
});
