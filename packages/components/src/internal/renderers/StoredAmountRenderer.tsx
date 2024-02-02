import React from 'react';
import { List, Map } from 'immutable';

import { ValueDescriptor } from '../components/editable/models';

import { DefaultRenderer } from './DefaultRenderer';

interface Props {
    data: Map<any, any>;
}

export class StoredAmountRenderer extends React.PureComponent<Props, any> {
    static getEditableRawValue = (values: List<ValueDescriptor>): string[] => {
        return values.size === 1 ? values.first()?.display : undefined;
    };
    static getOriginalRawValue = (values: any): string[] => {
        if (!List.isList(values)) return values;
        return Map.isMap(values.get(0)) ? values.get(0).get('displayValue') : values.get(0).displayValue;
    };

    render() {
        return <DefaultRenderer data={this.props.data} />;
    }
}
