import React, {
    Children,
    createContext,
    FC,
    MouseEvent,
    ReactElement,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import classNames from 'classnames';

import { cancelEvent } from './events';
import { generateId } from './util/utils';

function tabId(id: string, eventKey: string): string {
    return `${id}-tab-${eventKey}`;
}

function paneId(id: string, eventKey: string): string {
    return `${id}-pane-${eventKey}`;
}

interface TabContext {
    id: string;
    activeKey: string;
}

const Context = createContext<TabContext>(undefined);

interface TabProps {
    children: ReactNode;
    className?: string;
    eventKey: string;
    title: ReactNode;
}

export const Tab: FC<TabProps> = ({ children, className, eventKey }) => {
    const { id, activeKey } = useContext(Context);
    const className_ = classNames('tab-pane', className, { active: activeKey === eventKey });
    return (
        <div aria-labelledby={tabId(id, activeKey)} className={className_} id={paneId(id, activeKey)} role="tabpanel">
            {children}
        </div>
    );
};

interface TabsProps {
    activeKey?: string;
    children: ReactElement<TabProps> | Array<ReactElement<TabProps>>;
    className?: string;
    onSelect?: (eventKey: string) => void;
}

export const Tabs: FC<TabsProps> = props => {
    const { children, onSelect } = props;
    const id = useMemo(() => generateId('tabs'), []);
    const className = classNames('lk-tabs', props.className);
    const [activeKey, setActiveKey] = useState<string>(() => {
        if (props.activeKey !== undefined) return props.activeKey;
        // Child is null if we do something like {canSeeSpecialTab && (<Tab eventKey="specialTab">...</Tab>}
        const firstNotNull = Children.toArray(children).find(child => {
            return child !== null;
        }) as ReactElement<TabProps>;
        return firstNotNull.props.eventKey;
    });
    const tabContext = useMemo(() => ({ id, activeKey }), [id, activeKey]);
    const onTabClick = useCallback(
        (event: MouseEvent<HTMLAnchorElement>) => {
            cancelEvent(event);
            const targetEventKey = event.currentTarget.dataset.eventKey;
            if (onSelect !== undefined) onSelect(targetEventKey);
            else setActiveKey(targetEventKey);
        },
        [onSelect]
    );

    // Need this useEffect to allow for controlled usages of the selected tab state
    useEffect(() => {
        if (props.activeKey !== undefined) setActiveKey(props.activeKey);
    }, [props.activeKey]);

    const tabs = useMemo(() => {
        return Children.map(children, (child: ReactElement<TabProps>) => {
            // Child is null if we do something like {canSeeSpecialTab && (<Tab eventKey="specialTab">...</Tab>}
            if (child === null) return null;
            const eventKey = child?.props?.eventKey;
            const title = child?.props?.title;
            return (
                <li className={eventKey === activeKey ? 'active' : ''} key={eventKey}>
                    <a
                        id={tabId(id, eventKey)}
                        role="tab"
                        aria-controls={paneId(id, eventKey)}
                        href="#"
                        data-event-key={eventKey}
                        onClick={onTabClick}
                    >
                        {title}
                    </a>
                </li>
            );
        });
    }, [children, activeKey, id, onTabClick]);

    return (
        <div className={className}>
            <ul className="nav nav-tabs" role="tablist">
                {tabs}
            </ul>
            <div className="tab-content">
                <Context.Provider value={tabContext}>{children}</Context.Provider>
            </div>
        </div>
    );
};
