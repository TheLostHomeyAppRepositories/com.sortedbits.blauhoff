import { BaseResponse } from '../models/responses/base-response';

/**
 * Checks if the given response is a valid response.
 * A valid response is defined as having a code of 200 and a message of 'OK'.
 *
 * @param response - The response object to be checked.
 * @returns True if the response is valid, false otherwise.
 */
export const isValidResponse = (response: BaseResponse | undefined): boolean => {
    if (response === undefined) {
        return false;
    }

    return (response.code === 200 && response.msg === 'OK');
};
