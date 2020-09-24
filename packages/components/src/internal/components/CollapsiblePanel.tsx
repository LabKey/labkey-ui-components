import React, { PureComponent } from 'react';
import { Panel } from 'react-bootstrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinusSquare, faPlusSquare } from '@fortawesome/free-solid-svg-icons';

import { LabelHelpTip } from './base/LabelHelpTip';

interface CollapsiblePanelProps {
    title: string;
    helpTitle?: string;
    helpBody?: () => any;
    bodyClass?: string;
    initCollapsed?: boolean;
}

interface CollapsiblePanelState {
    collapsed: boolean;
}

export class CollapsiblePanel extends PureComponent<CollapsiblePanelProps, CollapsiblePanelState> {
    constructor(props) {
        super(props);

        this.state = {
            collapsed: !!props.initCollapsed,
        };
    }

    togglePanel = (): void => {
        this.setState(state => ({ collapsed: !state.collapsed }));
    };

    renderHeaderContent = (): React.ReactFragment => {
        const { title, helpTitle, helpBody } = this.props;
        const { collapsed } = this.state;

        return (
            <div className="collapsible-panel-header-container">
                {/* Header name*/}
                <span>{title}</span>

                {helpTitle && helpBody && <LabelHelpTip placement="top" title={helpTitle} body={helpBody} />}

                {/* Expand/Collapse Icon*/}
                {collapsed && (
                    <span className="pull-right">
                        <FontAwesomeIcon size="lg" icon={faPlusSquare} className="collapsible-panel-expand-btn" />
                    </span>
                )}
                {!collapsed && (
                    <span className="pull-right">
                        <FontAwesomeIcon size="lg" icon={faMinusSquare} className="collapsible-panel-expand-btn" />
                    </span>
                )}
            </div>
        );
    };

    render(): React.ReactNode {
        const { children, bodyClass } = this.props;
        const { collapsed } = this.state;

        return (
            <Panel expanded={!collapsed} onToggle={() => {}}>
                <Panel.Heading onClick={this.togglePanel} className="collapsible-panel-header">
                    {this.renderHeaderContent()}
                </Panel.Heading>
                <Panel.Body collapsible={true} className={bodyClass ? bodyClass : ''}>
                    {children}
                </Panel.Body>
            </Panel>
        );
    }
}
