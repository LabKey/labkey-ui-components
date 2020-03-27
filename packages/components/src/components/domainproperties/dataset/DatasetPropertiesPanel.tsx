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
import { AllowableActions, BasicPropertiesFields } from "./DatasetPropertiesPanelFormElements";
import { AdvancedSettings } from "./DatasetPropertiesAdvancedSettings";
import { CollapsiblePanelHeader } from "../CollapsiblePanelHeader";
import { DomainPropertiesPanelContext, DomainPropertiesPanelProvider } from "../DomainPropertiesPanelContext";
import { getDomainAlertClasses, getDomainPanelClass, updateDomainPanelClassList } from "../actions";
import { DEFINE_LIST_TOPIC } from "../../../util/helpLinks";
import { HelpTopicURL } from "../HelpTopicURL";
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
}

interface State {
    isValid: boolean;
}

export class DatasetPropertiesPanel extends React.PureComponent<Props> {
    render() {
        const { collapsible, controlledCollapse, initCollapsed, onToggle } = this.props;

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
        };
    }

    componentWillReceiveProps(nextProps: Readonly<Props>, nextContext: any): void {
        const { validate } = this.props;
        if (nextProps.validate && validate !== nextProps.validate) {
            this.setIsValid();
        }
    }

    componentDidMount(): void {
        updateDomainPanelClassList(this.props.useTheme, undefined, PROPERTIES_HEADER_ID);
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        updateDomainPanelClassList(prevProps.useTheme, undefined, PROPERTIES_HEADER_ID);
    }

    setIsValid(newModel?: DatasetModel): void {
        // const { model, onChange } = this.props;
        // const updatedModel = newModel || model;
        // const isValid = updatedModel && updatedModel.hasValidProperties();
        // this.setState(() => ({isValid}), () => onChange(updatedModel));
    }

    toggleLocalPanel = (evt: any): void => {
        const { togglePanel, collapsed } = this.context;
        this.setIsValid();
        togglePanel(evt, !collapsed);
    };

    onChange = (identifier, value): void => {
        // const { model, onChange } = this.props;
        //
        // // Name must be set on Domain as well
        // let newDomain = model.domain;
        // if (identifier == 'name') {
        //     newDomain = model.domain.merge({ name: value }) as DomainDesign;
        // }
        //
        // const newModel = model.merge({
        //     [identifier]: value,
        //     domain: newDomain,
        // }) as DatasetModel;
        //
        // this.setIsValid(newModel);
    };

    onCheckBoxChange = (name, checked): void => {
        this.onChange(name, !checked);
    };

    onInputChange = e => {
        const id = e.target.id;
        let value = e.target.value;

        // special case for empty string, set as null instead
        if (Utils.isString(value) && value.length === 0) {
            value = null;
        }

        this.onChange(id, value);
    };

    applyAdvancedProperties = (advancedSettingsForm: DatasetModel) : void => {
        const { model, onChange } = this.props;
        const newModel = model.merge(advancedSettingsForm) as DatasetModel;
        this.setIsValid(newModel);
    };

    render() {
        const { panelStatus, collapsible, controlledCollapse, model, useTheme, successBsStyle } = this.props;
        const { isValid } = this.state;
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
                            <Col xs={10}/>
                            <Col xs={2}>
                                <AdvancedSettings
                                    title={"Advanced Settings"}
                                    model={model}
                                />
                            </Col>
                        </Row>
                        <Form>
                            <BasicPropertiesFields
                                model={model}
                                onInputChange={this.onInputChange}
                            />

                            <AllowableActions
                                model={model}
                                onCheckBoxChange={this.onCheckBoxChange}
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
