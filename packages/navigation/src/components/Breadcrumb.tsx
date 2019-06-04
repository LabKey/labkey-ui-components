/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import classNames from 'classnames'

interface Props {
    className?: string
}

export class Breadcrumb extends React.Component<Props, any> {

    render() {
        const { children, className } = this.props;

        return (
            <ol className={classNames('breadcrumb', className)}>
                {React.Children.map(children, child => <li>{child}</li>)}
            </ol>
        )
    }
}