/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ReactNode } from 'react';
import { List } from 'immutable';

import { ValueDescriptor } from '../components/editable/models';

const DETAIL_ALIAS_WORD_LENGTH = 5;
const GRID_ALIAS_WORD_LENGTH = 3;

interface Props {
    data: List<any>;
    view?: string;
}

interface State {
    showMore?: boolean;
}

export class AliasRenderer extends React.Component<Props, State> {
    static getEditableRawValue = (values: List<ValueDescriptor>): string[] => {
        return values.reduce((arr, vd) => {
            if (vd.display !== undefined && vd.display !== null) {
                arr.push(vd.display);
            }
            return arr;
        }, []);
    };

    state: Readonly<State> = { showMore: false };

    handleClick = (): void => {
        this.setState(state => ({ showMore: !state.showMore }));
    };

    render(): ReactNode {
        const { data, view } = this.props;
        const { showMore } = this.state;

        if (data?.size > 0) {
            const truncationLength = view === 'detail' ? DETAIL_ALIAS_WORD_LENGTH : GRID_ALIAS_WORD_LENGTH;
            const extraCount = data.size - truncationLength;
            const aliases = data.map(alias => alias.get('value'));

            return (
                <div className="alias-renderer" title={aliases.join(', ')}>
                    {aliases.filter((alias, i) => i < truncationLength || showMore).join(', ')}
                    {extraCount > 0 && (
                        <span>
                            {!showMore ? `... and ${extraCount} more ` : ' '}
                            <span className="alias-renderer--more-link" onClick={this.handleClick}>
                                {!showMore ? '(see all)' : '(see less)'}
                            </span>
                        </span>
                    )}
                </div>
            );
        }

        return null;
    }
}
