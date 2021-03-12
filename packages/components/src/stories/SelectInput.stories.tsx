import React, { useMemo } from 'react';
import Formsy from 'formsy-react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { SelectInput } from '..';

import { disableControls } from './storyUtils';

export default {
    title: 'Components/SelectInput',
    component: SelectInput,
    argTypes: {
        afterInputElement: disableControls(),
        formsy: disableControls(),
        getErrorMessage: disableControls(),
        getValue: disableControls(),
        onBlur: { action: 'blur', ...disableControls() },
        onChange: { action: 'change', ...disableControls() },
        onFocus: { action: 'focus', ...disableControls() },
        onToggleDisable: { action: 'toggleDisabled', ...disableControls() },
        optionRenderer: disableControls(),
        renderFieldLabel: disableControls(),
        setValue: disableControls(),
        showRequired: disableControls(),
    },
} as Meta;

export const SelectInputStory: Story = props => <SelectInput {...props} />;

SelectInputStory.storyName = 'SelectInput';

SelectInputStory.args = {
    formsy: false,
    id: 'select-input-id',
    label: 'Famous Quarterbacks',
    name: 'storybookSelectInput',
    options: [
        { label: 'Brady', value: 12 },
        { label: 'Davis', value: 30 },
        { label: 'Elway', value: 7 },
        { label: 'Montana', value: 16 },
    ],
    selectedOptions: [{ label: 'Elway', value: 7 }],
    value: 16,
};

export const SelectInputFormsyStory: Story = props => {
    const getErrorMessage = useMemo(() => {
        if (!props.errorMsg) {
            return undefined;
        }

        return () => props.errorMsg;
    }, [props.errorMsg]);

    return (
        <Formsy>
            <SelectInput {...props} getErrorMessage={getErrorMessage} />
        </Formsy>
    );
};

SelectInputFormsyStory.storyName = 'SelectInput -- Formsy';

SelectInputFormsyStory.args = {
    formsy: true,
    errorMsg: '',
    name: 'storybookSelectInput',
};
