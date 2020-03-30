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
import { Panel, Form, Row, Col } from 'react-bootstrap';
import { Utils } from '@labkey/api';
import { Alert } from '../../..';
import { DomainDesign, DomainPanelStatus } from "../models";
import { DataRowUniquenessContainer, BasicPropertiesFields } from "./DatasetPropertiesPanelFormElements";
import { AdvancedSettings } from "./DatasetPropertiesAdvancedSettings";
import { CollapsiblePanelHeader } from "../CollapsiblePanelHeader";
import { DomainPropertiesPanelContext, DomainPropertiesPanelProvider } from "../DomainPropertiesPanelContext";
import { getDomainAlertClasses, getDomainPanelClass, updateDomainPanelClassList } from "../actions";
import { DatasetModel} from "./models";

const PROPERTIES_HEADER_ID = 'dataset-properties-hdr';
const ERROR_MSG = 'Contains errors or is missing required values.';

interface Props {
    model: DatasetModel;
    panelStatus?: DomainPanelStatus;
    onChange?: (model: DatasetModel) => void;
    controlledCollapse?: boolean;
    initCollapsed?: boolean;
    collapsible?: boolean;
    onToggle?: (collapsed: boolean, callback: () => any) => any;
    validate?: boolean;
    useTheme?: boolean;
    successBsStyle?: string;
    newDataset: boolean;
    showDataspace: boolean;
}

interface State {
    isValid?: boolean;
    name?: string;
    description?: string;
    categoryId?: number;
    label?: string;
    dataRowSetting?: number;
}

export class DatasetPropertiesPanel extends React.PureComponent<Props> {
    render() {
        const { collapsible, controlledCollapse, initCollapsed, onToggle, newDataset } = this.props;

        return (
            <DomainPropertiesPanelProvider
                controlledCollapse={controlledCollapse}
                collapsible={collapsible}
                initCollapsed={initCollapsed}
                onToggle={onToggle}>
                <DatasetPropertiesPanelImpl {...this.props} />
            </DomainPropertiesPanelProvider>
        );
    }
}

class DatasetPropertiesPanelImpl extends React.PureComponent<Props, State> {
    static contextType = DomainPropertiesPanelContext;
    context!: React.ContextType<typeof DomainPropertiesPanelContext>;

    static defaultProps = {
        initCollapsed: false,
        validate: false,
    };

    constructor(props) {
        super(props);

        this.state = {
            isValid: true,
            name: this.props.model.name,
            description: this.props.model.description,
            categoryId: this.props.model.categoryId,
            label: this.props.model.label,
            dataRowSetting: this.getDataRowSetting(this.props.model)
        };
    }

    getDataRowSetting(model: DatasetModel) : number {
        let dataRowSetting = -1;

        if (model.keyProperty === undefined || model.keyProperty === null) {
            dataRowSetting = 0;
        }

        if (model.keyProperty !== null && (model.keyManagementType === undefined || model.keyManagementType === null)) {
            dataRowSetting = 1;
        }

        if (model.keyProperty !== null && model.keyManagementType !== null) {
            dataRowSetting = 2;
        }

        return dataRowSetting;
    }

    componentDidMount(): void {
        updateDomainPanelClassList(this.props.useTheme, undefined, PROPERTIES_HEADER_ID);
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        updateDomainPanelClassList(prevProps.useTheme, undefined, PROPERTIES_HEADER_ID);
    }


    toggleLocalPanel = (evt: any): void => {
        const { togglePanel, collapsed } = this.context;
        togglePanel(evt, !collapsed);
    };


    onCheckBoxChange = (name, checked): void => {
        // this.onChange(name, !checked);
    };

    onInputChange = e => {
        const id = e.target.id;
        let value = e.target.value;

        // special case for empty string, set as null instead
        if (Utils.isString(value) && value.length === 0) {
            value = null;
        }

        this.setState(() => ({ [id]: value }));
    };

    onCategoryChange = (category) => {
        let categoryID = category ? category : undefined
        this.setState(() => ({categoryId: categoryID}))
    };

    onRadioChange = e => {
        const name = e.currentTarget.name;
        const value = e.target.value;
        console.log("name", name, value);
        this.setState({ [name]: value });
    };

    render() {
        const {
            panelStatus,
            collapsible,
            controlledCollapse,
            model,
            useTheme,
            newDataset,
            showDataspace,
        } = this.props;

        const {
            isValid,
            name,
            description,
            categoryId,
            label,
            dataRowSetting
        } = this.state;
        const { collapsed } = this.context;

        return(
            <>
                <Panel
                    className={getDomainPanelClass(collapsed, true, useTheme)}
                    expanded={!collapsed}
                    onToggle={function(){}}
                >
                    <CollapsiblePanelHeader
                        id={PROPERTIES_HEADER_ID}
                        title={'Dataset Properties'}
                        titlePrefix={model.name}
                        togglePanel={(evt: any) => this.toggleLocalPanel(evt)}
                        collapsed={collapsed}
                        collapsible={collapsible}
                        controlledCollapse={controlledCollapse}
                        panelStatus={panelStatus}
                        isValid={isValid}
                        iconHelpMsg={ERROR_MSG}
                        useTheme={useTheme}
                    />

                    <Panel.Body collapsible={collapsible || controlledCollapse}>
                        <Row className={'margin-bottom'}>
                            <Col md={11}/>
                            <Col md={1}>
                                <AdvancedSettings
                                    title={"Advanced Settings"}
                                    model={model}
                                    newDataset={newDataset}
                                    showDataspace={showDataspace}
                                />
                            </Col>
                        </Row>
                        <Form>
                            <BasicPropertiesFields
                                model={model}
                                name={name}
                                description={description}
                                categoryId={categoryId}
                                label={label}
                                onInputChange={this.onInputChange}
                                onCategoryChange={this.onCategoryChange}
                            />

                            <DataRowUniquenessContainer
                                model={model}
                                onRadioChange={this.onRadioChange}
                                dataRowSetting={dataRowSetting}
                                showAdditionalKeyField={dataRowSetting == 2}
                            />
                        </Form>
                    </Panel.Body>
                </Panel>

                {!isValid &&
                <div
                    onClick={(evt: any) => this.toggleLocalPanel(evt)}
                    className={getDomainAlertClasses(collapsed, true, useTheme)}
                >
                    <Alert bsStyle="danger">{ERROR_MSG}</Alert>
                </div>
                }
            </>
        )
    }
}
