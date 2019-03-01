/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'reactn'
import { Panel } from 'react-bootstrap'
import { QueryGridModel } from "@glass/models";
import { LoadingSpinner } from "@glass/utils";

import { gridInit } from "../../actions";
import { EditableGrid } from "./EditableGrid";

type Props = {
    title?: string
    model: QueryGridModel
};

export class EditableGridPanel extends React.Component<Props, any> {

    componentDidMount() {
        this.initModel(this.props);
    }

    componentWillReceiveProps(nextProps: Props) {
        this.initModel(nextProps);
    }

    initModel(props: Props) {
        const { model } = props;

        // make sure each QueryGridModel is initialized
        if (model && !model.isLoaded && !model.isLoading) {
            gridInit(model, false);
        }
    }

    getModel(): QueryGridModel {
        const { model } = this.props;

        // need to access this.global directly to connect this component to the re-render cycle
        return this.global.QueryGrid_models.get(model.getId());
    }

    render() {
        const { title } = this.props;
        const model = this.getModel();

        if (!model) {
            return <LoadingSpinner/>
        }

        if (!title) {
            return <EditableGrid model={model}/>
        }

        return (
            <Panel>
                <Panel.Heading>{title}</Panel.Heading>
                <Panel.Body className={"table-responsive"}>
                    <EditableGrid model={model}/>
                </Panel.Body>
            </Panel>
        );
    }
}
