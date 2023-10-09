import {CANCEL} from 'redux-saga';
import axios, {ResponseType} from "axios";

export enum EHttpMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
    HEAD = "HEAD",
}

export function createRequest(method:EHttpMethod, url:string, type:ResponseType) {
    const cancelTokenSource = axios.CancelToken.source();
    const promise = axios.request({
        method,
        responseType:type,
        url,
        cancelToken: cancelTokenSource.token
    });
    (promise as any)[CANCEL] = cancelTokenSource.cancel;
    return promise;
}

