/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { Map } from 'immutable';

interface AssayRunReferenceRendererProps {
    data: Map<any, any>;
}

export class AssayRunReferenceRenderer extends React.Component<AssayRunReferenceRendererProps, any> {
    render() {
        const { data } = this.props;
        const displayValue = data && data.size > 0 ? data.get('displayValue') : undefined;
        const value = data && data.size > 0 ? data.get('value') : undefined;

        if (value) {
            let displayStr = 'Run ' + value;
            if (displayValue) {
                displayStr = displayValue + ' (' + displayStr + ')';
            }

            return (
                <div>
                    <a href={'#/rd/assayrun/' + value}>{displayStr}</a>
                </div>
            );
        }

        return null;
    }
}
