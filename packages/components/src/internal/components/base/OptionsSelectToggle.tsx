import React, { PureComponent, ReactNode } from 'react';
import { Map } from 'immutable';

interface Props {
    selected: string;
    options: Map<string, string>;
    onSelectionChange: (selected: string) => void;
    id?: string;
    label?: string;
}

export class OptionsSelectToggle extends PureComponent<Props> {
    static defaultProps = {
        id: 'view-select-toggle',
    };

    onToggle = (evt): void => {
        const selected = evt.target.value;
        this.props.onSelectionChange(selected);
    };

    render(): ReactNode {
        const { options, selected, id, label } = this.props;
        return (
            <div className="margin-bottom">
                {label &&
                    <span className="right-spacing">{label}:</span>
                }
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
