import { Request, Response, NextFunction } from "express";
export declare function loadRedirects(): Promise<void>;
export declare function legacyRedirectMiddleware(req: Request, res: Response, next: NextFunction): void;
