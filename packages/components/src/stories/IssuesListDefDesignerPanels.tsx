import React from 'react';
import { storiesOf } from '@storybook/react';
import { text, withKnobs } from '@storybook/addon-knobs';

import { IssuesListDefDesignerPanels } from '../internal/components/domainproperties/issues/IssuesListDefDesignerPanels';
import { IssuesListDefModel } from '../internal/components/domainproperties/issues/models';

import getDomainDetailsJSON from '../test/data/issuesListDef-getDomainDetails.json';

import './stories.scss';

storiesOf('IssuesListDefDesignerPanels', module)
    .addDecorator(withKnobs)
    .add('for create', () => {
        return (
            <IssuesListDefDesignerPanels
                initModel={IssuesListDefModel.create(null, { issueDefName: 'Issues List For Storybook' })}
                onCancel={() => console.log('cancel')}
                onComplete={() => console.log('onComplete')}
                successBsStyle={text('successBsStyle', 'success')}
                saveBtnText={text('saveBtnText', undefined)}
            />
        );
    })
    .add('for update', () => {
        return (
            <IssuesListDefDesignerPanels
                initModel={IssuesListDefModel.create(getDomainDetailsJSON)}
                onCancel={() => console.log('cancel')}
                onComplete={() => console.log('onComplete')}
                successBsStyle={text('successBsStyle', 'success')}
                saveBtnText={text('saveBtnText', undefined)}
            />
        );
    });
