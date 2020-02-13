/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { boolean, text, withKnobs } from '@storybook/addon-knobs';
import { Utils } from '@labkey/api';
import { DomainException } from '../components/domainproperties/models';
import { AssayProtocolModel } from '../components/domainproperties/assay/models';
import { AssayDesignerPanels } from '../components/domainproperties/assay/AssayDesignerPanels';
import { SEVERITY_LEVEL_ERROR } from '../components/domainproperties/constants';
import { setAssayDomainException } from '../components/domainproperties/actions';
import generalAssayTemplate from '../test/data/assay-getProtocolGeneralTemplate.json';
import generalAssaySaved from '../test/data/assay-getProtocolGeneral.json';
import generalAssayDupes from '../test/data/assay-getProtocolGeneralDuplicateFields.json';
import domainAssayException from '../test/data/assay-domainExceptionFromServer.json';
import elispotAssayTemplate from '../test/data/assay-getProtocolELISpotTemplate.json';
import elispotAssaySaved from '../test/data/assay-getProtocolELISpot.json';
import './stories.scss';

interface Props {
    data: {},
    exception?: {}
    appPropertiesOnly?: boolean
}

interface State {
    model: AssayProtocolModel
}

class WrappedAssayDesignerPanels extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        let model = AssayProtocolModel.create(props.data);
        if (props.exception) {
            const exception = DomainException.create(props.exception, SEVERITY_LEVEL_ERROR);
            model = setAssayDomainException(model, exception)
        }

        this.state = {
            model: model
        }
    }

    onAssayPropertiesChange = (model: AssayProtocolModel) => {
        this.setState(() => ({model}));
    };

    render() {
        const isValidMsg = text('AppDesignValidMsg', undefined);
        const appPropertiesOnly = boolean("appPropertiesOnly", this.props.appPropertiesOnly);

        return (
            <AssayDesignerPanels
                initModel={this.state.model}
                appPropertiesOnly={appPropertiesOnly}
                hideEmptyBatchDomain={boolean('hideEmptyBatchDomain', false)}
                useTheme={false}
                successBsStyle={text('successBsStyle', 'success')}
                onChange={(model: AssayProtocolModel) => {
                    console.log('change', model.toJS());
                }}
                onComplete={(model: AssayProtocolModel) => {
                    console.log('complete clicked', model.toJS());
                }}
                onCancel={() => {
                    console.log('cancel clicked');
                }}
                appIsValidMsg={()=>{
                    return Utils.isString(isValidMsg) && isValidMsg.trim().length > 0 ? isValidMsg : undefined;
                }}
            />
        )
    }
}

storiesOf("AssayDesignerPanels", module)
    .addDecorator(withKnobs)
    .add("GPAT Template", () => {
        return (
            <WrappedAssayDesignerPanels data={generalAssayTemplate.data} />
        )
    })
    .add("GPAT Saved Assay", () => {
        return (
            <WrappedAssayDesignerPanels data={generalAssaySaved.data}/>
        )
    })
    .add("GPAT Assay with Errors", () => {
        return (
            <WrappedAssayDesignerPanels data={generalAssayDupes.data} exception={domainAssayException}/>
        )
    })
    .add("ELISpot Template", () => {
        return (
            <WrappedAssayDesignerPanels data={elispotAssayTemplate.data}/>
        )
    })
    .add("ELISpot Saved Assay", () => {
        return (
            <WrappedAssayDesignerPanels data={elispotAssaySaved.data}/>
        )
    })
    .add("AppPropertiesOnly", () => {
        return (
            <WrappedAssayDesignerPanels data={generalAssayDupes.data} appPropertiesOnly={true}/>
        )
    });
