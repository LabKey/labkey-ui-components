import React from 'react';
import classNames from 'classnames';
import { Panel } from 'react-bootstrap';
import { faCheckCircle, faExclamationCircle, faMinusSquare, faPlusSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { DomainPanelStatus } from './models';

interface Props {
    id: string;
    title: string;
    titlePrefix?: string;
    collapsed: boolean;
    collapsible: boolean;
    controlledCollapse: boolean;
    headerDetails?: string;
    iconHelpMsg?: string;
    panelStatus: DomainPanelStatus;
    togglePanel: (evt: any, collapsed?: boolean) => any;
    useTheme: boolean;
    isValid: boolean;
}

export class CollapsiblePanelHeader extends React.PureComponent<Props, any> {
    getPanelHeaderClass(): string {
        const { collapsed, collapsible, controlledCollapse, useTheme } = this.props;

        return classNames('domain-panel-header', {
            'domain-heading-collapsible': collapsible || controlledCollapse,
            'domain-panel-header-expanded': !collapsed,
            'domain-panel-header-collapsed': collapsed,
            'labkey-page-nav': !collapsed && useTheme,
            'domain-panel-header-no-theme': !collapsed && !useTheme,
        });
    }

    getHeaderIconHelpMsg(): string {
        const { isValid, panelStatus, iconHelpMsg } = this.props;

        if (!isValid) {
            return iconHelpMsg;
        }

        if (panelStatus === 'TODO') {
            return 'This section does not contain any user defined fields. You may want to review.';
        }

        return undefined;
    }

    getHeaderIconComponent = () => {
        return (
            <span className={this.getHeaderIconClass()}>
                <FontAwesomeIcon icon={this.getHeaderIcon()} />
            </span>
        );
    };

    getHeaderIconClass() {
        const { collapsed, isValid, panelStatus } = this.props;
        const validComplete = isValid && panelStatus === 'COMPLETE';

        return classNames('domain-panel-status-icon', {
            'domain-panel-status-icon-green': collapsed && validComplete,
            'domain-panel-status-icon-blue': collapsed && !validComplete,
        });
    }

    getHeaderIcon() {
        const { isValid, panelStatus } = this.props;
        return !isValid || panelStatus === 'TODO' ? faExclamationCircle : faCheckCircle;
    }

    renderExpandCollapseIcon() {
        const { collapsed } = this.props;
        const icon = collapsed ? faPlusSquare : faMinusSquare;
        const className = collapsed ? 'domain-form-expand-btn' : 'domain-form-collapse-btn';

        return (
            <span className="pull-right">
                <FontAwesomeIcon size="lg" icon={icon} className={className} />
            </span>
        );
    }

    getTitlePrefix(): string {
        let prefix = this.props.titlePrefix;

        // ellipsis after certain length
        if (prefix && prefix.length > 70) {
            prefix = prefix.substr(0, 70) + '...';
        }

        return prefix ? prefix + ' - ' : '';
    }

    renderHeader() {
        const { children, panelStatus, controlledCollapse, collapsible, title, headerDetails } = this.props;
        const iconHelpMsg = panelStatus && panelStatus !== 'NONE' ? this.getHeaderIconHelpMsg() : undefined;

        return (
            <>
                {/* Header help icon*/}
                {iconHelpMsg && (
                    <LabelHelpTip
                        title={title}
                        body={() => iconHelpMsg}
                        placement="top"
                        iconComponent={this.getHeaderIconComponent}
                    />
                )}
                {panelStatus && panelStatus !== 'NONE' && !iconHelpMsg && this.getHeaderIconComponent()}

                {/* Header name*/}
                <span className="domain-panel-title">{this.getTitlePrefix() + title}</span>

                {/* Expand/Collapse Icon*/}
                {(controlledCollapse || collapsible) && this.renderExpandCollapseIcon()}

                {/* Help tip*/}
                {children && (
                    <LabelHelpTip
                        customStyle={{ verticalAlign: 'top', marginLeft: '5px' }}
                        placement="top"
                        title={title}
                        body={() => children}
                    />
                )}

                {/* Header details, shown on the right side*/}
                {controlledCollapse && headerDetails && (
                    <span className="domain-panel-header-fields-defined">{headerDetails}</span>
                )}
            </>
        );
    }

    render() {
        const { id, togglePanel } = this.props;

        return (
            <Panel.Heading id={id} onClick={togglePanel} className={this.getPanelHeaderClass()}>
                {this.renderHeader()}
            </Panel.Heading>
        );
    }
}
