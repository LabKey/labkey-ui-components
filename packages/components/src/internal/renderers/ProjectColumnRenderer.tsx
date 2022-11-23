import { Map } from 'immutable';
import React, { PureComponent, ReactNode } from 'react';

interface Props {
    data: Map<any, any>;
}

export class ProjectColumnRenderer extends PureComponent<Props> {
    render(): ReactNode {
        const { data } = this.props;
        return data?.get('displayValue');
    }
}
