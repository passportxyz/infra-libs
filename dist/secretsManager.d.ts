import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
type GetPasswordManagerDataParams = {
    vault: string;
    repo: string;
    env: string;
    section?: string;
    type: "secrets" | "env";
};
type GetEnvironmentVarsParams = Omit<GetPasswordManagerDataParams, "type">;
type SyncSecretsAndGetRefsParams = GetEnvironmentVarsParams & {
    secretVersionName: string;
    targetSecret: aws.secretsmanager.Secret;
    extraSecretDefinitions?: EnvironmentVar[];
};
export type EnvironmentVar = {
    name: string;
    value: string | pulumi.Output<any>;
};
export type SecretRef = {
    name: string;
    valueFrom: string;
};
export declare const syncSecretsAndGetRefs: (params: SyncSecretsAndGetRefsParams) => pulumi.Output<SecretRef[]>;
export declare const getEnvironmentVars: (params: GetEnvironmentVarsParams) => EnvironmentVar[];
export declare const sortByName: (a: {
    name: string;
}, b: {
    name: string;
}) => number;
export {};
