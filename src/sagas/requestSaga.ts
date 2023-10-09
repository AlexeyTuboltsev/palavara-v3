import {call, put} from "redux-saga/effects";
import {createRequest, EHttpMethod} from "../services/httpRequest";
import {AxiosResponse} from "axios";

export function* requestSaga<ResponseType>(method: EHttpMethod, url: string, responseType: ResponseType, responseAction: any) {
  try {
    const {
      data,
      status,
      statusText
    }: AxiosResponse<ResponseType, any> = yield call(createRequest, method, url, 'blob')

    if (responseType === 'blob') {
      const base64String: string = yield blobToBase64(data as Blob)
      yield put(responseAction({data: base64String, status, statusText}))
    } else {
      yield put(responseAction({data, status, statusText}))

    }


  } catch (e) {
    console.log('err', e)
    //todo
  }
}

function blobToBase64(blob: Blob) {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}