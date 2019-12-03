/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { boolean, text, withKnobs } from '@storybook/addon-knobs';
import { Utils } from '@labkey/api';

import { AssayProtocolModel, DomainException } from '../components/domainproperties/models';
import { AssayDesignerPanels } from '../components/domainproperties/assay/AssayDesignerPanels';
import { SEVERITY_LEVEL_ERROR } from '../components/domainproperties/constants';
import { setAssayDomainException } from '../components/domainproperties/actions';
import { initMocks } from './mock';
import generalAssayTemplate from '../test/data/assay-getProtocolGeneralTemplate.json';
import generalAssaySaved from '../test/data/assay-getProtocolGeneral.json';
import generalAssayDupes from '../test/data/assay-getProtocolGeneralDuplicateFields.json';
import domainAssayException from '../test/data/assay-domainExceptionFromServer.json';
import elispotAssayTemplate from '../test/data/assay-getProtocolELISpotTemplate.json';
import elispotAssaySaved from '../test/data/assay-getProtocolELISpot.json';
import './stories.scss';

initMocks();

interface Props {
    data: {},
    exception?: {}
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

        return (
            <AssayDesignerPanels
                initModel={this.state.model}
                basePropertiesOnly={boolean('basePropertiesOnly', false)}
                hideEmptyBatchDomain={boolean('hideEmptyBatchDomain', false)}
                useTheme={false}
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
            <WrappedAssayDesignerPanels data={generalAssayTemplate.data}/>
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
    });
