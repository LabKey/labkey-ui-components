/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { Alert as BootstrapAlert, AlertProps } from 'react-bootstrap'

/**
 * An Alert that will only display if children are available. Defaults to bsStyle "danger".
 */
export class Alert extends React.Component<AlertProps, any> {

    static defaultProps = {
        bsStyle: 'danger'
    };

    render() {
        const { children } = this.props;

        if (children) {
            return <BootstrapAlert {...this.props}>{children}</BootstrapAlert>;
        }

        return null;
    }
}