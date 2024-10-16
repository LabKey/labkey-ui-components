import React, { ChangeEvent, FC, memo, useCallback } from 'react';

import { SectionHeading } from '../SectionHeading';
import { DomainFieldLabel } from '../DomainFieldLabel';

import { ListModel } from './models';

interface BasicPropertiesInputsProps {
    model: ListModel;
    onInputChange: (any) => void;
}

export const NameInput: FC<BasicPropertiesInputsProps> = memo(({ model, onInputChange }) => (
    <div className="row margin-top">
        <div className="col-xs-3 col-lg-2">
            <DomainFieldLabel
                label="Name"
                required={true}
                helpTipBody="The name for this list. Note that this can be changed after list creation."
            />
        </div>

        <div className="col-xs-9 col-lg-8">
            <input
                className="form-control"
                id="name"
                type="text"
                placeholder="Enter a name for this list"
                value={model.name === null ? '' : model.name}
                onChange={onInputChange}
            />
        </div>
    </div>
));

export const DescriptionInput: FC<BasicPropertiesInputsProps> = memo(({ model, onInputChange }) => (
    <div className="row margin-top">
        <div className="col-xs-3 col-lg-2">
            <DomainFieldLabel label="Description" />
        </div>

        <div className="col-xs-9 col-lg-8">
            <textarea
                className="form-control"
                id="description"
                value={model.description === null ? '' : model.description}
                onChange={onInputChange}
            />
        </div>
    </div>
));

export const BasicPropertiesFields: FC<BasicPropertiesInputsProps> = memo(({ model, onInputChange }) => (
    <div className="col-xs-12 col-md-7">
        <SectionHeading title="Basic Properties" />

        <NameInput model={model} onInputChange={onInputChange} />

        <DescriptionInput model={model} onInputChange={onInputChange} />
    </div>
));

interface CheckBoxRowProps {
    checked: boolean;
    name: string;
    onChange: (name: string, checked: boolean) => void;
    text: string;
}

export const CheckBoxRow: FC<CheckBoxRowProps> = memo(({ checked, onChange, name, text }) => {
    const onChange_ = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            onChange(name, event.target.checked);
        },
        [name, onChange]
    );
    return (
        <div className="list__properties__checkbox-row">
            <div className="form-group">
                <label>
                    <input checked={checked} onChange={onChange_} type="checkbox" />
                    {text}
                </label>
            </div>
        </div>
    );
});
CheckBoxRow.displayName = 'CheckBoxRow';

interface AllowableActionContainerProps {
    model: ListModel;
    onChange: (name: string, checked: boolean) => void;
}
const AllowableActionContainer: FC<AllowableActionContainerProps> = memo(({ model, onChange }) => (
    <div className="list__properties__allowable-actions">
        <CheckBoxRow text="Delete" checked={model.allowDelete} onChange={onChange} name="allowDelete" />
        <CheckBoxRow text="Upload" checked={model.allowUpload} onChange={onChange} name="allowUpload" />
        <CheckBoxRow text="Export & Print" checked={model.allowExport} onChange={onChange} name="allowExport" />
    </div>
));

interface AllowableActionsProps {
    model: ListModel;
    onChange: (name: string, checked: boolean) => void;
}
export const AllowableActions: FC<AllowableActionsProps> = memo(({ model, onChange }) => (
    <div className="col-xs-12 col-md-3">
        <SectionHeading title="Allow these Actions" />
        <AllowableActionContainer model={model} onChange={onChange} />
    </div>
));
AllowableActions.displayName = 'AllowableActions';
