/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { Button } from 'react-bootstrap';

import { AssayDefinitionModel, AssayLink } from '../internal/AssayDefinitionModel';
import { getLocation } from '../internal/util/URL';
import { Alert } from '../internal/components/base/Alert';
import { GENERAL_ASSAY_PROVIDER_NAME } from '../internal/components/assay/constants';

interface Props {
    assay: AssayDefinitionModel;
    link: AssayLink;
}

export class AssayOverrideBanner extends React.Component<Props, any> {
    static defaultProps = {
        override: AssayLink.BEGIN,
    };

    render() {
        const { assay, link } = this.props;
        let href = assay.links.get(link);
        const { query } = getLocation();
        // Convert query param object to query string, query params on location object are already encoded.
        const queryString = query.map((v, k) => `${k}=${v}`).join('&');

        if (queryString) {
            href = `${href}&${queryString}`;
        }

        if (assay && assay.type.toLowerCase() !== GENERAL_ASSAY_PROVIDER_NAME.toLowerCase()) {
            return (
                <Alert bsStyle="warning" className="test-loc-assay-override">
                    <i className="fa fa-exclamation-circle" style={{ paddingRight: '10px' }} />
                    This assay has custom views that provide more specific insights. It is recommended you view this in
                    LabKey Server.
                    {assay.links.get(link) !== undefined && (
                        <div className="pull-right">
                            <Button bsStyle="warning" bsSize="xs" href={href}>
                                View in LabKey Server
                            </Button>
                        </div>
                    )}
                </Alert>
            );
        }

        return null;
    }
}
