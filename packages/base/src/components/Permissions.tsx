/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'


interface PermissionProps {
    isAllowed: boolean
}

/**
 * Used in conjunction with RequiresPermissionHOC and PermissionNotAllowed to selectively render content based on permissions.
 */
export class PermissionAllowed extends React.Component<PermissionProps, any> {

    static defaultProps = {
        isAllowed: true
    };

    render() {
        return React.Children.only(this.props.children);
    }
}

/**
 * Used in conjunction with RequiresPermissionHOC and PermissionNotAllows to selectively render content based on permissions.
 */
export class PermissionNotAllowed extends React.Component<PermissionProps, any> {

    static defaultProps = {
        isAllowed: false
    };

    render() {
        return React.Children.only(this.props.children);
    }
}
