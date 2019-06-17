/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// Type definitions for react-bootstrap v0.30.3
// Project: http://react-bootstrap.github.io/
// Definitions by: Nick Arnold <https://github.com/labkey-nicka>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
import * as React from 'react';
import {AppURL} from "../url/ActionURL";


declare module "react-bootstrap" {

    export type BsStyleTypes = 'danger' | 'default' | 'info' | 'primary' | 'success' | 'warning';

    interface AlertProps {
        bsClass?: string;
        bsStyle?: string;
        closeLabel?: string;
        dismissAfter?: number;
        onDismiss?: Function;
    }

    export class Alert extends React.Component<AlertProps, any> {}

    interface ButtonProps {
        active?: boolean;
        disabled?: boolean;
        block?: boolean;
        navItem?: boolean;
        navDropdown?: boolean;
        onClick?: any;
        id?: string;

        /**
         * You can use a custom element for this component
         */
        bsClass?: string;
        bsSize?: string
        bsStyle?: string;
        className?: string;
        href?: string;
        target?: string;
        title?: React.ReactNode;

        /**
         * Defines HTML button type Attribute
         */
        type?: string;
        onMouseOver?: any
        onMouseOut?: any
    }

    export class Button extends React.Component<ButtonProps, any> {}

    interface SplitButtonProps {
        bsSize?: string
        bsStyle?: string
        //componentClass?: elementType
        disabled?: boolean
        dropup?: boolean
        href?: string
        id?: string|number
        onClick?: Function
        onClose?: Function
        onSelect?: Function
        onToggle?: Function
        open?: boolean
        pullRight?: boolean
        role?: string
        title: React.ReactNode
        toggleLabel?: string
    }

    export class SplitButton extends React.Component<SplitButtonProps, any> {}

    interface ButtonToolbarProps {

    }

    export class ButtonToolbar extends React.Component<ButtonToolbarProps, any> {}

    interface DropdownProps {
        bsClass?: string;
        dropup?: boolean;
        id?: any;
        className?: string;
        componentClass?: any;
        disabled?: boolean;
        pullRight?: boolean;
        open?: boolean;
        onToggle?: any;
        onSelect?: any;
        role?: string;
    }

    export class Dropdown extends React.Component<DropdownProps, any> {

        public static Toggle: typeof DropdownToggle;
        public static Menu: typeof DropdownMenu;
    }

    // https://react-bootstrap.github.io/components.html#btn-dropdowns-props-dropdown-button
    interface DropdownButtonProps {
        // required
        id: any;
        title: React.ReactNode

        // optional
        bsClass?: string;
        bsSize?: string;
        bsStyle?: string;
        children?: any;
        noCaret?: boolean;
        componentClass?: any;
        disabled?: boolean;
        dropup?: boolean;
        pullRight?: boolean;
        open?: boolean;
        onClose?: Function;
        onSelect?: Function;
        onToggle?: Function;
        role?: string;
        rootCloseEvent?: string;
    }

    export class DropdownButton extends React.Component<DropdownButtonProps, any> {}

    interface DropdownMenuProps {
        bsClass?: string;
        bsRole?: string;
        pullRight?: boolean;
        open?: boolean;
        onClose?: any;
        onToggle?: any;
        onSelect?: any;
        className?: string;
    }

    export class DropdownMenu extends React.Component<DropdownMenuProps, any> {}

    interface DropdownToggleProps {
        bsRole?: string;
        noCaret?: boolean;
        open?: boolean;
        title?: string;
        useAnchor?: boolean;
    }

    export class DropdownToggle extends React.Component<DropdownToggleProps, any> {}

    interface ImageProps {
        /**
         * Sets image as responsive image
         */
        responsive?: boolean;

        /**
         * Sets image shape as rounded
         */
        rounded?: boolean;

        /**
         * Sets image shape as circle
         */
        circle?: boolean;

        /**
         * Sets image shape as thumbnail
         */
        thumbnail?: boolean;

        src: string;

        alt?: string;

        width?: number | string;

        height?: number | string;
    }

    export class Image extends React.Component<ImageProps, any> {}

    interface InputProps extends React.HTMLProps<HTMLElement> {
        labelClassName?: string;
        wrapperClassName?: string;

        // Override react.d.ts
        defaultValue?: any;
        value?: any;

        // Really for formsy
        validations?: any;
        validationError?: any;
    }

    export class Input extends React.Component<InputProps, any> {}

    export interface MenuItemProps {
        active?: boolean;
        disabled?: boolean;
        divider?: any; // TODO: Not really any
        eventKey?: any;
        header?: boolean;
        href?: string | AppURL;
        target?: string;
        title?: string;
        onClick?: any;
        onMouseEnter?: any;
        onSelect?: any;
        style?: any;
    }

    export class MenuItem extends React.Component<MenuItemProps, any> {}

    interface ModalProps {

        /**
         * Open and close the Modal with a slide and fade animation. Default is true
         */
        animation?: boolean

        /**
         * Include a backdrop component. Specify 'static' for a backdrop that doesn't trigger an "onHide" when clicked.
         */
        backdrop?: boolean | 'static'

        /**
         * Base CSS class and prefix for the component. Generally one should only change bsClass to provide new,
         * non-Bootstrap, CSS styles for a component. Default is 'modal'.
         */
        bsClass?: string

        /**
         * Component size variations (one of "lg", "large", "sm", "small").
         */
        bsSize?: string

        /**
         * A css class to apply to the Modal dialog DOM node.
         */
        dialogClassName?: string

        /**
         * A Component type that provides the modal content Markup.
         * This is a useful prop when you want to use your own styles and markup to create a custom modal component.
         */
        dialogComponentClass?: any

        /**
         * When `true` The modal will prevent focus from leaving the Modal while open.
         * Consider leaving the default value here, as it is necessary to make the Modal work well with assistive
         * technologies, such as screen readers.
         */
        enforceFocus?: boolean

        /**
         * Close the modal when escape key is pressed
         */
        keyboard?: boolean

        /**
         * Callback fired before the Modal transitions in
         */
        onEnter?: any

        /**
         * Callback fired after the Modal finishes transitioning in
         */
        onEntered?: any

        /**
         * Callback fired as the Modal begins to transition in
         */
        onEntering?: any

        /**
         * Callback fired right before the Modal transitions out
         */
        onExit?: any

        /**
         * Callback fired after the Modal finishes transitioning out
         */
        onExited?: any

        /**
         * Callback fired as the Modal begins to transition out
         */
        onExiting?: any

        /**
         * A callback fired when the header closeButton or non-static backdrop is clicked. Required if either are specified.
         */
        onHide?: any

        /**
         * When `true` the modal will show itself.
         */
        show?: boolean
    }

    export class Modal extends React.Component<ModalProps, any> {

        static Dialog: any;
        static Header: any;
        static Body: any;
        static Footer: any;
        static Title: any;
    }

    interface BaseOverlayProps {

        /**
         * Use animation
         */
        animation?: boolean | any

        onBlur?: any

        onClick?: any

        /**
         * Callback fired before the Overlay transitions in
         */
        onEnter?: any

        /**
         * Callback fired after the Overlay finishes transitioning in
         */
        onEntered?: any

        /**
         * Callback fired as the Overlay begins to transition in
         */
        onEntering?: any

        /**
         * Callback fired right before the Overlay transitions out
         */
        onExit?: any

        /**
         * Callback fired after the Overlay finishes transitioning out
         */
        onExited?: any

        /**
         * Callback fired right before the Overlay transitions out
         */
        onExiting?: any

        onFocus?: any

        onMouseOut?: any

        onMouseOver?: any

        /**
         * Sets the direction the Tooltip is positioned towards. Defaults to 'right'.
         */
        placement?: 'top' | 'right' | 'bottom' | 'left'

        /**
         * Specify whether the overlay should trigger onHide when the user clicks outside the overlay. Default is false
         */
        rootClose?: boolean
    }

    interface OverlayProps extends BaseOverlayProps {

        container: any

        /**
         * A callback invoked by the overlay when it wishes to be hidden. Required if `rootClose` is specified.
         */
        onHide?: any

        /**
         * Set the visibility of the Overlay
         */
        show?: boolean

        target?: any
    }

    export class Overlay extends React.Component<OverlayProps, any> {}

    interface OverlayTriggerProps extends BaseOverlayProps {

        /**
         * The initial visibility state of the Overlay,
         * for more nuanced visibility control consider using the Overlay component directly.
         */
        defaultOverlayShown?: boolean

        /**
         * A millisecond delay amount to show and hide the Overlay once triggered
         */
        delay?: number

        /**
         * A millisecond delay amount before hiding the Overlay once triggered.
         */
        delayHide?: number

        /**
         * A millisecond delay amount before showing the Overlay once triggered.
         */
        delayShow?: number

        /**
         * An element or text to overlay next to the target.
         */
        overlay: any // node

        /**
         * Specify which action or actions trigger Overlay visibility
         */
        trigger?: 'click' | 'hover' | 'focus' | Array<string>
    }

    export class OverlayTrigger extends React.Component<OverlayTriggerProps, any> {

        public handleDelayedHide: () => any
    }

    interface PageHeaderProps {

        /**
         * Base CSS class and prefix for the component. Generally one should only change bsClass to provide new,
         * non-Bootstrap, CSS styles for a component.
         * Defaults to 'page-header'
         */
        bsClass?: string
    }

    export class PageHeader extends React.Component<PageHeaderProps, any> {}

    interface PaginationProps {

        /**
         * Defaults to 1
         */
        activePage?: number

        /**
         * When true, will display the first and the last button page. Defaults to false
         */
        boundaryLinks?: boolean

        /**
         * Base css class name and prefix for the Component.
         * Generally one should only change bsClass if they are providing new, non bootstrap, css styles for a component.
         * Defaults to 'pagination'
         */
        bsClass?: string

        /**
         * Defaults to 1
         */
        items?: number

        onSelect?: Function
    }

    export class Pagination extends React.Component<PaginationProps, any> {}

    interface PanelBodyProps {
        bsClass?: string

        className?: string

        collapsible?: boolean
    }

    export class PanelBody extends React.Component<PanelBodyProps, any> {}

    interface PanelProps {

        /**
         * Base css class name and prefix for the Component.
         * Generally one should only change bsClass if they are providing new, non bootstrap, css styles for a component.
         * Defaults to 'panel'
         */
        bsClass?: string;

        /**
         * Component visual or contextual style variants.
         * one of: "success", "warning", "danger", "info", "default", "primary"
         * Defaults to 'default'
         */
        bsStyle?: BsStyleTypes;

        collapsible?: boolean;

        /**
         * Defaults to false
         */
        defaultExpanded?: boolean;

        eventKey?: any;

        expanded?: boolean;

        id?: string | number;

        onToggle?: Function;

        className?: string;
    }

    export class Panel extends React.Component<PanelProps> {

        static Body: typeof PanelBody;
        static Collapse: any;
        static Footer: any;
        static Heading: any;
        static Title: any;
        static Toggle: any;
    }

    interface PopoverProps {

        /**
         * The "left" position value for the Popover arrow.
         */
        arrowOffsetLeft?: number | string

        /**
         * The "top" position value for the Popover arrow.
         */
        arrowOffsetTop?: number | string

        /**
         * Base CSS class and prefix for the component.
         * Generally one should only change bsClass to provide new, non-Bootstrap, CSS styles for a component.
         */
        bsClass?: string

        /**
         * An html id attribute, necessary for accessibility @type {string} @required
         */
        id: string

        onMouseOut?: any

        onMouseOver?: any

        /**
         * Sets the direction the Popover is positioned towards.
         */
        placement?: 'top' | 'right' | 'bottom' | 'left'

        /**
         * The "left" position value for the Popover.
         */
        positionLeft?: number

        /**
         * The "top" position value for the Popover.
         */
        positionTop?: number

        /**
         * Title text
         */
        title?: any // node
    }

    export class Popover extends React.Component<PopoverProps, any> {}

    interface ProgressBarProps {
        /**
         * Base CSS class and prefix for the component.
         * Generally one should only change bsClass to provide new, non-Bootstrap, CSS styles for a component.
         * Defaults to "progress-bar"
         */
        bsClass?: string

        /**
         * Component visual or contextual style variants.
         * one of: "success", "warning", "danger", "info", "default", "primary"
         */
        bsStyle?: BsStyleTypes

        /**
         * Defaults to false.
         */
        active?: boolean

        /**
         * Defaults to false.
         */
        isChild?: boolean

        label?: React.ReactNode

        /**
         * Defaults to 100.
         */
        max?: number

        /**
         * Defaults to 0.
         */
        min?: number

        now: number

        /**
         * Screenreader only label. Add prop to hide the label visually. Defaults to false.
         */
        srOnly?: boolean

        /**
         * Defaults to false.
         */
        striped?: boolean
    }

    export class ProgressBar extends React.Component<ProgressBarProps, any> {}

    interface TabProps {

        /**
         * Use animation when showing or hiding <TabPane>'s. Use false to disable, true to enable the default
         * <Fade> animation or any <Transition> component.
         */
        animation?: boolean | any

        /**
         * Base CSS class and prefix for the component. Generally one should only change bsClass to provide new,
         * non-Bootstrap, CSS styles for a component. Defaults to 'tab-pane'.
         */
        bsClass?: string

        /**
         * Defaults to false
         */
        disabled?: boolean

        /**
         * Uniquely identify the <TabPane> among its siblings
         */
        eventKey?: any

        /**
         * Transition onEnter callback when animation is not false
         */
        onEnter?: Function

        /**
         * Transition onEntered callback when animation is not false
         */
        onEntered?: Function

        /**
         * Transition onEntering callback when animation is not false
         */
        onEntering?: Function

        /**
         * Transition onExited callback when animation is not false
         */
        onExit?: Function

        /**
         * tabClassName is used as className for the associated NavItem
         */
        tabClassName?: string

        /**
         * Title text
         */
        title?: any // node

        /**
         * Unmount the tab (remove it from the DOM) when it is no longer visible
         */
        unmountOnExit?: boolean
    }

    export class Tab extends React.Component<TabProps, any> {}

    interface TabsProps {
        /**
         * Mark the Tab with a matching `eventKey` as active.
         * Controller by `onSelect`, initialProp `defaultActiveKey`.
         */
        activeKey?: any

        /**
         * Defaults to true
         */
        animation?: boolean

        /**
         * Defaults to 'tabs'
         */
        bsStyle?: 'tabs' | 'pills'

        defaultActiveKey: any

        /**
         * requiredForA11y
         */
        id: any

        onSelect?: Function

        /**
         * Unmount tabs (remove it from the DOM) when it is no longer visible.
         * Defaults to false.
         */
        unmountOnExit?: boolean
    }

    export class Tabs extends React.Component<TabsProps, any> {}

    interface TooltipProps {

        /**
         * The "left" position value for the Popover arrow.
         */
        arrowOffsetLeft?: number | string

        /**
         * The "top" position value for the Popover arrow.
         */
        arrowOffsetTop?: number | string

        /**
         * Base CSS class and prefix for the component.
         * Generally one should only change bsClass to provide new, non-Bootstrap, CSS styles for a component.
         */
        bsClass?: string

        className?: string;

        id: any;

        /**
         * Include a backdrop component. Specify 'static' for a backdrop that doesn't trigger an "onHide" when clicked.
         */
        placement?: string;

        /**
         * The "left" position value for the Popover.
         */
        positionLeft?: number

        /**
         * The "top" position value for the Popover.
         */
        positionTop?: number
    }

    export class Tooltip extends React.Component<TooltipProps, any> {}

    interface WellProps {

        /**
         * Base CSS class and prefix for the component. Generally one should only change bsClass to provide new,
         * non-Bootstrap, CSS styles for a component. Default is 'modal'.
         */
        bsClass?: string

        /**
         * Component size variations (one of "lg", "large", "sm", "small").
         */
        bsSize?: string
    }

    export class Well extends React.Component<WellProps, any> {}
}