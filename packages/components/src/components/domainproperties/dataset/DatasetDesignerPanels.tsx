/*
 * Copyright (c) 2020 LabKey Corporation
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

import React from 'react';
import {DatasetModel} from "./models";
import {DatasetPropertiesPanel} from "./DatasetPropertiesPanel";
import {BaseDomainDesigner, InjectedBaseDomainDesignerProps, withBaseDomainDesigner} from "../BaseDomainDesigner";
import {DomainDesign, IAppDomainHeader} from "../models";
import {List} from "immutable";
import {getDomainPanelStatus} from "../actions";
import DomainForm from "../DomainForm";
import {DatasetColumnMappingPanel} from "./DatasetColumnMappingPanel";

interface Props {
    initModel?: DatasetModel;
    onChange?: (model: DatasetModel) => void
    onCancel: () => void
    useTheme?: boolean;
    showDataSpace: boolean;
    showVisitDate: boolean;
    saveBtnText?: string;
    containerTop?: number // This sets the top of the sticky header, default is 0
}

interface State {
    model: DatasetModel;
    fileImportData: File;
}

export class DatasetDesignerPanelImpl extends React.PureComponent<Props & InjectedBaseDomainDesignerProps, State> {
    constructor(props: Props & InjectedBaseDomainDesignerProps) {
        super(props);

        this.state = {
            model: props.initModel || DatasetModel.create(null,{}),
            fileImportData: undefined
        };
    }

    onPropertiesChange = (model: DatasetModel) => {
      const { onChange } = this.props;

        this.setState(() => ({model}), () => {
            if (onChange) {
                onChange(model);
            }
        });
    };

    onFinish = () => {

    };

    onDomainChange = (domain: DomainDesign, dirty: boolean) => {
        const { onChange } = this.props;

        this.setState((state) => ({
           model: state.model.merge({domain}) as DatasetModel
        }), () => {
            // Issue 39918: use the dirty property that DomainForm onChange passes
            if (onChange && dirty) {
                onChange(this.state.model);
            }
        });
    };

    setFileImportData = fileImportData => {
        this.setState({ fileImportData });
    };

    datasetColumnMapping = () => {
        const {model} = this.state;

        return (
            <DatasetColumnMappingPanel
                model={model}
                onModelChange={() => {}}
            />
        );

    };

    render() {
        const {
            useTheme,
            onTogglePanel,
            showDataSpace,
            showVisitDate,
            visitedPanels,
            submitting,
            onCancel,
            currentPanelIndex,
            firstState,
            validatePanel,
            containerTop
        } = this.props;

        const { model } = this.state;

        return (
            <BaseDomainDesigner
                name={model.name}
                exception={model.exception}
                domains={List.of(model.domain)}
                hasValidProperties={model.hasValidProperties()}
                visitedPanels={visitedPanels}
                submitting={submitting}
                onCancel={onCancel}
                onFinish={this.onFinish}
                saveBtnText={"Save"}
                // successBsStyle={successBsStyle}
            >
                <DatasetPropertiesPanel
                    initCollapsed={false}
                    model={model}
                    controlledCollapse={true}
                    useTheme={useTheme}
                    panelStatus={'COMPLETE'}
                    validate={false}
                    onToggle={(collapsed, callback) => {onTogglePanel(0, collapsed, callback);}}
                    onChange={this.onPropertiesChange}
                    showDataspace={showDataSpace}
                    showVisitDate={showVisitDate}
                />
                <DomainForm
                    key={model.domain.domainId || 0}
                    domainIndex={0}
                    domain={model.domain}
                    headerTitle={'Fields'}
                    helpNoun={'list'}
                    helpTopic={null} // null so that we don't show the "learn more about this tool" link for this domains
                    onChange={this.onDomainChange}
                    setFileImportData={this.setFileImportData}
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== 1}
                    validate={validatePanel === 1}
                    panelStatus={model.isNew() ? getDomainPanelStatus(1, currentPanelIndex, visitedPanels, firstState) : 'COMPLETE'}
                    showInferFromFile={true}
                    containerTop={containerTop}
                    onToggle={(collapsed, callback) => {onTogglePanel(1, collapsed, callback);}}
                    useTheme={useTheme}
                    renderDatasetColumnMapping={this.datasetColumnMapping}
                    // successBsStyle={successBsStyle}
                />
            </BaseDomainDesigner>
        );
    };
}

export const DatasetDesignerPanels = withBaseDomainDesigner<Props>(DatasetDesignerPanelImpl);
