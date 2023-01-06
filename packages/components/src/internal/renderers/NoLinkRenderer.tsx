import { Map } from 'immutable';
import React, { PureComponent, ReactNode } from 'react';
import { DefaultRenderer } from './DefaultRenderer';

interface Props {
    data: Map<any, any>;
}

export class NoLinkRenderer extends PureComponent<Props> {
    render(): ReactNode {
        let { data } = this.props;
        data = data.delete("url");
        return <DefaultRenderer data={data}/>;
    }
}
