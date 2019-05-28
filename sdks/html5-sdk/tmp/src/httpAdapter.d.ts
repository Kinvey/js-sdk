export declare function deviceInfo(): {
    hv: number;
    os: string;
    ov: string;
    sdk: {
        name: string;
        version: string;
    };
    pv: string;
};
export declare function send(request: any): Promise<{
    statusCode: any;
    headers: any;
    data: any;
}>;
