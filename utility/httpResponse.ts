import express from "express";
function badRequestResponse(res: express.Response, message: string) {
  return res.status(400).send({
    status: false,
    message,
  });
}

function unauthorizeResponse(res: express.Response) {
  return res.status(401).send({
    status: false,
    message: "Unauthorize user",
  });
}

function loginRedirectResponse(res: express.Response) {
  return res.status(403).send({
    status: false,
    message: "Forbidden access / token expired",
  });
}

function errorResponse(res: express.Response, message: string) {
  return res.status(500).send({
    status: false,
    message,
  });
}

function mutationSuccessResponse(res: express.Response, data: any) {
  res.status(201).send({
    status: true,
    data,
  });
}

function getSuccessResponse(res: express.Response, data: any, meta?: any) {
  res.status(200).send({
    status: true,
    data,
    meta,
  });
}

export {
  getSuccessResponse,
  mutationSuccessResponse,
  errorResponse,
  loginRedirectResponse,
  unauthorizeResponse,
  badRequestResponse,
};
