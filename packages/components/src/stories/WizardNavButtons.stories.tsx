/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { WizardNavButtons } from '..';

export default {
    title: 'Components/WizardNavButtons',
    component: WizardNavButtons,
    argTypes: {
        cancel: {
            action: 'cancelled',
            control: { disable: true },
            table: { disable: true },
        },
        nextStep: {
            action: 'nextStep',
            control: { disable: true },
            table: { disable: true },
        },
        previousStep: {
            action: 'previousStep',
            control: { disable: true },
            table: { disable: true },
        },
    },
} as Meta;

export const WizardNavButtonsStory: Story = storyProps => <WizardNavButtons {...storyProps as any} />;
WizardNavButtonsStory.storyName = 'WizardNavButtons';

// WizardNavButtonsStory.args = {
// };

// storiesOf('WizardNavButtons', module)
//     .addDecorator(withKnobs)
//     .add('with knobs', () => {
//         return (
//             <WizardNavButtons
//                 cancel={() => console.log('WizardNavButtons cancel button clicked')}
//                 includeNext={boolean('includeNext', true)}
//                 isFinished={boolean('isFinished', true)}
//                 isFinishedText={text('isFinishedText', 'Finished')}
//                 isFinishing={boolean('isFinishing', false)}
//                 isFinishingText={text('isFinishingText', 'Finishing...')}
//                 nextStep={() => console.log('WizardNavButtons next button clicked')}
//                 nextStyle={text('nextStyle', 'success')}
//                 previousStep={() => console.log('WizardNavButtons previous button clicked')}
//                 singularNoun={text('singularNoun', '')}
//             />
//         );
//     });
