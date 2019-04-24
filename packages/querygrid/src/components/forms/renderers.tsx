/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { Input } from 'formsy-react-components'
import { generateId, QueryColumn } from '@glass/base'

import { LabelOverlay } from './LabelOverlay'

// import {SelectInput} from './SelectInput'

interface AliasInputProps {
    col: QueryColumn
    editing?: boolean
    value?: string
}

class AliasInput extends React.Component<AliasInputProps, any> {

    _id: string;

    constructor(props: AliasInputProps) {
        super(props);

        this._id = generateId();
    }

    render() {
        const { col, editing, value } = this.props;
        console.log("AliasInput not yet implemented");
        return undefined;
        // return <SelectInput
        //     addLabelText="Press enter to add '{label}'"
        //     allowCreate={true}
        //     id={this._id}
        //     inputClass={editing ? 'col-sm-12' : undefined}
        //     joinValues={true}
        //     label={<LabelOverlay column={col} inputId={this._id} isFormsy={false} />}
        //     multiple={true}
        //     name={col.name}
        //     noResultsText="Enter alias name(s)"
        //     placeholder="Enter alias name(s)"
        //     promptTextCreator={(text: string) => `Create alias "${text}"`}
        //     saveOnBlur={true}
        //     value={value}
        // />;
    }
}

export function resolveRenderer(column: QueryColumn) {

    let inputRenderer;

    if (column && column.inputRenderer) {
        switch (column.inputRenderer.toLowerCase()) {
            case 'experimentalias':
                inputRenderer = (col: QueryColumn, key: any, value?: string, editing?: boolean) => {
                    return <AliasInput col={col} editing={editing} key={key} value={value}/>;
                };
                break;
            case 'appendunitsinput':
                inputRenderer = (col: QueryColumn, key: any, val?: string, editing?: boolean) => {
                    return <Input
                                addonAfter={<span>{col.units}</span>}
                                changeDebounceInterval={0}
                                elementWrapperClassName={editing ? [{"col-sm-9": false}, "col-sm-12"] : undefined}
                                id={col.name}
                                key={key}
                                label={<LabelOverlay column={col} inputId={col.name}/>}
                                labelClassName="control-label text-left"
                                name={col.name}
                                required={col.required}
                                type="text"
                                value={val}
                                validations='isNumericWithError'/>;
                };
                break;
            default:
                break;
        }
    }

    return inputRenderer;
}