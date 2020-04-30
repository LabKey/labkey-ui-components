import React from 'react';
import { Overlay, Popover } from 'react-bootstrap';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface LabelHelpTipProps {
    title: string;
    body: () => any;
    placement?: 'top' | 'right' | 'bottom' | 'left';
    id?: string;
    size?: any; // size of help icon, if using default icon
    customStyle?: any; // additional style added to help icon
    required?: boolean; // will add required message at bottom of help tooltip
    iconComponent?: () => React.ReactElement; // use a different icon than the question mark circle
}

interface LabelHelpTipState {
    show: boolean;
    target: any;
}

export class LabelHelpTip extends React.PureComponent<LabelHelpTipProps, LabelHelpTipState> {
    constructor(props) {
        super(props);

        this.state = {
            show: false,
            target: undefined,
        };
    }

    static defaultProps = {
        id: 'tooltip',
        size: '1x',
        customStyle: {},
    };

    attachRef = (target: any) => {
        if (!this.state.target && target) {
            this.setState(() => ({ target }));
        }
    };

    toggleShow = () => {
        this.setState(state => ({ show: !state.show }));
    };

    render() {
        const { title, body, placement, id, size, customStyle, required, iconComponent } = this.props;
        const { target, show } = this.state;

        return (
            <>
                <span
                    className="label-help-target"
                    ref={this.attachRef}
                    onMouseOver={this.toggleShow}
                    onMouseOut={this.toggleShow}
                >
                    {/* Need to have both icon and overlay inside mouse handlers div so overlay stays visible when moused over*/}
                    {iconComponent ? (
                        iconComponent()
                    ) : (
                        <FontAwesomeIcon
                            size={size}
                            style={customStyle}
                            className="label-help-icon"
                            icon={faQuestionCircle}
                        />
                    )}
                    <Overlay target={target} show={show} placement={placement}>
                        <Popover id={id} title={title}>
                            {body()}
                            {required && <div className="label-help-required">This field is required.</div>}
                        </Popover>
                    </Overlay>
                </span>
            </>
        );
    }
}
