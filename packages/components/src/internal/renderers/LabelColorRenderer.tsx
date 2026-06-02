/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent, ReactNode } from 'react';
import { Map } from 'immutable';

import { ColorIcon } from '../components/base/ColorIcon';

interface Props {
    data: Map<any, any>;
}

export class LabelColorRenderer extends PureComponent<Props> {
    render(): ReactNode {
        const { data } = this.props;
        return <ColorIcon value={data?.get('value')} />;
    }
}
