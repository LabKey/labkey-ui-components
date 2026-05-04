import { ChartLabels } from './models';
import React, { ChangeEvent, FC, memo, useCallback, useState } from 'react';
import { useEnterEscape } from '../../../public/useEnterEscape';

type LabelKey = keyof ChartLabels;

interface Props {
    label: string;
    name: LabelKey;
    onChange: (name: LabelKey, value: string) => void;
    value: string;
}

export const ChartLabelInput: FC<Props> = memo(({ label, name, onChange, value }) => {
    const [inputValue, setInputValue] = useState<string>(value ?? '');
    const onChange_ = useCallback((e: ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value), []);
    const onBlur = useCallback(() => {
        if (inputValue.trim() !== value) onChange(name, inputValue.trim());
    }, [inputValue, name, onChange, value]);
    const onKeyDown = useEnterEscape(onBlur);
    const inputName = `${name}-label`;

    return (
        <div className="form-group row">
            <div className="col-xs-12">
                <label htmlFor={inputName}>{label}</label>
                <input
                    className="form-control"
                    id={inputName}
                    name={inputName}
                    onBlur={onBlur}
                    onChange={onChange_}
                    onKeyDown={onKeyDown}
                    type="text"
                    value={inputValue}
                />
            </div>
        </div>
    );
});
ChartLabelInput.displayName = 'ChartLabelInput';
