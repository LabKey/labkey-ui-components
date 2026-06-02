/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
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
            return value;
        } else {
            return <a href={data.get('url')}>{value}</a>;
        }
    }
}
