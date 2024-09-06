import React, { FC, memo, ReactNode, useCallback, useState } from 'react';

import { Modal } from '../../Modal';
import { LabelHelpTip } from '../base/LabelHelpTip';
import { FindField } from '../samples/models';
import { capitalizeFirstChar } from '../../util/utils';
import { SAMPLE_ID_FIND_FIELD, UNIQUE_ID_FIND_FIELD } from '../samples/constants';
import { saveIdsToFind } from '../samples/actions';
import { resolveErrorMessage } from '../../util/messaging';
import { Alert } from '../base/Alert';
import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

// exported for Jest testing
export const FindFieldOption: FC<{
    checked: boolean;
    field: FindField;
    onFieldChange: (field: FindField) => void;
}> = memo(({ field, checked, onFieldChange }) => {
    const onChange = useCallback(() => {
        onFieldChange(field);
    }, [field, onFieldChange]);

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
    api?: ComponentsAPIWrapper;
    initialField?: FindField;
    nounPlural: string;
    onCancel: () => void;
    onFind: (sessionKey: string) => void;
    sessionKey?: string; // when defined, ids entered will be added to the existing ones in session
}

const MAX_IDS = 1000;

export const FindByIdsModal: FC<Props> = memo(props => {
    const { api = getDefaultAPIWrapper(), onCancel, onFind, nounPlural, sessionKey, initialField } = props;
    const [fieldType, setFieldType] = useState<FindField>(initialField || UNIQUE_ID_FIND_FIELD);
    const [idString, setIdString] = useState<string>(undefined);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<ReactNode>(undefined);
    const capitalNounPlural = capitalizeFirstChar(nounPlural);

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
        if (ids.length > MAX_IDS) {
            setError(
                'The number of ' +
                    fieldType.label +
                    ' provided (' +
                    ids.length.toLocaleString() +
                    ') exceeds the maximum of ' +
                    MAX_IDS.toLocaleString() +
                    '.'
            );
            return;
        }
        if (ids.length > 0) {
            setSubmitting(true);
            try {
                const _sessionKey = await saveIdsToFind(fieldType, ids, sessionKey);
                api.query.incrementClientSideMetricCount('find' + capitalNounPlural + 'ById', 'findCount');
                setSubmitting(false);
                reset();
                onFind(_sessionKey);
            } catch (e) {
                setSubmitting(false);
                setError(resolveErrorMessage(e));
            }
        }
    }, [idString, fieldType, sessionKey, api.query, capitalNounPlural, onFind]);

    return (
        <Modal
            confirmText={`Find ${capitalNounPlural}`}
            confirmingText={`Finding ${capitalNounPlural}...`}
            canConfirm={idString && idString.trim().length > 0}
            isConfirming={submitting}
            onCancel={closeModal}
            onConfirm={_onFind}
            title={`Find ${capitalNounPlural}`}
        >
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
                rows={8}
                cols={50}
                className="form-control textarea-fullwidth"
                placeholder={`List ${fieldType.nounPlural} here (max: ${MAX_IDS.toLocaleString()})`}
                onChange={onIdTextChange}
                value={idString}
            />
        </Modal>
    );
});

FindByIdsModal.displayName = 'FindByIdsModal';
