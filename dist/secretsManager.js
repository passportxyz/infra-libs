"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortByName = exports.getEnvironmentVars = exports.syncSecretsAndGetRefs = void 0;
const op_js_1 = require("@1password/op-js");
const aws = require("@pulumi/aws");
const pulumi = require("@pulumi/pulumi");
const syncedTargetSecretArns = [];
// Given a 1P definition and a target secret ARN, sync the secrets to the target secret
// object in AWS Secrets Manager and return the references to those secret values
const syncSecretsAndGetRefs = (params) => {
    const { targetSecret, extraSecretDefinitions } = params, passwordManagerParams = __rest(params, ["targetSecret", "extraSecretDefinitions"]);
    ensureSecretsOnlySyncedOnce(targetSecret);
    const secretDefinitions = getPasswordManagerData(Object.assign(Object.assign({}, passwordManagerParams), { type: "secrets" }));
    const allSecretDefinitions = [
        ...(extraSecretDefinitions || []),
        ...secretDefinitions,
    ].sort(exports.sortByName);
    const secretString = pulumi.jsonStringify(allSecretDefinitions.reduce((acc, { name, value }) => {
        acc[name] = value;
        return acc;
    }, {}));
    targetSecret.arn.apply((targetSecretArn) => {
        new aws.secretsmanager.SecretVersion(`${targetSecretArn.split(":").slice(-1)}-secret-version`, {
            secretId: targetSecretArn,
            secretString,
            versionStages: ["AWSCURRENT"],
        });
    });
    return targetSecret.arn.apply((targetSecretArn) => allSecretDefinitions.map(({ name }) => ({
        name,
        valueFrom: `${targetSecretArn}:${name}::`,
    })));
};
exports.syncSecretsAndGetRefs = syncSecretsAndGetRefs;
// Given a 1P definition, return the environment variables
const getEnvironmentVars = (params) => {
    return getPasswordManagerData(Object.assign(Object.assign({}, params), { type: "env" }));
};
exports.getEnvironmentVars = getEnvironmentVars;
const password_manager_ci_validated = false;
const getPasswordManagerData = ({ vault, repo, env, type, section, }) => {
    var _a;
    password_manager_ci_validated || (0, op_js_1.validateCli)();
    const noteName = `${repo}-${env}-${type}`;
    const envNote = op_js_1.item.get(noteName, { vault });
    const fields = (section
        ? (_a = envNote.fields) === null || _a === void 0 ? void 0 : _a.filter((field) => { var _a; return ((_a = field.section) === null || _a === void 0 ? void 0 : _a.label) === section; })
        : envNote.fields) || [];
    if (!fields.length) {
        throw new Error(`No data found for ${vault}/${repo}-${env}-${type}${section ? `/${section}` : ""}`);
    }
    return fields
        .map(({ label, value }) => ({ name: label, value }))
        .sort(exports.sortByName);
};
const ensureSecretsOnlySyncedOnce = (targetSecret) => {
    targetSecret.arn.apply((targetSecretArn) => {
        if (syncedTargetSecretArns.includes(targetSecretArn)) {
            throw new Error(`Secrets for ${targetSecretArn} have already been synced`);
        }
        syncedTargetSecretArns.push(targetSecretArn);
    });
};
// Pulumi sorts alphabetically by name, so we want to match so that
// the diff doesn't falsely show differences because of the order.
// This is used above to pre-sort. But if you add to any of these
// arrays, you'll want to sort the final array as well
const sortByName = (a, b) => a.name.localeCompare(b.name);
exports.sortByName = sortByName;
