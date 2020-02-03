import React from 'react';
import { storiesOf } from '@storybook/react';
import { boolean, withKnobs } from '@storybook/addon-knobs';

import { ListPropertiesPanel } from '../components/domainproperties/list/ListPropertiesPanel';

import './stories.scss';

storiesOf("ListPropertiesPanel", module)
    .addDecorator(withKnobs)
    .add("Hello World", () => {
        return (
            <ListPropertiesPanel />
        )
    })
;
