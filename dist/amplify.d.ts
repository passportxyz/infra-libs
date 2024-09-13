import * as pulumi from "@pulumi/pulumi";
type CustomRule = {
    source: string;
    status: string;
    target: string;
};
export interface AmplifyAppConfig {
    name: string;
    githubUrl: string;
    githubAccessToken?: string;
    domainName: string;
    cloudflareDomain?: string;
    cloudflareZoneId?: string;
    prefix: string;
    branchName: string;
    environmentVariables: Record<string, string | pulumi.Output<any>>;
    tags: {
        [key: string]: string;
    };
    enableBasicAuth?: boolean;
    basicAuthUsername?: string;
    basicAuthPassword?: string;
    platform?: "WEB" | "WEB_COMPUTE";
    buildCommands: string[];
    preBuildCommands?: string[];
    artifactsBaseDirectory: string;
    monorepoAppRoot?: string;
    nodeVersion?: string;
    customRules?: CustomRule[];
}
export declare function createAmplifyApp(config: AmplifyAppConfig): {
    app: import("@pulumi/aws/amplify/app").App;
    webHook: import("@pulumi/aws/amplify/webhook").Webhook;
};
export {};
