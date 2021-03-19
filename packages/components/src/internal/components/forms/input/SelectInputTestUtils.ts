import { waitForLifecycle } from '../../../testHelpers';

export const SELECT_INPUT_CSS_PREFIX = 'select-input';
export const SELECT_INPUT_CONTROL_SELECTOR = `div.${SELECT_INPUT_CSS_PREFIX}__control`;
export const SELECT_INPUT_DROPDOWN_SELECTOR = `div.${SELECT_INPUT_CSS_PREFIX}__dropdown-indicator`;
export const SELECT_INPUT_OPTION_SELECTOR = `div.${SELECT_INPUT_CSS_PREFIX}__option`;

export async function selectOptionByIndex(component: any, index: number): Promise<void> {
    toggleSelectInputMenu(component);
    const options = component.find(SELECT_INPUT_OPTION_SELECTOR);
    if (options.length <= index) {
        throw new Error(
            `selectOptionByIndex: Invalid index (${index}) supplied. Only ${options.length} options available.`
        );
    }
    options.at(index).simulate('click');
    await waitForLifecycle(component);
}

export async function selectOptionByText(component: any, text: string): Promise<void> {
    toggleSelectInputMenu(component);
    const options = component.find(SELECT_INPUT_OPTION_SELECTOR);

    let idx = -1;

    for (let i = 0; i < options.length; i++) {
        if (options.at(i).text().indexOf(text) > -1) {
            if (idx === -1) {
                idx = i;
            } else {
                throw new Error(
                    `selectOptionByText: Invalid text "${text}" supplied. Multiple options contain this text.`
                );
            }
        }
    }

    if (idx === -1) {
        throw new Error(`selectOptionByText: Unable to find option containing text "${text}".`);
    }

    options.at(idx).simulate('click');
    await waitForLifecycle(component);
}

export function setSelectInputText(component: any, value: string, blur = false) {
    const input = component.find('input');
    input.getDOMNode().setAttribute('value', value);
    input.simulate('change', { currentTarget: input });
    if (blur) {
        input.simulate('blur');
    }
}

export function toggleSelectInputMenu(component: any): void {
    component.find(SELECT_INPUT_DROPDOWN_SELECTOR).simulate('mousedown', { button: 0 });
}
