// The components declared in this file are intended to be functional equivalents for components
// in the "formsy-react-components" package. That package is no longer maintained as of this writing (11/23)
// and we needed to drop it as a dependency with our move to React 18.
// Credit: https://github.com/twisty/formsy-react-components
import React, {
    ChangeEvent,
    FC,
    FocusEvent,
    InputHTMLAttributes,
    memo,
    ReactNode,
    RefObject,
    SelectHTMLAttributes,
    TextareaHTMLAttributes,
    useCallback,
    useMemo,
} from 'react';
import { withFormsy } from 'formsy-react';
import classNames from 'classnames';

import { WithFormsyProps } from '../constants';

type LayoutType = 'elementOnly' | 'horizontal' | 'vertical';

interface SharedFormsyProps {
    validationError?: string;
    validationErrors?: any; // Record<string, any> | string;
    validations?: any; // Record<string, any> | string;
}

interface BaseComponentProps extends SharedFormsyProps {
    componentRef?: RefObject<any>;
    elementWrapperClassName?: string;
    help?: ReactNode;
    label?: ReactNode;
    labelClassName?: string;
    layout?: LayoutType;
    onChange?: (name: string, value: any) => void;
    required?: boolean;
    rowClassName?: string;
    validateBeforeSubmit?: boolean;
    validateOnSubmit?: boolean;
    validatePristine?: boolean;
    value?: any;
}

const componentDefaultProps: Partial<BaseComponentProps> = {
    layout: 'horizontal',
    validateBeforeSubmit: true,
    validateOnSubmit: false,
    validatePristine: false,
};

/** Determine whether to show errors, or not. */
const shouldShowErrors = (
    isPristine: boolean,
    isFormSubmitted: boolean,
    isValid: boolean,
    validatePristine: boolean,
    validateBeforeSubmit: boolean
): boolean => {
    if (isPristine === true) {
        if (validatePristine === false) {
            return false;
        }
    }
    if (validateBeforeSubmit === false) {
        if (isFormSubmitted === false) {
            return false;
        }
    }

    return isValid === false;
};

interface ErrorMessageProps {
    messages: ReactNode[];
}

const ErrorMessages: FC<ErrorMessageProps> = memo(props => {
    const { messages } = props;
    if (!messages) return null;
    return (
        <div>
            {messages.map((message, key) => (
                // eslint-disable-next-line react/no-array-index-key
                <span className="help-block validation-message" key={key}>
                    {message}
                </span>
            ))}
        </div>
    );
});

const Help: FC = ({ children }) => {
    if (!children) return null;
    return <small className="form-text text-muted">{children}</small>;
};

interface RequiredSymbolProps {
    required: boolean;
    symbol?: ReactNode;
}

const RequiredSymbol: FC<RequiredSymbolProps> = memo(({ required, symbol = ' *' }) => {
    if (required === false) return null;
    return <span className="required-symbol">{symbol}</span>;
});

interface LabelProps {
    fakeLabel?: boolean;
    htmlFor: string;
    labelClassName?: string;
    layout?: LayoutType;
    required?: boolean;
}

const Label: FC<LabelProps> = memo(props => {
    const { children, fakeLabel, htmlFor, labelClassName, layout, required } = props;

    if (layout === 'elementOnly') return null;

    const labelClassNames = classNames(['col-form-label', layout === 'horizontal' ? 'col-sm-3' : '', labelClassName]);

    if (fakeLabel) {
        return (
            <div className={labelClassNames} data-required={required}>
                {children}
                <RequiredSymbol required={required} />
            </div>
        );
    }

    return (
        <label className={labelClassNames} data-required={required} htmlFor={htmlFor}>
            {children}
            <RequiredSymbol required={required} />
        </label>
    );
});

Label.defaultProps = {
    fakeLabel: false,
    required: false,
};

const Control: FC<BaseControlProps & LabelProps> = memo(props => {
    const {
        children,
        elementWrapperClassName,
        help,
        label,
        labelClassName,
        layout,
        messages,
        required,
        rowClassName,
        showErrors,
    } = props;

    const control = (
        <>
            {children}
            <Help>{help}</Help>
            {showErrors && <ErrorMessages messages={messages} />}
        </>
    );

    if (layout === 'elementOnly') {
        return control;
    }

    const rowClassNames = ['form-group'];

    if (showErrors) {
        rowClassNames.push('has-error');
        rowClassNames.push('has-feedback');
    }

    if (layout === 'horizontal') {
        rowClassNames.push('row');
    }

    rowClassNames.push(rowClassName);

    // We should render the label if there is label text defined, or if the
    // component is required (so a required symbol is displayed in the label tag)
    const renderLabel = label !== null || required;

    return (
        <div className={classNames(rowClassNames)}>
            {renderLabel && (
                <Label htmlFor={props.htmlFor} labelClassName={labelClassName} layout={layout} required={required}>
                    {label}
                </Label>
            )}
            {layout === 'horizontal' && (
                <div className={classNames(elementWrapperClassName, { 'offset-sm-3': !renderLabel })}>{control}</div>
            )}
            {layout !== 'horizontal' && control}
        </div>
    );
});

Control.defaultProps = {
    elementWrapperClassName: 'col-sm-9',
    label: null,
    showErrors: true,
};

Control.displayName = 'Row';

interface InputGroupProps {
    addonAfter?: ReactNode;
    addonBefore?: ReactNode;
    buttonAfter?: ReactNode;
    buttonBefore?: ReactNode;
}

const InputGroup: FC<InputGroupProps> = props => {
    const { addonAfter, addonBefore, buttonAfter, buttonBefore, children } = props;

    return (
        <div className="input-group">
            {!!addonBefore && <span className="input-group-prepend">{addonBefore}</span>}
            {!!buttonBefore && <span className="input-group-prepend">{buttonBefore}</span>}
            {children}
            {!!addonAfter && <span className="input-group-append">{addonAfter}</span>}
            {!!buttonAfter && <span className="input-group-append">{buttonAfter}</span>}
        </div>
    );
};

interface BaseControlProps extends BaseComponentProps {
    markAsInvalid?: boolean;
    messages?: string[];
    showErrors?: boolean;
}

interface ControlProps<H> {
    baseProps: Partial<BaseControlProps>;
    formsyProps: Partial<WithFormsyProps>;
    htmlProps: H;
}

function useControlProps<H>(props: any): ControlProps<H> {
    const {
        componentRef,
        elementWrapperClassName,
        help,
        label,
        labelClassName,
        layout,
        onChange,
        rowClassName,
        validateBeforeSubmit,
        validateOnSubmit,
        validatePristine,
        ...formsyAndHTMLProps
    } = props;
    const {
        getErrorMessage,
        getErrorMessages,
        getValue,
        hasValue,
        innerRef,
        isFormDisabled,
        isFormSubmitted,
        isPristine,
        isRequired,
        isValid,
        isValidValue,
        resetValue,
        setValidations,
        setValue,
        showError,
        step,
        showRequired,
        validationError,
        validationErrors,
        validations,
        value,
        ...htmlProps
    } = formsyAndHTMLProps;

    const messages = getErrorMessages();
    const required = htmlProps.required;

    return {
        baseProps: {
            componentRef,
            elementWrapperClassName,
            help,
            label,
            labelClassName,
            layout,
            markAsInvalid: showError() && (required || messages?.length > 0),
            messages,
            onChange,
            required,
            rowClassName,
            showErrors: shouldShowErrors(
                isPristine(),
                isFormSubmitted(),
                isValid(),
                validatePristine,
                validateBeforeSubmit
            ),
            validateBeforeSubmit,
            validateOnSubmit,
            validatePristine,
        },
        formsyProps: {
            getErrorMessage,
            getErrorMessages,
            getValue,
            hasValue,
            innerRef,
            isFormDisabled,
            isFormSubmitted,
            isPristine,
            isRequired,
            isValid,
            isValidValue,
            resetValue,
            setValidations,
            setValue,
            showError,
            showRequired,
            validationError,
            validationErrors,
            validations,
        },
        htmlProps,
    };
}

InputGroup.displayName = 'InputGroup';

type InputHTMLProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onBlur' | 'onChange' | 'value'>;

interface CheckboxBaseProps extends BaseComponentProps {
    valueLabel?: string;
}

export type FormsyCheckboxProps = CheckboxBaseProps & InputHTMLProps;

const CheckboxImpl: FC<FormsyCheckboxProps & WithFormsyProps> = props => {
    const { valueLabel, ...rest } = props;
    const { baseProps, formsyProps, htmlProps } = useControlProps<InputHTMLProps>(rest);
    const { componentRef, onChange } = baseProps;
    const { getValue, isFormDisabled, setValue } = formsyProps;
    const { disabled, id, required } = htmlProps;

    const handleChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            setValue(event.currentTarget.checked);
            onChange?.(event.currentTarget.name, event.currentTarget.checked);
        },
        [onChange, setValue]
    );

    return (
        <Control {...baseProps} fakeLabel htmlFor={id} required={required}>
            <div className="custom-control custom-checkbox">
                <input
                    {...htmlProps}
                    checked={getValue() === true}
                    className="custom-control-input"
                    disabled={isFormDisabled() || disabled || false}
                    id={id}
                    onChange={handleChange}
                    ref={componentRef}
                    type="checkbox"
                />
                <label className="custom-control-label" htmlFor={id}>
                    {valueLabel}
                </label>
            </div>
        </Control>
    );
};

CheckboxImpl.defaultProps = {
    ...componentDefaultProps,
    value: false,
    valueLabel: '',
};

const CheckboxWithFormsy = withFormsy(CheckboxImpl);

export const FormsyCheckbox: FC<FormsyCheckboxProps & WithFormsyProps> = props => <CheckboxWithFormsy {...props} />;

FormsyCheckbox.displayName = 'FormsyCheckbox';

export type FormsyInputProps = BaseComponentProps & InputGroupProps & InputHTMLProps;

const InputImpl: FC<FormsyInputProps & WithFormsyProps> = props => {
    // Extract InputGroupProps
    const { addonAfter, addonBefore, buttonAfter, buttonBefore, ...rest } = props;
    const { baseProps, formsyProps, htmlProps } = useControlProps<InputHTMLProps>(rest);
    const { componentRef, markAsInvalid, onChange } = baseProps;
    const { getValue, isFormDisabled, setValue } = formsyProps;
    const { className, disabled, id, required, type } = htmlProps;

    const className_ = useMemo<string>(
        () =>
            classNames(
                {
                    'custom-range': type === 'range',
                    'form-control': type !== 'hidden' && type !== 'range',
                    'is-invalid': markAsInvalid,
                },
                className
            ),
        [className, markAsInvalid, type]
    );

    const handleBlur = useCallback(
        (event: FocusEvent<HTMLInputElement>) => {
            setValue(event.currentTarget.value);
        },
        [setValue]
    );

    const handleChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            setValue(event.currentTarget.value);
            onChange?.(event.currentTarget.name, event.currentTarget.value);
        },
        [onChange, setValue]
    );

    const input = (
        <input
            {...htmlProps}
            className={className_}
            disabled={isFormDisabled() || disabled || false}
            onBlur={handleBlur}
            onChange={handleChange}
            ref={componentRef}
            value={getValue() ?? ''}
        />
    );

    if (type === 'hidden') {
        return input;
    }

    let control: React.JSX.Element;
    if (addonAfter || addonBefore || buttonAfter || buttonBefore) {
        control = (
            <InputGroup
                addonAfter={addonAfter}
                addonBefore={addonBefore}
                buttonAfter={buttonAfter}
                buttonBefore={buttonBefore}
            >
                {input}
            </InputGroup>
        );
    } else {
        control = input;
    }

    return (
        <Control {...baseProps} htmlFor={id} required={required}>
            {control}
        </Control>
    );
};

InputImpl.defaultProps = {
    ...componentDefaultProps,
    type: 'text',
};

const InputWithFormsy = withFormsy(InputImpl);

export const FormsyInput: FC<FormsyInputProps & WithFormsyProps> = props => <InputWithFormsy {...props} />;

FormsyInput.displayName = 'FormsyInput';

export interface FormsySelectOption {
    className?: string;
    disabled?: boolean;
    label: string;
    value: string;
}

interface SelectBaseProps extends BaseComponentProps {
    multiple?: boolean;
    options: FormsySelectOption[];
}

type SelectHTMLProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onBlur' | 'onChange'>;

export type FormsySelectProps = SelectBaseProps & SelectHTMLProps & WithFormsyProps;

const SelectImpl: FC<FormsySelectProps> = props => {
    const { multiple, options, ...rest } = props;
    const { baseProps, formsyProps, htmlProps } = useControlProps<SelectHTMLProps>(rest);
    const { componentRef, markAsInvalid, onChange } = baseProps;
    const { isFormDisabled, setValue } = formsyProps;
    const { className, disabled, id, required } = htmlProps;

    const handleChange = useCallback(
        (event: React.FormEvent<HTMLSelectElement>) => {
            let value: any;
            if (multiple) {
                value = Array.from(event.currentTarget.options)
                    .filter(o => o.selected)
                    .map(o => o.value);
            } else {
                ({ value } = event.currentTarget);
            }
            setValue(value);
            onChange?.(event.currentTarget.name, value);
        },
        [multiple, onChange, setValue]
    );

    return (
        <Control {...baseProps} htmlFor={id} required={required}>
            <select
                {...htmlProps}
                className={classNames('form-control', { 'is-invalid': markAsInvalid }, className)}
                disabled={isFormDisabled() || disabled || false}
                id={id}
                onChange={handleChange}
                ref={componentRef}
            >
                {options.map((option, i) => (
                    <option key={i} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </Control>
    );
};

SelectImpl.defaultProps = {
    ...componentDefaultProps,
    multiple: false,
};

const SelectWithFormsy = withFormsy(SelectImpl);

export const FormsySelect: FC<FormsySelectProps> = props => <SelectWithFormsy {...props} />;

FormsySelect.displayName = 'FormsySelect';

type TextAreaHTMLProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onBlur' | 'onChange' | 'value'>;

export type FormsyTextAreaProps = BaseComponentProps & TextAreaHTMLProps;

const TextAreaImpl: FC<FormsyTextAreaProps & WithFormsyProps> = props => {
    const { baseProps, formsyProps, htmlProps } = useControlProps<TextAreaHTMLProps>(props);
    const { componentRef, markAsInvalid, onChange } = baseProps;
    const { getValue, isFormDisabled, setValue } = formsyProps;
    const { className, disabled, id, required } = htmlProps;

    const handleBlur = useCallback(
        (event: FocusEvent<HTMLTextAreaElement>) => {
            setValue(event.currentTarget.value);
        },
        [setValue]
    );

    const handleChange = useCallback(
        (event: ChangeEvent<HTMLTextAreaElement>) => {
            setValue(event.currentTarget.value);
            onChange?.(event.currentTarget.name, event.currentTarget.value);
        },
        [onChange, setValue]
    );

    return (
        <Control {...baseProps} htmlFor={id} required={required}>
            <textarea
                {...htmlProps}
                className={classNames('form-control', { 'is-invalid': markAsInvalid }, className)}
                disabled={isFormDisabled() || disabled || false}
                id={id}
                onBlur={handleBlur}
                onChange={handleChange}
                ref={componentRef}
                required={required}
                value={getValue()}
            />
        </Control>
    );
};

TextAreaImpl.defaultProps = {
    ...componentDefaultProps,
    cols: 0,
    rows: 3,
    value: '',
};

const TextAreaWithFormsy = withFormsy(TextAreaImpl);

export const FormsyTextArea: FC<FormsyTextAreaProps & WithFormsyProps> = props => <TextAreaWithFormsy {...props} />;

FormsyTextArea.displayName = 'FormsyTextArea';
