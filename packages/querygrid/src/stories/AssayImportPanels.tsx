/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as React from 'react';
import { Map } from "immutable";
import { storiesOf } from "@storybook/react";
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import { AssayUploadTabs } from "@glass/base";


import { gridInit } from "../actions";
import { getStateQueryGridModel } from "../models";
import { getQueryGridModel } from "../global";
import { withFormSteps, WithFormStepsProps } from "../components/forms/FormStep";
import { RunDataPanel } from "../components/assay/RunDataPanel";
import { RunPropertiesPanel } from "../components/assay/RunPropertiesPanel";
import { BatchPropertiesPanel } from "../components/assay/BatchPropertiesPanel";
import { AssayImportPanels } from "../components/assay/AssayImportPanels";
import { ASSAY_WIZARD_MODEL } from "../test/data/constants";
import './stories.scss'

class RunDataPanelWrapperImpl extends React.Component<WithFormStepsProps, any> {

    componentDidMount(): void {
        gridInit(this.getQueryGridModel(), false, this);
    }

    getQueryGridModel() {
        const model = getStateQueryGridModel('assayImportRunDataPanel', ASSAY_WIZARD_MODEL.queryInfo.schemaQuery, {
            editable: true,
            allowSelection: false,
            bindURL: false
        });

        return getQueryGridModel(model.getId()) || model;
    }

    onFileChange = (attachments: Map<string, File>) => {
        console.log(attachments);
    };

    onFileRemoval = (attachmentName: string) => {
        console.log(attachmentName);
    };

    onChange = (inputName: string, fieldValues: any) => {
        console.log(inputName, fieldValues);
    };

    render() {
        return (
            <RunDataPanel
                currentStep={this.props.currentStep}
                wizardModel={ASSAY_WIZARD_MODEL}
                gridModel={this.getQueryGridModel()}
                onFileChange={this.onFileChange}
                onFileRemoval={this.onFileRemoval}
                onTextChange={this.onChange}
                allowBulkRemove={true}
            />
        )
    }
}

const RunDataPanelWrapper = withFormSteps<WithFormStepsProps>(RunDataPanelWrapperImpl, {
    currentStep: AssayUploadTabs.Files,
    furthestStep: AssayUploadTabs.Grid,
    hasDependentSteps: false
});

storiesOf('AssayImportPanels', module)
    .addDecorator(withKnobs)
    .add("BatchPropertiesPanel", () => {

        function onChange(fieldValues: any) {
            console.log(fieldValues);
        }

        return (
            <BatchPropertiesPanel model={ASSAY_WIZARD_MODEL} onChange={onChange}/>
        )
    })
    .add("RunPropertiesPanel", () => {

        function onChange(fieldValues: any) {
            console.log(fieldValues);
        }

        return (
            <RunPropertiesPanel model={ASSAY_WIZARD_MODEL} onChange={onChange}/>
        )
    })
    .add("RunDataPanel", () => {
        return (
            <RunDataPanelWrapper/>
        )
    })
    .add("AssayImportPanels", () => {
        return (
            <AssayImportPanels
                assayDefinition={ASSAY_WIZARD_MODEL.assayDef}
                onCancel={() => console.log('onCancel clicked')}
                onComplete={(response) => console.log('onComplete', response)}
                allowBulkRemove={true}
            />
        )
    });