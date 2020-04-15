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
import {getDomainPanelStatus, saveDomain} from "../actions";
import DomainForm from "../DomainForm";
import {DatasetColumnMappingPanel} from "./DatasetColumnMappingPanel";
import {importData, ListModel, resolveErrorMessage} from "../../..";
import {ActionURL, getServerContext} from "@labkey/api";

interface Props {
    initModel?: DatasetModel;
    onChange?: (model: DatasetModel) => void
    onCancel: () => void
    onComplete: (model: DatasetModel, fileImportError?: string) => void
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
        const { setSubmitting } = this.props;
        const { model } = this.state;
        const isValid = true;

        this.props.onFinish(isValid, this.saveDomain);


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

    onColumnMappingChange = (participantIdField?: string, timePointField?: string) => {
      console.log("ParticipantID = ", participantIdField);
      console.log("Timepoint = ", timePointField);
    };

    datasetColumnMapping = () => {
        const {model} = this.state;

        return (
            <>
                {model && model.domain.fields && model.domain.fields.size > 0 &&
                <DatasetColumnMappingPanel
                    model={model}
                    onColumnMappingChange={this.onColumnMappingChange}
                    subjectColumnName={LABKEY.moduleContext.study.subject.columnName}
                    timepointType={LABKEY.moduleContext.study.timepointType}
                />
                }
            </>

        );

    };

    handleFileImport() {
        const { setSubmitting } = this.props;
        const { fileImportData, model } = this.state;

        importData({
            schemaName: 'study',
            queryName: model.name,
            file: fileImportData,
            importUrl: ActionURL.buildURL(
                'study',
                'UploadDatasetItems',
                getServerContext().container.path,
                {'name': model.name}
            )
        })
            .then((response) => {
                setSubmitting(false, () => {
                    this.props.onComplete(model);
                });
            })
            .catch((error) => {
                console.error(error);
                setSubmitting(false, () => {
                    this.props.onComplete(model, resolveErrorMessage(error));
                });
            });
    }

    saveDomain = () => {
        const { setSubmitting } = this.props;
        const { model, fileImportData } = this.state;

        saveDomain(model.domain, null, model.getOptions(), model.name)
            .then((response) => {
                console.log("Save then response", response.toJS());
                let updatedModel = model.set('exception', undefined) as DatasetModel;
                updatedModel = updatedModel.merge({domain: response}) as DatasetModel;
                this.setState(() => ({model: updatedModel}));

                // If we're importing List file data, import file contents
                if (fileImportData) {
                    this.handleFileImport();
                }
                else {
                    setSubmitting(false, () => {
                        this.props.onComplete(updatedModel);
                    });
                }
            })
            .catch((response) => {
                console.log("Save catch response", response);
                const exception = resolveErrorMessage(response);
                const updatedModel = exception
                    ? model.set('exception', exception) as DatasetModel
                    : model.merge({domain: response, exception: undefined}) as DatasetModel;

                setSubmitting(false, () => {
                    this.setState(() => ({model: updatedModel}));
                });
            });
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
