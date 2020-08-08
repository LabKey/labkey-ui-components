/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { Button, Popover } from 'react-bootstrap';
import Formsy, { withFormsy } from 'formsy-react';
import { List, Record } from 'immutable';

export function cleanProps<P>(props: P, ...propsToRemove: string[]): P {
    if (props) {
        propsToRemove.forEach(k => delete props[k]);
    }
    return props;
}

export class FieldEditProps extends Record({
    caption: undefined,
    fieldKey: undefined,
    inputPlaceholder: undefined,
    inputType: undefined,
    key: undefined,
    value: undefined,
}) {
    caption: string;
    fieldKey: string;
    inputPlaceholder: string;
    inputType: string;
    key: string;
    value?: string;

    getFieldEditInputName(): string {
        return 'fieldEditInput_' + this.fieldKey;
    }
}

interface Props {
    caption?: string;
    error?: string;
    fields?: List<FieldEditProps>;

    hideOverlayFn?: () => void;
    onSubmitFn?: Function;
}

export class FieldEditForm extends React.Component<Props, any> {
    render() {
        const { caption, error, fields, hideOverlayFn, onSubmitFn } = this.props;

        const title = (
            <span>
                {'Edit ' + caption}
                {error && (
                    <span>
                        <span> - </span>
                        <span className="edit__warning">Error: {error}</span>
                    </span>
                )}
            </span>
        );

        const popoverProps: any = Object.assign({}, this.props, {
            id: 'field-popover',
            placement: 'bottom',
            title,
        });

        return (
            <Popover {...cleanProps(popoverProps, 'hideOverlayFn', 'onSubmitFn')}>
                <Formsy onValidSubmit={onSubmitFn}>
                    {fields.map((field, index) => (
                        <FieldEditInput
                            caption={caption}
                            fieldCaption={field.caption}
                            inputType={field.inputType}
                            key={index}
                            name={field.getFieldEditInputName()}
                            inputPlaceholder={field.inputPlaceholder}
                            showButtons={index === 0}
                            value={field.value}
                            hideOverlayFn={hideOverlayFn}
                        />
                    ))}
                </Formsy>
            </Popover>
        );
    }
}

interface FieldEditInputStateProps {
    caption?: string;
    fieldCaption?: string;
    inputPlaceholder?: string;
    inputType?: any;
    name: string;
    showButtons?: boolean;
    value?: string;

    hideOverlayFn?: () => void;

    // from formsy-react
    getErrorMessage?: Function;
    getValue?: Function;
    setValue?: Function;
    showRequired?: Function;
}

class FieldEditInputImpl extends React.Component<FieldEditInputStateProps, any> {
    static defaultProps = {
        inputPlaceholder: '...',
    };

    handleChange(e) {
        this.props.setValue(e.target.value);
    }

    resolveFormElement() {
        const { inputPlaceholder, inputType, value } = this.props;

        const props = {
            autoFocus: true,
            className: 'form-control',
            defaultValue: value,
            onChange: this.handleChange.bind(this),
            placeholder: inputPlaceholder,
            type: 'text',
        };

        switch (inputType) {
            case 'textarea':
                return <textarea rows={4} {...props} />;

            default:
                return <input {...props} />;
        }
    }

    render() {
        const { caption, fieldCaption, hideOverlayFn } = this.props;

        const showButtons = this.props.showButtons === undefined ? true : this.props.showButtons;

        return (
            <div className="row">
                <div className="field-edit--input-container">
                    <div style={showButtons ? {} : { paddingTop: '10px' }}>
                        {fieldCaption}
                        {this.resolveFormElement()}
                    </div>
                </div>
                {showButtons && (
                    <div className="btn-group field-edit--btn-group">
                        <Button bsStyle="warning" onClick={hideOverlayFn}>
                            <i className="fa fa-times-circle" title="Cancel?" />
                        </Button>
                        <Button type="submit" bsStyle="info">
                            <i className="fa fa-check-circle" title={'Update ' + caption + '?'} />
                        </Button>
                    </div>
                )}
            </div>
        );
    }
}

const FieldEditInput = withFormsy(FieldEditInputImpl);
