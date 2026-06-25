/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { Map } from 'immutable';
import { SampleStatusTag } from '../components/samples/SampleStatusTag';
import { getSampleStatusFromSampleRow } from '../components/samples/utils';

interface SampleStatusProps {
    row: Map<any, any>;
}

export class SampleStatusRenderer extends React.PureComponent<SampleStatusProps, any> {
    render() {
        const { row } = this.props;
        return <SampleStatusTag status={getSampleStatusFromSampleRow(row.toJS())}/>
    }
}
