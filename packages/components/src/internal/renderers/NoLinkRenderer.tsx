/*
 * Copyright (c) 2023-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Map } from 'immutable';
import React, { PureComponent, ReactNode } from 'react';
import { DefaultRenderer } from './DefaultRenderer';

interface Props {
    data: Map<any, any>;
}

export class NoLinkRenderer extends PureComponent<Props> {
    render(): ReactNode {
        let { data } = this.props;
        if (data)
            data = data.delete("url");
        return <DefaultRenderer data={data}/>;
    }
}
