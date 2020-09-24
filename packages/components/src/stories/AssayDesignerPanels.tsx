/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { fromJS, Map } from 'immutable';
import { Utils } from '@labkey/api';
import { storiesOf } from '@storybook/react';
import { boolean, text, withKnobs } from '@storybook/addon-knobs';

import { DomainException } from '../internal/components/domainproperties/models';
import { AssayProtocolModel } from '../internal/components/domainproperties/assay/models';
import { setAssayDomainException } from '../internal/components/domainproperties/assay/actions';
import { AssayDesignerPanels } from '../internal/components/domainproperties/assay/AssayDesignerPanels';
import { SEVERITY_LEVEL_ERROR } from '../internal/components/domainproperties/constants';
import { Alert } from '../internal/components/base/Alert';
import generalAssayTemplate from '../test/data/assay-getProtocolGeneralTemplate.json';
import generalAssaySaved from '../test/data/assay-getProtocolGeneral.json';
import generalAssayDupes from '../test/data/assay-getProtocolGeneralDuplicateFields.json';
import domainAssayException from '../test/data/assay-domainExceptionFromServer.json';
import elispotAssayTemplate from '../test/data/assay-getProtocolELISpotTemplate.json';
import elispotAssaySaved from '../test/data/assay-getProtocolELISpot.json';
import './stories.scss';

interface Props {
    data: {};
    exception?: {};
    appPropertiesOnly?: boolean;
    appDomainHeaders?: Map<string, any>;
}

interface State {
    model: AssayProtocolModel;
}

class WrappedAssayDesignerPanels extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        let model = AssayProtocolModel.create(props.data);
        if (props.exception) {
            const exception = DomainException.create(props.exception, SEVERITY_LEVEL_ERROR);
            model = setAssayDomainException(model, exception);
        }

        this.state = {
            model,
        };
    }

    onAssayPropertiesChange = (model: AssayProtocolModel) => {
        this.setState(() => ({ model }));
    };

    render() {
        const isValidMsg = text('AppDesignValidMsg', undefined);
        const appPropertiesOnly = boolean('appPropertiesOnly', this.props.appPropertiesOnly);

        return (
            <AssayDesignerPanels
                initModel={this.state.model}
                appPropertiesOnly={appPropertiesOnly}
                hideEmptyBatchDomain={boolean('hideEmptyBatchDomain', false)}
                appDomainHeaders={this.props.appDomainHeaders}
                useTheme={false}
                successBsStyle={text('successBsStyle', 'success')}
                onChange={(model: AssayProtocolModel) => {}}
                onComplete={(model: AssayProtocolModel) => {
                    console.log('complete clicked', model.toJS());
                }}
                onCancel={() => {
                    console.log('cancel clicked');
                }}
                appIsValidMsg={() => {
                    return Utils.isString(isValidMsg) && isValidMsg.trim().length > 0 ? isValidMsg : undefined;
                }}
            />
        );
    }
}

storiesOf('AssayDesignerPanels', module)
    .addDecorator(withKnobs)
    .add('GPAT Template', () => {
        return <WrappedAssayDesignerPanels data={generalAssayTemplate.data} />;
    })
    .add('GPAT Saved Assay', () => {
        return <WrappedAssayDesignerPanels data={generalAssaySaved.data} />;
    })
    .add('GPAT Assay with Errors', () => {
        return <WrappedAssayDesignerPanels data={generalAssayDupes.data} exception={domainAssayException} />;
    })
    .add('ELISpot Template', () => {
        return <WrappedAssayDesignerPanels data={elispotAssayTemplate.data} />;
    })
    .add('ELISpot Saved Assay', () => {
        return <WrappedAssayDesignerPanels data={elispotAssaySaved.data} />;
    })
    .add('AppPropertiesOnly and AppDomainHeaders', () => {
        return (
            <WrappedAssayDesignerPanels
                data={generalAssayDupes.data}
                appPropertiesOnly={true}
                appDomainHeaders={fromJS({
                    Batch: () => {
                        return (
                            <Alert bsStyle="info" id="mock-app-header-batch">
                                This is a mock batch app header.
                            </Alert>
                        );
                    },
                    Run: () => {
                        return (
                            <Alert bsStyle="info" id="mock-app-header-run">
                                This is a mock run app header.
                            </Alert>
                        );
                    },
                    Data: () => {
                        return (
                            <Alert bsStyle="info" id="mock-app-header-results">
                                This is a mock results app header.
                            </Alert>
                        );
                    },
                })}
            />
        );
    });
