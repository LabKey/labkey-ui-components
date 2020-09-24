/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Button } from 'react-bootstrap';
import { storiesOf } from '@storybook/react';
import { boolean, withKnobs } from '@storybook/addon-knobs';

import './stories.scss';
import { PageHeader } from '../internal/components/base/PageHeader';
import { Page } from '../internal/components/base/Page';

storiesOf('Page', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        const hasChildren = boolean('Has child elements?', true);
        const children = hasChildren ? [<Button href="#">Button 1</Button>, <div>A div element</div>] : undefined;
        return (
            <Page notFound={boolean('Page not found?', false)} hasHeader={boolean('Page has its own header?', false)}>
                {children}
            </Page>
        );
    })
    .add('with PageHeader child', () => {
        return (
            <Page>
                <PageHeader>
                    <span>
                        <Button>Action 1</Button>
                        <Button>Action 2</Button>
                    </span>
                </PageHeader>
                <span>Page content</span>
                <table className="table table-bordered">
                    <thead>
                        <tr>
                            <th className="grid-header-cell">Key</th>
                            <th className="grid-header-cell">Language</th>
                        </tr>
                    </thead>
                    <tr>
                        <td>Schl&uuml;ssel</td>
                        <td>German</td>
                    </tr>
                    <tr>
                        <td>cl&eacute;</td>
                        <td>French</td>
                    </tr>
                    <tr>
                        <td>n&oslash;kkel</td>
                        <td>Norweigan</td>
                    </tr>
                </table>
            </Page>
        );
    });
