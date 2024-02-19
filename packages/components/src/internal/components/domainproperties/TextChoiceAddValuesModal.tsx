import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import classNames from 'classnames';
import { Utils } from '@labkey/api';

import { Modal } from '../../Modal';
import { MAX_VALID_TEXT_CHOICES } from './constants';
import { getValidValuesFromArray } from './models';

interface Props {
    fieldName: string;
    initialValueCount?: number;
    maxValueCount?: number;
    onApply: (values: string[]) => void;
    onCancel: () => void;
}

export const TextChoiceAddValuesModal: FC<Props> = memo(props => {
    const { onCancel, onApply, fieldName, initialValueCount = 0, maxValueCount = MAX_VALID_TEXT_CHOICES } = props;
    const [valueStr, setValueStr] = useState<string>('');
    const parsedValues = useMemo(() => {
        return valueStr?.trim().length > 0 ? getValidValuesFromArray(valueStr.split('\n').map(v => v.trim())) : [];
    }, [valueStr]);
    const maxValuesToAdd = useMemo(() => maxValueCount - initialValueCount, [initialValueCount]);
    const hasFieldName = useMemo(() => fieldName?.length > 0, [fieldName]);
    const onChange = useCallback(evt => {
        setValueStr(evt.target.value);
    }, []);
    const onConfirm = useCallback(() => {
        if (parsedValues.length <= maxValuesToAdd) {
            onApply(parsedValues);
        }
    }, [parsedValues, maxValuesToAdd, onApply]);
    const canConfirm = parsedValues.length > 0 && parsedValues.length <= maxValuesToAdd;
    const title = `Add Text Choice Values${hasFieldName ? ' for' + fieldName : ''}`;
    const valueNoun = Utils.pluralize(maxValuesToAdd, 'value', 'values');
    return (
        <Modal canConfirm={canConfirm} confirmText="Apply" onCancel={onCancel} onConfirm={onConfirm} title={title}>
            <p>
                Enter each value on a new line. {valueNoun} can be added.
            </p>
            <textarea
                rows={8}
                cols={50}
                className="form-control textarea-fullwidth"
                placeholder="Enter new values..."
                onChange={onChange}
                value={valueStr}
            />
            <div
                className={classNames('text-choice-value-count', {
                    'domain-text-choices-error': parsedValues.length > maxValuesToAdd,
                })}
            >
                {parsedValues.length === 1
                    ? '1 new value provided.'
                    : `${parsedValues.length} new values provided.`}
            </div>
        </Modal>
    );
});
