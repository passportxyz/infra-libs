import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as cloudflare from "@pulumi/cloudflare";

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
  additional_prefix?: string; // additional prefix for cloudflare
  prefix: string;
  branchName: string;
  environmentVariables: Record<string, string | pulumi.Output<any>>;
  tags: { [key: string]: string };
  platform?: "WEB" | "WEB_COMPUTE";
  buildCommand: string;
  preBuildCommand?: string;
  artifactsBaseDirectory: string;
  monorepoAppRoot?: string;
  nodeVersion?: string;
  customRules?: CustomRule[];
}

export function createAmplifyApp(config: AmplifyAppConfig) {
  const name = `${config.prefix}.${config.domainName}`;

const buildSpec = `version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - ${config.preBuildCommand || ''}
        build:
          commands:
            - ${config.buildCommand}
      artifacts:
        baseDirectory: ${config.artifactsBaseDirectory}
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
    appRoot: ${config.monorepoAppRoot || 'app'}
`;

const amplifyApp = new aws.amplify.App(name, {
    name: name,
    repository: config.githubUrl,
    oauthToken: config.githubAccessToken,
    platform: config.platform || "WEB_COMPUTE",
    buildSpec: buildSpec,
    customRules: config.customRules || [
      {
        source: "/<*>",
        status: "404",
        target: "/index.html",
      },
    ],
    environmentVariables: {
      AMPLIFY_DIFF_DEPLOY: "false",
      AMPLIFY_MONOREPO_APP_ROOT: config.monorepoAppRoot || "app",
      ...config.environmentVariables,
    },
    tags: config.tags,
  });

  const branch = new aws.amplify.Branch(`${name}-${config.branchName}`, {
    appId: amplifyApp.id,
    branchName: config.branchName,
  });

  const webHook = new aws.amplify.Webhook(`${name}-${config.branchName}`, {
    appId: amplifyApp.id,
    branchName: config.branchName,
    description: `trigger build from branch ${config.branchName}`,
  });

  const domainAssociation = new aws.amplify.DomainAssociation(name, {
    appId: amplifyApp.id,
    domainName: config.domainName,
    subDomains: [
      {
        branchName: branch.branchName,
        prefix: config.prefix,
      },
      {
        branchName: branch.branchName,
        prefix: config.additional_prefix || "",
      },
    ],
  });

  if (config.cloudflareDomain && config.cloudflareZoneId) {
    const cloudFlareDomainAssociation = new aws.amplify.DomainAssociation(
      `cloudflare-${name}`,
      {
        appId: amplifyApp.id,
        domainName: config.cloudflareDomain,
        waitForVerification: false,
        subDomains: [
          {
            branchName: branch.branchName,
            prefix: config.prefix,
          },
          {
            branchName: branch.branchName,
            prefix: config.additional_prefix || "",
          },
        ],
      }
    );

    const domainCert = cloudFlareDomainAssociation.certificateVerificationDnsRecord;

    domainCert.apply((cert) => {
      if (cert) {
        const certDetails = cert.split(" ");
        new cloudflare.Record("cloudflare-certificate-record", {
          name: certDetails[0].replace(`.${config.cloudflareDomain}.`, ""),
          zoneId: config.cloudflareZoneId!,
          type: certDetails[1],
          value: certDetails[2],
          allowOverwrite: true,
          comment: `Certificate for *.${config.cloudflareDomain}`,
        });
      }
    });

    cloudFlareDomainAssociation.subDomains.apply((subDomains) => {
      subDomains.forEach((subD) => {
        const domainDetails = subD.dnsRecord.split(" ");
        new cloudflare.Record(`${domainDetails[0]}-record`, {
          name: domainDetails[0],
          zoneId: config.cloudflareZoneId!,
          type: domainDetails[1],
          value: domainDetails[2],
          allowOverwrite: true,
          comment: `Points to AWS Amplify for ${config.prefix} app`,
        });
      });
    });
  }

  return { app: amplifyApp, webHook: webHook };
}