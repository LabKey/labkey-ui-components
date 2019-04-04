/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'

interface PageHeaderProps {
    icon?: string
    // showNotifications?: boolean
    title?: string
}

export class PageHeader extends React.Component<PageHeaderProps, any> {

    // static defaultProps = {
    //     showNotifications: true
    // };

    render() {
        const { icon, title } = this.props;

        return (
            <div className="page-header">
                {this.props.children}
                <h2 className="text-capitalize no-margin-top">
                    {icon ? <span className={`fa fa-${icon}`}>&nbsp;</span> : null}
                    {title}
                </h2>
                {/*{showNotifications && <Notification/>}*/}
            </div>
        )
    }
}
