import { item } from "@1password/op-js";

const repo = "passport-scorer";

const env = "review";

const secrets = {
  KEY: "VALUE",
};

const envVars = {
  KEY: "VALUE",
};

const section = "api";

item.edit(
  [repo, env, "env"].join("-"),
  Object.entries(envVars).map(([key, value]) => [
    section + "." + key,
    "text",
    value,
  ]),
  { vault: "DevOps" }
);

item.edit(
  [repo, env, "secrets"].join("-"),
  Object.entries(secrets).map(([key, value]) => [
    section + "." + key,
    "concealed",
    value,
  ]),
  { vault: "DevOps" }
);
