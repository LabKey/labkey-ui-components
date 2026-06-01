/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, PropsWithChildren } from 'react';

import { AssayProvider } from './AssayPicker';

interface StandardAssayPanelProps extends PropsWithChildren {
    provider?: AssayProvider;
}

export const StandardAssayPanel: FC<StandardAssayPanelProps> = memo(props => {
    const { provider, children } = props;

    return (
        <div>
            <div className="row">
                <div className="col-xs-6">
                    <div className="margin-bottom">
                        <b>Standard Assay</b>
                        <span className="gray-text"> (Recommended)</span>
                    </div>
                    <p>
                        Standard assays are the most flexible choice for working with experimental data. Use this assay
                        type to customize the format for mapping your experimental results.
                    </p>
                </div>
            </div>
            <div className="row">
                <div className="col-xs-6">
                    <div className="margin-bottom margin-top">
                        <b>Supported File Types</b>
                    </div>
                    <p>{provider?.fileTypes.join(', ')}</p>
                </div>
            </div>
            {children}
        </div>
    );
});

StandardAssayPanel.displayName = 'StandardAssayPanel';
