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
import { Form, Row, Col } from 'react-bootstrap';
import { Utils } from '@labkey/api';
import { DomainPanelStatus } from "../models";
import { DataRowUniquenessContainer, BasicPropertiesFields } from "./DatasetPropertiesPanelFormElements";
import { AdvancedSettings } from "./DatasetPropertiesAdvancedSettings";
import { DatasetModel} from "./models";
import { InjectedDomainPropertiesPanelCollapseProps, withDomainPropertiesPanelCollapse } from "../DomainPropertiesPanelCollapse";
import { BasePropertiesPanel, BasePropertiesPanelProps } from "../BasePropertiesPanel";

interface OwnProps {
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

type Props = OwnProps & BasePropertiesPanelProps;

interface State {
    isValid?: boolean;
    name?: string;
    description?: string;
    categoryId?: number;
    label?: string;
    dataRowSetting?: number;
}

class DatasetPropertiesPanelImpl extends React.PureComponent<Props & InjectedDomainPropertiesPanelCollapseProps, State> {

    constructor(props: Props & InjectedDomainPropertiesPanelCollapseProps) {
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

        // participant id
        if (model.keyProperty === undefined || model.keyProperty === null) {
            dataRowSetting = 0;
        }

        // participant id and timepoint
        if (model.keyProperty !== null && (model.keyManagementType === undefined || model.keyManagementType === null)) {
            dataRowSetting = 1;
        }

        // participant id, timepoint and additional key field
        if (model.keyProperty !== null && model.keyManagementType !== null) {
            dataRowSetting = 2;
        }

        return dataRowSetting;
    }

    onCheckBoxChange = (name, checked): void => {
        // TODO: manage state change of server manage field checkbox in next story
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

        this.setState(() => ({ [name]: value }));
    };

    render() {
        const {
            model,
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

        return (
            <BasePropertiesPanel
                {...this.props}
                headerId={'dataset-header-id'}
                title={'Dataset Properties'}
                titlePrefix={model.name}
                isValid={isValid}
                updateValidStatus={() => {}} // TODO: in next story
            >
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
            </BasePropertiesPanel>
        )
    }
}

export const DatasetPropertiesPanel = withDomainPropertiesPanelCollapse<Props>(DatasetPropertiesPanelImpl);
