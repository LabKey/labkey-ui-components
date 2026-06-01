/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

export class AppendUnits extends React.Component<{ data: any; col: any }, any> {
    render() {
        const { data, col } = this.props;
        // ToDo: adhere to formatting?

        if (data && data.get('value')) {
            return (
                <div>
                    <span>{data.get('value') + ' ' + col.units}</span>
                </div>
            );
        }

        return null;
    }
}
