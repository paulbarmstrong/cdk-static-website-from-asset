## cdk-static-website-from-asset

### Experimental Notice

This package is brand new and highly experimental so breaking changes may be made without notice.

### About

This package aims to provide a comfortable layer of abstraction for static website hosting with
CDK, while providing as much configurability as possible. Ideally you specify your app's source
code, the commands (if any) used to build it, optionally a Route53 domain, and the constructs of
this package take care of building and deploying it. It provides two constructs:

##### AssetWithBuild
An extension of the [`Asset`](
https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3_assets-readme.html) construct for
conveniently building your app.

##### StaticWebsite
A construct that represents infrastructure for hosting an `Asset` as a static website. You can
optionally:
* Add a Route53 domain with the `route53Domains` prop.
* Add deploy-time information from your CDK with the `addBucketObject` method.
* Tweak the underlying lower level constructs and their props. For example, you could add your
own non-Route53 domain by adding your own certificate to the distribution.

### Usage

Assuming we have:
1. An existing delegated hosted zone for `mydomain.com` with ID `XXXXXXXXXXXXXXXXXXXXX`.
2. A react app source package at `../path-to-my-react-app-package` that's by react-scripts (like
any react app from create-react-app).

A CDK stack for hosting the app at `mydomain.com` looks like this:

```typescript
import * as cdk from "aws-cdk-lib"
import * as route53 from "aws-cdk-lib/aws-route53"
import * as s3_assets from "aws-cdk-lib/aws-s3-assets"
import { AssetWithBuild, StaticWebsite } from "cdk-static-website-from-asset"
import { Construct } from "constructs"

export class MyStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props)
		const hostedZone: route53.IHostedZone = route53.HostedZone.fromHostedZoneAttributes(this, "HostedZone", {
			hostedZoneId: "XXXXXXXXXXXXXXXXXXXXX",
			zoneName: "mydomain.com"
		})
		const asset: s3_assets.Asset = new AssetWithBuild(this, "Asset", {
			path: "../path-to-my-react-app-package",
			build: (exec, outputDir) => {
				exec("npm install")
				exec("npx react-scripts build --color=always", {
					env: { BUILD_PATH: outputDir }
				})
			}
		})
		const website: StaticWebsite = new StaticWebsite(this, "Website", {
			asset: asset,
			indexDocument: "index.html",
			route53Domains: [{ domainName: "mydomain.com", hostedZone: hostedZone }]
		})
	}
}
```