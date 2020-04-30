/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { boolean, text, withKnobs } from '@storybook/addon-knobs';

import { WizardNavButtons } from '../components/buttons/WizardNavButtons';
import './stories.scss';

storiesOf('WizardNavButtons', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        return (
            <WizardNavButtons
                cancel={() => console.log('WizardNavButtons cancel button clicked')}
                canCancel={boolean('canCancel', true)}
                cancelText={text('cancelText', 'Cancel')}
                canFinish={boolean('canFinish', true)}
                canNextStep={boolean('canNextStep', true)}
                canPreviousStep={boolean('canPreviousStep', true)}
                finish={boolean('finish', false)}
                finishStyle={text('finishStyle', 'success')}
                finishText={text('finishText', 'Finish')}
                includeNext={boolean('includeNext', true)}
                isFinished={boolean('isFinished', true)}
                isFinishedText={text('isFinishedText', 'Finished')}
                isFinishing={boolean('isFinishing', false)}
                isFinishingText={text('isFinishingText', 'Finishing...')}
                nextStep={() => console.log('WizardNavButtons next button clicked')}
                nextStyle={text('nextStyle', 'success')}
                previousStep={() => console.log('WizardNavButtons previous button clicked')}
                singularNoun={text('singularNoun', '')}
            />
        );
    });
