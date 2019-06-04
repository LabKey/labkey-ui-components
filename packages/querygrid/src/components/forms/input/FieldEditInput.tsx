/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { Popover, Button } from 'react-bootstrap'
import Formsy, { withFormsy } from 'formsy-react'
import { List, Record } from 'immutable'

export function cleanProps<P>(props: P, ...propsToRemove: Array<string>): P {
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
    value: undefined
}) {
    caption: string;
    fieldKey: string;
    inputPlaceholder: string;
    inputType: string;
    key: string;
    value?: string;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    getFieldEditInputName(): string {
        return 'fieldEditInput_' + this.fieldKey;
    }
}

interface Props {
    caption?: string
    error?: string
    fields?: List<FieldEditProps>

    hideOverlayFn?: () => void
    onSubmitFn?: Function
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
            title
        });

        return (
            <Popover {...cleanProps(popoverProps, 'hideOverlayFn', 'onSubmitFn')}>
                <Formsy onValidSubmit={onSubmitFn}>
                    {
                        fields.map((field, index) => (
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
                        ))
                    }
                </Formsy>
            </Popover>
        )
    }
}

interface FieldEditInputStateProps {
    caption?: string
    fieldCaption?: string
    inputPlaceholder?: string
    inputType?: any
    name: string
    showButtons?: boolean
    value?: string

    hideOverlayFn?: () => void

    // from formsy-react
    getErrorMessage?: Function
    getValue?: Function
    setValue?: Function
    showRequired?: Function
}

class FieldEditInputImpl extends React.Component<FieldEditInputStateProps, any> {

    static defaultProps = {
        inputPlaceholder: '...'
    };

    handleChange(e) {
        this.props.setValue(e.target.value)
    }

    resolveFormElement() {
        const { inputPlaceholder, inputType, value } = this.props;

        const props = {
            autoFocus: true,
            className: 'form-control',
            defaultValue: value,
            onChange: this.handleChange.bind(this),
            placeholder: inputPlaceholder,
            type: 'text'
        };

        switch (inputType) {
            case 'textarea':
                return (
                    <textarea
                        rows={4}
                        {...props}
                    />
                );

            default:
                return (
                    <input
                        {...props}
                    />
                );
        }
    }

    render() {
        const { caption, fieldCaption, hideOverlayFn } = this.props;

        const showButtons = this.props.showButtons === undefined ? true : this.props.showButtons;

        return (
            <div className="row">
                <div className="field-edit--input-container">
                    <div style={showButtons ? {} : {paddingTop: "10px"}}>
                        {fieldCaption}
                        {this.resolveFormElement()}
                    </div>
                </div>
                {showButtons &&
                <div className="btn-group field-edit--btn-group">
                    <Button bsStyle="warning" onClick={hideOverlayFn}>
                        <i className="fa fa-times-circle" title={'Cancel?'}/>
                    </Button>
                    <Button
                        type="submit"
                        bsStyle="info"
                    >
                        <i className="fa fa-check-circle" title={'Update ' + caption + '?'}/>
                    </Button>
                </div>
                }
            </div>
        )
    }
}

const FieldEditInput = withFormsy(FieldEditInputImpl);