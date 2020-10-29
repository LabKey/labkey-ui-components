/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { boolean, text, withKnobs } from '@storybook/addon-knobs';

import { DomainDesign } from '../internal/components/domainproperties/models';
import { DomainFormImpl } from '../internal/components/domainproperties/DomainForm';
import { MockLookupProvider } from '../test/components/Lookup';
import { PHILEVEL_RESTRICTED_PHI } from '../internal/components/domainproperties/constants';
import domainData from '../test/data/property-getDomain.json';
import errorData from '../test/data/property-saveDomainWithDuplicateField.json';
import warningData from '../test/data/property-unexpectedCharInFieldName.json';
import exceptionDataServer from '../test/data/property-domainExceptionFromServer.json';
import exceptionDataClient from '../test/data/property-domainExceptionClient.json';
import fullyLockedData from '../test/data/property-getDomainWithFullyLockedFields.json';
import partiallyLockedData from '../test/data/property-getDomainWithPartiallyLockedFields.json';
import './stories.scss';

interface Props {
    showInferFromFile?: boolean;
    data: {};
    exception?: {};
    helpNoun?: any;
    helpTopic?: any;
    appPropertiesOnly?: boolean;
    allowImportExport?: boolean;
}

class DomainFormContainer extends React.PureComponent<Props, any> {
    constructor(props: Props) {
        super(props);

        this.state = {
            domain: DomainDesign.create(props.data, props.exception),
        };
    }

    onChange = (newDomain: DomainDesign) => {
        this.setState(() => ({
            domain: newDomain,
        }));
    };

    render() {
        const { domain } = this.state;
        const appPropertiesOnly = boolean('appPropertiesOnly', this.props.appPropertiesOnly);

        return (
            <MockLookupProvider>
                <DomainFormImpl
                    {...this.props}
                    domain={domain}
                    onChange={this.onChange}
                    maxPhiLevel={PHILEVEL_RESTRICTED_PHI}
                    appPropertiesOnly={appPropertiesOnly}
                />
            </MockLookupProvider>
        );
    }
}

storiesOf('DomainForm', module)
    .addDecorator(withKnobs)
    .add('with empty domain', () => {
        return (
            <DomainFormContainer
                data={undefined}
                helpNoun={text('helpNoun', undefined)}
                helpTopic={text('helpTopic', undefined)}
            />
        );
    })
    .add('infer from file', () => {
        return <DomainFormContainer
            data={undefined}
            showInferFromFile={boolean('showInferFromFile', true)}
            allowImportExport={boolean('allowImportExport', false)}
        />;
    })
    .add('import from file', () => {
        return <DomainFormContainer
            data={undefined}
            showInferFromFile={boolean('showInferFromFile', false)}
            allowImportExport={boolean('allowImportExport', true)}
        />;
    })
    .add('with domain properties', () => {
        return <DomainFormContainer
            data={domainData}
            appPropertiesOnly={false}
        />;
    })
    .add('with server side errors and no file or flag types', () => {
        return <DomainFormContainer data={errorData} exception={exceptionDataServer} />;
    })
    .add('with client side warnings and no attachment types', () => {
        return <DomainFormContainer data={warningData} exception={exceptionDataClient} />;
    })
    .add('with fully locked fields', () => {
        return <DomainFormContainer data={fullyLockedData} />;
    })
    .add('with partially locked fields', () => {
        return <DomainFormContainer data={partiallyLockedData} />;
    });
