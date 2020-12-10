import React, { PureComponent, ReactNode } from 'react';
import { Map } from 'immutable';

interface Props {
    selected: string;
    options: Map<string, string>;
    onSelectionChange: (selected: string) => void;
    id?: string;
}

export class ViewAsToggle extends PureComponent<Props> {
    static defaultProps = {
        id: 'view-select-toggle',
    };

    onToggle = (evt): void => {
        const selected = evt.target.value;
        this.props.onSelectionChange(selected);
    };

    render(): ReactNode {
        const { options, selected, id } = this.props;
        return (
            <div className="margin-bottom">
                <span className="right-spacing">View:</span>
                <div style={{ display: 'inline-block' }}>
                    <select className="form-control" onChange={this.onToggle} value={selected} id={id}>
                        {options.entrySeq().map(([option, label]) => {
                            return (
                                <option key={option} value={option}>
                                    {label}
                                </option>
                            );
                        })}
                    </select>
                </div>
            </div>
        );
    }
}
