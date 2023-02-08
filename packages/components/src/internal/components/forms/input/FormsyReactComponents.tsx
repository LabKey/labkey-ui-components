import React, { ChangeEvent, FC, FocusEvent, memo, ReactNode, useCallback } from 'react';
import { withFormsy } from 'formsy-react';
import classNames from 'classnames';

import { WithFormsyProps } from '../constants';

type LayoutType = 'elementOnly' | 'horizontal' | 'vertical';

interface BaseComponentProps {
    elementWrapperClassName?: string;
    help?: ReactNode;
    labelClassName?: string;
    layout?: LayoutType;
    onChange?: (name: string, value: any) => void;
    required?: boolean;
    rowClassName?: string;
}

const componentDefaultProps = {
    layout: 'horizontal',
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
    label?: ReactNode;
    showErrors?: boolean;
}

const Row: FC<RowProps> = memo(props => {
    const { children, label, ...baseProps } = props;
    const { elementWrapperClassName, layout, required, rowClassName, showErrors } = baseProps;

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
                <Label
                    htmlFor={props.htmlFor}
                    labelClassName={props.labelClassName}
                    layout={layout}
                    required={required}
                >
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

export interface TextareaProps extends BaseComponentProps {
    className?: string;
    cols?: number;
    disabled?: boolean;
    id?: string;
    label?: ReactNode;
    name?: string;
    placeholder?: string;
    rows?: number;
    value?: any; // TODO: Move to WithFormsyProps?
}

const TextareaImpl: FC<TextareaProps & WithFormsyProps> = props => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { className, cols, disabled, id, label, name, placeholder, rows, value, ...baseProps } = props;
    const { getErrorMessages, getValue, help, required, isValid, layout, onChange, setValue, showError } = baseProps;
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

    const element = (
        <textarea
            className={classNames('form-control', { 'is-invalid': markAsInvalid }, className)}
            cols={cols}
            disabled={disabled}
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
        return element;
    }

    return (
        <Row {...baseProps} htmlFor={id} showErrors={showErrors}>
            {element}
            {help && <Help>{help}</Help>}
            {showErrors && <ErrorMessages messages={errorMessages} />}
        </Row>
    );
};

TextareaImpl.defaultProps = {
    ...componentDefaultProps,
    cols: 0,
    rows: 3,
    value: '',
} as any;

export const Textarea = withFormsy(TextareaImpl);
