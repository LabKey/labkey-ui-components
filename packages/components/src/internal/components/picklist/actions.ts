import { QueryGridModel } from '../../QueryGridModel';

interface CreatePicklistResponse {
    listId: number,
    name: string
}

export function createPicklist(name: string, description: string, shared: boolean, model: QueryGridModel, useSelection: boolean) : Promise<CreatePicklistResponse> {
    return new Promise((resolve, reject) => {
        if (name.toLowerCase() === 'error')
            reject("I'm sorry, Dave.");
        else {
            resolve({
                name: name,
                listId: 1
            });
        }
    });
}
