export const SELECT_INPUT_CSS_PREFIX = 'select-input';
export const SELECT_INPUT_CONTROL_SELECTOR = `div.${SELECT_INPUT_CSS_PREFIX}__control`;
export const SELECT_INPUT_DISABLED_SELECTOR = `div.${SELECT_INPUT_CSS_PREFIX}--is-disabled`;
export const SELECT_INPUT_PLACEHOLDER_SELECTOR = `div.${SELECT_INPUT_CSS_PREFIX}__placeholder`;
export const SELECT_INPUT_SINGLE_VALUE_SELECTOR = `div.${SELECT_INPUT_CSS_PREFIX}__single-value`;

export function blurSelectInputInput(component: any): void {
    component.find('input').simulate('blur');
}

export function setSelectInputText(component: any, value: string, blur = false): void {
    const input = component.find('input');
    input.getDOMNode().setAttribute('value', value);
    input.simulate('change', { currentTarget: input });
    if (blur) {
        blurSelectInputInput(component);
    }
}
