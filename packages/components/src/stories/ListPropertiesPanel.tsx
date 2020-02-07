import React from 'react';
import { storiesOf } from '@storybook/react';
import { boolean, withKnobs } from '@storybook/addon-knobs';

import { ListModel } from '../components/domainproperties/models';
import { ListPropertiesPanel } from '../components/domainproperties/list/ListPropertiesPanel';

import './stories.scss';



//
// storiesOf("ListPropertiesPanel", module)
//     .addDecorator(withKnobs)
//     .add("Hello World", () => {
//         return (
//             <ListPropertiesPanel
//                 panelStatus={'COMPLETE'}
//                 collapsible={true}
//                 model={ListModel }
//             />
//         )
//     })
// ;
