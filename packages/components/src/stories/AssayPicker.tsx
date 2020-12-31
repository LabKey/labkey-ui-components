import React from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';

import './stories.scss';
import mock, { proxy } from 'xhr-mock';

import { AssayPicker } from '../internal/components/assay/AssayPicker';

mock.setup();
mock.use(proxy);

storiesOf('AssayPicker', module)
    .addDecorator(withKnobs)
    .add('assay picker', () => {
        const onNoopSelect = () => {};

        return (
            <AssayPicker
                showImport={true}
                onProviderSelect={onNoopSelect}
                onContainerSelect={onNoopSelect}
                onFileChange={onNoopSelect}
                setIsFileUpload={onNoopSelect}
            />
        );
    });
