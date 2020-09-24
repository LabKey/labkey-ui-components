/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';

interface PermissionProps {
    isAllowed: boolean;
}

/**
 * Used in conjunction with RequiresPermissionHOC and PermissionNotAllowed to selectively render content based on permissions.
 */
export class PermissionAllowed extends React.Component<PermissionProps, any> {
    static defaultProps = {
        isAllowed: true,
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
        isAllowed: false,
    };

    render() {
        return React.Children.only(this.props.children);
    }
}
