/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import classNames from 'classnames'
import { Map } from 'immutable'
import moment from 'moment'

interface IRowConfig {
    createdBy: string
    createdTS: any
    display: boolean
    hasCreated: boolean
    hasModified: boolean
    modifiedBy: string
    modifiedTS: any
    useCreated: boolean
}

interface CreatedModifiedProps {
    className?: string
    row: Map<string, any>
}

export class CreatedModified extends React.Component<CreatedModifiedProps, any> {

    formatTitle(config: IRowConfig): string {
        let title = [];

        if (config.display) {
            if (config.hasCreated) {
                title.push('Created: ' + config.createdTS);

                if (config.createdBy) {
                    title.push('Created by: ' + config.createdBy);
                }
            }

            if (!config.useCreated && config.hasModified) {
                title.push('Modified: ' + config.modifiedTS);

                if (config.modifiedBy) {
                    title.push('Modified by: ' + config.modifiedBy);
                }
            }
        }

        if (title.length > 0) {
            return title.join('\n');
        }

        return '';
    }

    processRow(): IRowConfig {
        const { row } = this.props;

        if (row) {
            const createdBy = row.getIn(['CreatedBy', 'displayValue']) || row.getIn(['createdby', 'displayValue']);
            const createdTS = row.getIn(['Created', 'value']) || row.getIn(['created', 'value']);

            const modifiedBy = row.getIn(['ModifiedBy', 'displayValue']) || row.getIn(['modifiedby', 'displayValue']);
            const modifiedTS = row.getIn(['Modified', 'value']) || row.getIn(['modified', 'value']);

            const hasCreated = createdTS !== undefined;
            const hasModified = modifiedTS !== undefined;

            return {
                createdBy,
                createdTS: hasCreated ? createdTS : undefined,
                display: hasCreated || hasModified,
                hasCreated,
                hasModified,
                modifiedBy,
                modifiedTS: hasModified ? modifiedTS : undefined,
                useCreated: !hasModified || (createdTS === modifiedTS)
            }
        }

        return {
            createdBy: undefined,
            createdTS: undefined,
            display: false,
            hasCreated: false,
            hasModified: false,
            modifiedBy: undefined,
            modifiedTS: undefined,
            useCreated: false
        }
    }

    render() {
        const { className } = this.props;

        const config = this.processRow();

        if (config.display) {
            // also supports '/'
            const timestamp = config.useCreated ? config.createdTS : config.modifiedTS;

            return (
                <span title={this.formatTitle(config)}
                      className={classNames('createdmodified', className)}>
                    {config.useCreated ? 'Created' : 'Modified'} {moment(timestamp).fromNow()}
                </span>
            )
        }

        return null;
    }
}
