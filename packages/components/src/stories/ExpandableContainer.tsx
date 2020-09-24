/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs, boolean } from '@storybook/addon-knobs';

import './stories.scss';
import { ExpandableContainer } from '../internal/components/ExpandableContainer';

storiesOf('ExpandableContainer', module)
    .addDecorator(withKnobs)
    .add('default props', () => {
        return (
            <ExpandableContainer
                iconFaCls="users fa-3x"
                clause={
                    <div className="container-expandable-heading--clause">
                        <h4>Title for My Container</h4>
                    </div>
                }
                links={
                    <div>
                        <span className="container-expandable-heading">
                            <span>
                                <a>Link for the container</a>
                            </span>
                        </span>
                    </div>
                }
                isExpandable={boolean('isExpandable', true)}
                iconClickOnly={boolean('iconClickOnly', false)}
            >
                <div style={{ padding: '20px' }}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
                    et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                    aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
                    cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                    culpa qui officia deserunt mollit anim id est laborum.
                </div>
            </ExpandableContainer>
        );
    });
