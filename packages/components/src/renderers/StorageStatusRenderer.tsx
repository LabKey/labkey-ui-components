import React from 'react';

interface StorageStatusProps {
    data: any
}

export class StorageStatusRenderer extends React.PureComponent<StorageStatusProps, any> {

    render() {
        const { data } = this.props;

        const value = data && data.get('value');

        if (value.toLowerCase() === 'not in storage') {
            return data.get('value');
        }
        else {
            return <a href={data.get('url')}>{value}</a>
        }
    }
}
