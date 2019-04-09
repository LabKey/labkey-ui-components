/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'

interface SpinnerProps {
    msg?: React.ReactNode
    wrapperClassName?: string
}

export class LoadingSpinner extends React.Component<SpinnerProps, any> {

    static defaultProps = {
        msg: 'Loading...',
        wrapperClassName: ''
    };

    render() {
        const { msg, wrapperClassName } = this.props;

        return (
            <span className={wrapperClassName}>
                <i aria-hidden="true" className="fa fa-spinner fa-spin"/> {msg}
            </span>
        )
    }
}