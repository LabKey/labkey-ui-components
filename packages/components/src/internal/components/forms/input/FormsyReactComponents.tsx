import React, {
    ChangeEvent,
    FC,
    FocusEvent,
    InputHTMLAttributes,
    memo,
    ReactNode,
    RefObject,
    TextareaHTMLAttributes,
    useCallback,
    useMemo,
} from 'react';
import { withFormsy } from 'formsy-react';
import classNames from 'classnames';

import { WithFormsyProps } from '../constants';

type LayoutType = 'elementOnly' | 'horizontal' | 'vertical';

interface BaseComponentProps {
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
        <div className="invalid-feedback">
            {messages.map((message, key) => (
                <div key={key}>{message}</div>
            ))}
        </div>
    );
});

const Help: FC = ({ children }) => <small className="form-text text-muted">{children}</small>;

interface RequiredSymbolProps {
    required: boolean;
    symbol?: ReactNode;
}

const RequiredSymbol: FC<RequiredSymbolProps> = memo(({ required, symbol = '*' }) => {
    if (required === false) return null;
    return <span className="required-symbol">{symbol}</span>;
});

interface LabelProps {
    htmlFor: string;
    labelClassName?: string;
    layout?: LayoutType;
    required?: boolean;
}

const Label: FC<LabelProps> = memo(props => {
    const { children, htmlFor, labelClassName, layout, required = false } = props;

    if (layout === 'elementOnly') return null;

    const labelClassNames = classNames(['col-form-label', layout === 'horizontal' ? 'col-sm-3' : '', labelClassName]);

    return (
        <label className={labelClassNames} data-required={required} htmlFor={htmlFor}>
            {children}
            <RequiredSymbol required={required} />
        </label>
    );
});

interface RowProps extends BaseComponentProps, LabelProps {
    showErrors?: boolean;
}

const Row: FC<RowProps> = memo(props => {
    const { children, elementWrapperClassName, label, labelClassName, layout, required, rowClassName, showErrors } =
        props;

    if (layout === 'elementOnly') {
        return <span>{children}</span>;
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
                <div className={classNames('col-sm-9', elementWrapperClassName, { 'offset-sm-3': !renderLabel })}>
                    {children}
                </div>
            )}
            {layout !== 'horizontal' && children}
        </div>
    );
});

Row.defaultProps = {
    label: null,
    showErrors: true,
};

Row.displayName = 'Row';

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

InputGroup.displayName = 'InputGroup';

type InputHTMLProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onBlur' | 'onChange' | 'value'>;

export type InputProps = BaseComponentProps & InputGroupProps & InputHTMLProps;

const InputImpl: FC<InputProps & WithFormsyProps> = props => {
    // Extract InputGroupProps
    const { addonAfter, addonBefore, buttonAfter, buttonBefore, ...rest } = props;
    const {
        componentRef,
        elementWrapperClassName,
        help,
        label,
        labelClassName,
        layout,
        onChange,
        required,
        rowClassName,
        validateBeforeSubmit,
        validateOnSubmit,
        validatePristine,
        ...formsyAndHTMLProps
    } = rest;
    const {
        getErrorMessage,
        getErrorMessages,
        getValue,
        hasValue,
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
        ...inputHTMLProps
    } = formsyAndHTMLProps;
    const { className, disabled, id, type } = inputHTMLProps;
    const isValid_ = isValid();
    const showErrors = !isValid_ || showError();
    const errorMessages = getErrorMessages();
    const markAsInvalid = showErrors && (required || errorMessages?.length > 0);

    const className_ = useMemo<string>(
        () =>
            classNames(
                {
                    'custom-range': type === 'range',
                    'form-control': type !== 'hidden' && type !== 'range', // TODO: Double check this logic
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
            {...inputHTMLProps}
            className={className_}
            disabled={isFormDisabled() || disabled || false}
            onBlur={handleBlur}
            onChange={handleChange}
            ref={componentRef}
            value={getValue()}
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

    if (layout === 'elementOnly') {
        return control;
    }

    // TODO: Wire this up for textarea as well, reconcile this with "showErrors" and the "markAsInvalid" logic
    // Reconcile with this logic:
    // const validatePristine = getFallbackBoolean(
    //     propValidatePristine,
    //     contextValidatePristine,
    //     false,
    // );
    const showErrors_ = shouldShowErrors(
        isPristine(),
        isFormSubmitted(),
        isValid_,
        validatePristine,
        validateBeforeSubmit
    );

    return (
        <Row
            elementWrapperClassName={elementWrapperClassName}
            label={label}
            labelClassName={labelClassName}
            layout={layout}
            htmlFor={id}
            required={required}
            rowClassName={rowClassName}
            showErrors={showErrors_}
        >
            {control}
            {help && <Help>{help}</Help>}
            {showErrors_ && <ErrorMessages messages={errorMessages} />}
        </Row>
    );
};

InputImpl.defaultProps = {
    ...componentDefaultProps,
    type: 'text',
};

const InputWithFormsy = withFormsy(InputImpl);

export const Input: FC<InputProps & WithFormsyProps> = props => <InputWithFormsy {...props} />;

Input.displayName = 'Input';

type TextAreaHTMLProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onBlur' | 'onChange' | 'value'>;

export type TextAreaProps = BaseComponentProps & TextAreaHTMLProps;

const TextAreaImpl: FC<TextAreaProps & WithFormsyProps> = props => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { className, cols, disabled, id, name, placeholder, rows, value, ...baseProps } = props;
    const {
        getErrorMessages,
        getValue,
        help,
        isFormDisabled,
        required,
        isValid,
        layout,
        onChange,
        setValue,
        showError,
    } = baseProps;
    const showErrors = !isValid() || showError();
    const errorMessages = getErrorMessages();
    const markAsInvalid = showErrors && (required || errorMessages?.length > 0);

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

    const control = (
        <textarea
            className={classNames('form-control', { 'is-invalid': markAsInvalid }, className)}
            cols={cols}
            disabled={isFormDisabled() || disabled || false}
            id={id}
            name={name}
            onBlur={handleBlur}
            onChange={handleChange}
            placeholder={placeholder}
            required={required}
            rows={rows}
            value={getValue()}
        />
    );

    if (layout === 'elementOnly') {
        return control;
    }

    return (
        <Row {...baseProps} htmlFor={id} showErrors={showErrors}>
            {control}
            {help && <Help>{help}</Help>}
            {showErrors && <ErrorMessages messages={errorMessages} />}
        </Row>
    );
};

TextAreaImpl.defaultProps = {
    ...componentDefaultProps,
    cols: 0,
    rows: 3,
    value: '',
};

const TextAreaWithFormsy = withFormsy(TextAreaImpl);

export const TextArea: FC<TextAreaProps & WithFormsyProps> = props => <TextAreaWithFormsy {...props} />;

TextArea.displayName = 'TextArea';
