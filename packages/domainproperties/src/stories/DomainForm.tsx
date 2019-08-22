/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { text, boolean, withKnobs } from '@storybook/addon-knobs'
import mock, { proxy } from 'xhr-mock';

import { DomainDesign } from "../models";
import { DomainFormImpl } from "../components/DomainForm";
import { MockLookupProvider } from "../test/components/Lookup";
import { PHILEVEL_RESTRICTED_PHI } from "../constants";

import domainData from "../test/data/property-getDomain.json";
import errorData from "../test/data/property-saveDomainWithDuplicateField.json";
import warningData from "../test/data/property-unexpectedCharInFieldName.json";
import exceptionDataServer from "../test/data/property-domainExceptionFromServer.json";
import exceptionDataClient from "../test/data/property-domainExceptionClient.json";
import fullyLockedData from "../test/data/property-getDomainWithFullyLockedFields.json";
import partiallyLockedData from "../test/data/property-getDomainWithPartiallyLockedFields.json";
import inferDomainJson from '../test/data/property-inferDomain.json';
import './stories.scss'

mock.setup();
mock.post(/.*\/property\/inferDomain.*/, {
    status: 200,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(inferDomainJson)
});
mock.use(proxy);

interface Props {
    showInferFromFile?: boolean
    initCollapsed?: boolean
    markComplete?: boolean
    data: {}
    exception?: {}
    helpNoun?: any
    helpURL?: any
}

class DomainFormContainer extends React.PureComponent<Props, any> {
    constructor(props: Props) {
        super(props);

        this.state = {
            domain: DomainDesign.create(props.data, props.exception)
        };
    }

    onChange = (newDomain: DomainDesign) => {
        this.setState(() => ({
            domain: newDomain
        }));
    };

    render() {
        const { domain } = this.state;

        return (
            <MockLookupProvider>
                <DomainFormImpl
                    {...this.props}
                    domain={domain}
                    onChange={this.onChange}
                    maxPhiLevel={PHILEVEL_RESTRICTED_PHI}
                />
            </MockLookupProvider>
        )
    }
}

storiesOf("DomainForm", module)
    .addDecorator(withKnobs)
    .add("with empty domain", () => {
        return (
            <DomainFormContainer
                data={undefined}
                helpNoun={text('helpNoun', undefined)}
                helpURL={text('helpURL', undefined)}
            />
        )
    })
    .add("infer from file", () => {
        return (
            <DomainFormContainer
                data={undefined}
                showInferFromFile={boolean('showInferFromFile', true)}
            />
        )
    })
    .add("with domain properties", () => {
        return (
            <DomainFormContainer
                data={domainData}
            />
        )
    })
    .add("initCollapsed and mark complete", () => {
        return (
            <DomainFormContainer
                data={domainData}
                initCollapsed={boolean('initCollapsed', true)}
                markComplete={boolean('markComplete', false)}
            />
        )
    })
    .add("with server side errors", () => {
        return (
            <DomainFormContainer
                data={errorData}
                exception={exceptionDataServer}
            />
        )
    })
    .add("with client side warnings", () => {
        return (
            <DomainFormContainer
                data={warningData}
                exception={exceptionDataClient}
            />
        )
    })
    .add("with fully locked fields", () => {
        return (
            <DomainFormContainer
                data={fullyLockedData}
            />
        )
    })
    .add("with partially locked fields", () => {
        return (
            <DomainFormContainer
                data={partiallyLockedData}
            />
        )
    });