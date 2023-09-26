import React, { ReactNode } from 'react';
import { Panel } from 'react-bootstrap';

import { Alert } from '../base/Alert';

import { DomainPanelStatus } from './models';
import { getDomainAlertClasses, getDomainPanelClass } from './actions';
import { CollapsiblePanelHeader } from './CollapsiblePanelHeader';
import { PROPERTIES_PANEL_ERROR_MSG } from './constants';
import { InjectedDomainPropertiesPanelCollapseProps } from './DomainPropertiesPanelCollapse';

// This is needed to suppress JS warning about providing an expanded prop without onToggle
// eslint-disable-next-line no-empty-function,@typescript-eslint/no-empty-function
const noop = (): void => {};

export interface BasePropertiesPanelProps {
    panelStatus: DomainPanelStatus;
    validate: boolean;
    warning?: string;
}

interface OwnProps {
    headerId: string;
    isValid: boolean;
    title: string;
    titlePrefix?: string;
    todoIconHelpMsg?: string;
    updateValidStatus: (model?: any) => void;
}

type Props = OwnProps & BasePropertiesPanelProps & InjectedDomainPropertiesPanelCollapseProps;

export class BasePropertiesPanel extends React.PureComponent<Props> {
    static defaultProps = {
        title: 'Properties',
        validate: false,
    };

    componentDidUpdate(prevProps: Props): void {
        const { validate, updateValidStatus } = this.props;

        if (validate && prevProps.validate !== validate) {
            updateValidStatus();
        }
    }

    toggleLocalPanel = (): void => {
        const { togglePanel, collapsed, updateValidStatus } = this.props;

        updateValidStatus();
        togglePanel(!collapsed);
    };

    render(): ReactNode {
        const {
            collapsed,
            collapsible,
            controlledCollapse,
            panelStatus,
            headerId,
            titlePrefix,
            title,
            isValid,
            children,
            warning,
            todoIconHelpMsg,
        } = this.props;

        return (
            <>
                <Panel className={getDomainPanelClass(collapsed, true)} expanded={!collapsed} onToggle={noop}>
                    <CollapsiblePanelHeader
                        id={headerId}
                        title={title}
                        titlePrefix={titlePrefix}
                        togglePanel={this.toggleLocalPanel}
                        collapsed={collapsed}
                        collapsible={collapsible}
                        controlledCollapse={controlledCollapse}
                        panelStatus={panelStatus}
                        isValid={isValid}
                        iconHelpMsg={PROPERTIES_PANEL_ERROR_MSG}
                        todoIconHelpMsg={todoIconHelpMsg}
                    />
                    <Panel.Body collapsible={collapsible || controlledCollapse}>{children}</Panel.Body>
                </Panel>
                {!isValid && (
                    <div onClick={this.toggleLocalPanel} className={getDomainAlertClasses(collapsed, true)}>
                        <Alert bsStyle="danger">{PROPERTIES_PANEL_ERROR_MSG}</Alert>
                    </div>
                )}
                {isValid && warning && (
                    <div onClick={this.toggleLocalPanel} className={getDomainAlertClasses(collapsed, true)}>
                        <Alert bsStyle="warning">{warning}</Alert>
                    </div>
                )}
            </>
        );
    }
}
