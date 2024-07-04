import React, { PureComponent, ReactNode } from 'react';
import { FormControl } from 'react-bootstrap';

import { createFormInputId, createFormInputName } from './utils';
import { DOMAIN_FIELD_VALUE_EXPRESSION } from './constants';
import { DomainField } from './models';
import { SectionHeading } from './SectionHeading';
import { isFieldFullyLocked, isFieldPartiallyLocked } from './propertiesUtil';

interface Props {
    domainIndex: number;
    field: DomainField;
    index: number;
    onChange: (string, any) => void;
}

export class CalculatedFieldOptions extends PureComponent<Props> {
    handleChange = (evt: any): void => {
        this.onChange(evt.target.id, evt.target.value);
    };

    onChange = (id: string, value: any): void => {
        this.props?.onChange(id, value);
    };

    render(): ReactNode {
        const { index, field, domainIndex } = this.props;

        return (
            <div>
                <div className="row">
                    <div className="col-xs-12">
                        <SectionHeading title="Expression" cls="bottom-spacing" helpTipBody={<p>TODO...</p>} />
                    </div>
                </div>
                <div className="row">
                    <div className="col-xs-12">
                        <FormControl
                            componentClass="textarea"
                            rows={4}
                            value={field.valueExpression || ''}
                            id={createFormInputId(DOMAIN_FIELD_VALUE_EXPRESSION, domainIndex, index)}
                            name={createFormInputName(DOMAIN_FIELD_VALUE_EXPRESSION)}
                            onChange={this.handleChange}
                            disabled={isFieldPartiallyLocked(field.lockType) || isFieldFullyLocked(field.lockType)}
                        />
                    </div>
                </div>
            </div>
        );
    }
}
