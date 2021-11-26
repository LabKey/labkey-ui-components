import React from 'react';
import { Map } from 'immutable';
import { SampleStatusTag } from '../components/samples/SampleStatusTag';
import { getSampleStatus } from '../components/samples/utils';

interface SampleStatusProps {
    row: Map<any, any>;
}

export class SampleStatusRenderer extends React.PureComponent<SampleStatusProps, any> {
    render() {
        const { row } = this.props;
        return <SampleStatusTag status={getSampleStatus(row.toJS())}/>
    }
}
