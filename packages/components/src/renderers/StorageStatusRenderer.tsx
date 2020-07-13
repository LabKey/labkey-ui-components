import React from 'react';
import { Map } from 'immutable';

interface StorageStatusProps {
    data: Map<any, any>;
}

export class StorageStatusRenderer extends React.PureComponent<StorageStatusProps, any> {

    render() {
        const { data } = this.props;

        const value = data?.get('value');

        if (value?.toLowerCase() === 'not in storage') {
            return value;
        }
        else {
            return <a href={data.get('url')}>{value}</a>
        }
    }
}
