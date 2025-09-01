import type { Request } from "express";

export interface ExpressRequest extends Request{
    user:any
}

