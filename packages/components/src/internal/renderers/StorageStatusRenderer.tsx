import React from 'react';
import { Map } from 'immutable';

interface StorageStatusProps {
    data: Map<any, any>;
}

export class StorageStatusRenderer extends React.PureComponent<StorageStatusProps> {
    render() {
        const { data } = this.props;

        if (!data) return null;

        const value = data.get('value');

        if (value?.toLowerCase() === 'not in storage' || value?.toLowerCase() === 'removed') {
            return <span>{value}</span>;
        } else {
            return <a href={data.get('url')}>{value}</a>;
        }
    }
}
