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
import * as React from "react";
import {DomainField, IFieldChange} from "../models";
import {NameAndLinkingOptions} from "./NameAndLinkingOptions";
import {TextFieldOptions} from "./TextFieldOptions";
import {BooleanFieldOptions} from "./BooleanFieldOptions";
import {NumericFieldOptions} from "./NumericFieldOptions";
import {DateTimeFieldOptions} from "./DateTimeFieldOptions";
import {LookupFieldOptions} from "./LookupFieldOptions";
import {Row} from "react-bootstrap";
import { List } from "immutable";

interface IDomainRowExpandedOptionsProps {
    field: DomainField
    index: number
    onChange: (fieldId: string, value: any, index?: number, expand?: boolean) => any
    onMultiChange: (changes: List<IFieldChange>) => void
}

export class DomainRowExpandedOptions extends React.Component<IDomainRowExpandedOptionsProps, any> {

    typeDependentOptions = () => {
        const { field, index, onChange, onMultiChange } = this.props;

        switch(field.dataType.name) {
            case 'string':
                return <TextFieldOptions index={index} label='Text Options' scale={field.scale} onChange={onChange} lockType={field.lockType} />
            case 'flag':
                return <TextFieldOptions index={index} label='Flag Options' scale={field.scale} onChange={onChange} lockType={field.lockType} />
            case 'multiLine':
                return <TextFieldOptions index={index} label='Multi-line Text Field Options' scale={field.scale} onChange={onChange} lockType={field.lockType} />
            case 'boolean':
                return <BooleanFieldOptions index={index} label='Boolean Field Options' format={field.format} onChange={onChange} lockType={field.lockType} />
            case 'dateTime':
                return <DateTimeFieldOptions index={index} label='Date and Time Options' format={field.format} excludeFromShifting={field.excludeFromShifting} onChange={onChange} lockType={field.lockType} />
            case 'int':
                return <NumericFieldOptions index={index} label='Integer Options' format={field.format} defaultScale={field.defaultScale} onChange={onChange} lockType={field.lockType} />
            case 'double':
                return <NumericFieldOptions index={index} label='Decimal Options' format={field.format} defaultScale={field.defaultScale} onChange={onChange} lockType={field.lockType} />
            case 'lookup':
                return <LookupFieldOptions index={index}
                                           label='Lookup Definition Options'
                                           lookupContainer={field.lookupContainer}
                                           lookupSchema={field.lookupSchema}
                                           lookupQueryValue={field.lookupQueryValue}
                                           original={field.original}
                                           onChange={onChange}
                                           onMultiChange={onMultiChange}
                                           lockType={field.lockType}  />
        }

        return null;
    };

    render() {
        const { field, index, onChange } = this.props;

        return(
            <div className='domain-row-container'>
                <div className='domain-row-handle'/>
                <div className='domain-row-main'>
                    {this.typeDependentOptions()}
                    <NameAndLinkingOptions index={index} field={field} onChange={onChange}/>
                    {/*<Row style={{height: '20px'}}/>*/}
                </div>
            </div>
        );
    }
}