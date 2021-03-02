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
import React, { FC } from 'react';
import { Alert as BootstrapAlert, AlertProps } from 'react-bootstrap';

/**
 * An Alert that will only display if children are available. Defaults to bsStyle "danger".
 */
export const Alert: FC<AlertProps> = props => {
    const { children } = props;
    if (!children) return null;
    return <BootstrapAlert {...props}>{children}</BootstrapAlert>;
};

Alert.defaultProps = {
    bsStyle: 'danger',
};

Alert.displayName = 'Alert';
