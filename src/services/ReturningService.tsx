import axios from "axios";
import { RequestPageableModel } from "../models/PageableModel";
import { AZURE_SERVICE_API, CORS_CONFIG } from "../utils/Config";
import { ReturingReponseModel } from "../models/ReturningModel";

export interface ReturningGetParams {
    [key: string]: string | Array<string> | number;
    search: string;
    status: Array<string>;
    returnedDate: string;
    page: number;
    size: number;
    sort: string;
}

export const getRequestForReturning = (pageable: RequestPageableModel) => axios.get(`${AZURE_SERVICE_API}/return-request?search=${pageable.search}&state=${pageable.states}&returnedDate=${pageable.returnedDate}&page=${pageable.page}&size=${pageable.size}&sort=${pageable.sort}`, CORS_CONFIG);

export const getRequestForReturningSWR = async (params: RequestPageableModel) => {
    const response = await getRequestForReturning(params);
    const pageReturning: ReturingReponseModel = {
        content: response.data.data.content,
        totalElements: response.data.data.totalElements,
        totalPage: response.data.data.totalPage,
        currentPage: response.data.data.currentPage,
    };
    return pageReturning;
}

export const createReturningRequest = (assignmentId: number) => axios.post(`${AZURE_SERVICE_API}/return-request`, { assignmentId: assignmentId }, CORS_CONFIG);
const completeReturningRequest = (returningId: number) => axios.put(`${AZURE_SERVICE_API}/return-request/${returningId}`, {}, CORS_CONFIG);
const cancelReturningRequest = (returningId: number) =>axios.delete(`${AZURE_SERVICE_API}/return-request/${returningId}`, CORS_CONFIG);

export const sendResponseReturningRequest = (returningId: number, status: boolean) => {
    return status ? completeReturningRequest(returningId) : cancelReturningRequest(returningId);
};