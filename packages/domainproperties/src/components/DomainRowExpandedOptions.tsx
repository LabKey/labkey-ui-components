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
import {DomainField} from "../models";
import {NameAndLinkingOptions} from "./NameAndLinkingOptions";
import {TextFieldOptions} from "./TextFieldOptions";
import {getTypeName} from "../actions/actions";
import {BooleanFieldOptions} from "./BooleanFieldOptions";
import {NumericFieldOptions} from "./NumericFieldOptions";
import {DateTimeFieldOptions} from "./DateTimeFieldOptions";

interface IDomainRowExpandedOptions {
    field: DomainField
    index: number
    onChange: (string, any) => any
}

export class DomainRowExpandedOptions extends React.Component<IDomainRowExpandedOptions, any> {

    typeDependentOptions = () => {
        const { field, index, onChange } = this.props;

        switch(getTypeName(field)) {
            case 'string':
                return <TextFieldOptions index={index} label='Text Field Options' scale={field.scale} onChange={onChange} />
            case 'flag':
                return <TextFieldOptions index={index} label='Text Field Options' scale={field.scale} onChange={onChange} />
            case 'multiLine':
                return <TextFieldOptions index={index} label='Multi-line Text Field Options' scale={field.scale} onChange={onChange} />
            case 'boolean':
                return <BooleanFieldOptions index={index} label='Boolean Field Options' format={field.format} onChange={onChange} />
            case 'dateTime':
                return <DateTimeFieldOptions index={index} label='Boolean Field Options' format={field.format} excludeFromShifting={field.excludeFromShifting} onChange={onChange} />
            case 'int':
                return <NumericFieldOptions index={index} label='Numeric Field Options' format={field.format} defaultScale={field.defaultScale} onChange={onChange} />
            case 'double':
                return <NumericFieldOptions index={index} label='Numeric Field Options' format={field.format} defaultScale={field.defaultScale} onChange={onChange} />
        }

        return null;
    }

    render() {
        const { field, index, onChange } = this.props;

        return(
            <>
                {this.typeDependentOptions()}
                <NameAndLinkingOptions index={index} field={field} onChange={onChange} />
            </>
        );
    }
}