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
import { storiesOf } from '@storybook/react';
import { boolean, withKnobs } from '@storybook/addon-knobs';

import { CreateUsersModal } from '../components/user/CreateUsersModal';
import { SECURITY_ROLE_AUTHOR, SECURITY_ROLE_EDITOR, SECURITY_ROLE_READER } from '../test/data/constants';
import './stories.scss';

const ROLE_OPTIONS = [
    { id: SECURITY_ROLE_READER, label: 'Reader (default)' },
    { id: SECURITY_ROLE_AUTHOR, label: 'Author' },
    { id: SECURITY_ROLE_EDITOR, label: 'Editor' },
];

storiesOf('CreateUsersModal', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        const showRoleOptions = boolean('showRoleOptions', true);

        return (
            <CreateUsersModal
                onCancel={() => console.log('cancel create new users')}
                onComplete={() => console.log('complete create new users')}
                show={true}
                roleOptions={showRoleOptions ? ROLE_OPTIONS : undefined}
            />
        );
    });
