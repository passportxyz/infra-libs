type GetPasswordManagerDataParams = {
    vault: string;
    repo: string;
    env: string;
    section?: string;
    type: "secrets" | "env";
};
type GetEnvironmentVarsParams = Omit<GetPasswordManagerDataParams, "type">;
type SyncSecretsAndGetRefsParams = GetEnvironmentVarsParams & {
    targetSecretArn: string;
};
type EnvironmentVar = {
    name: string;
    value: string;
};
type SecretRef = {
    name: string;
    valueFrom: string;
};
export declare const syncSecretsAndGetRefs: (params: SyncSecretsAndGetRefsParams) => SecretRef[];
export declare const getEnvironmentVars: (params: GetEnvironmentVarsParams) => EnvironmentVar[];
export declare const sortByName: (a: {
    name: string;
}, b: {
    name: string;
}) => number;
export {};