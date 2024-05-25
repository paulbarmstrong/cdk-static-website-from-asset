cdk-static-website-from-asset

# cdk-static-website-from-asset

## Table of contents

### Classes

- [AssetWithBuild](classes/AssetWithBuild.md)
- [StaticWebsite](classes/StaticWebsite.md)

### Type Aliases

- [AssetWithBuildProps](index.md#assetwithbuildprops)
- [StaticWebsiteProps](index.md#staticwebsiteprops)

## Type Aliases

### AssetWithBuildProps

Ƭ **AssetWithBuildProps**: `Omit`\<`s3_assets.AssetProps`, ``"bundling"``\> & \{ `build?`: (`exec`: (`command`: `string`, `options?`: \{ `env?`: `Record`\<`string`, `string`\>  }) => `void`, `outputDir`: `string`) => `void`  }

#### Defined in

[constructs/asset-with-build.ts:6](https://github.com/paulbarmstrong/cdk-static-website-from-asset/blob/main/lib/constructs/asset-with-build.ts#L6)

___

### StaticWebsiteProps

Ƭ **StaticWebsiteProps**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `asset` | `s3_assets.Asset` | The [Asset]( https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3_assets-readme.html) to be hosted as a static website. |
| `bucketProps?` | `Partial`\<`s3.BucketProps` & `ManagedObjectsBucketProps`\> | Overrides for the props for the underlying [Bucket]( https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.Bucket.html). |
| `distributionProps?` | `Partial`\<`cloudfront.DistributionProps`\> | Overrides for the props for the underlying [Distribution]( https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront.Distribution.html). |
| `indexDocument` | `string` | The index document of the website. It should be the main HTML file within your Asset. It's usually `index.html`. |
| `route53Domains?` | \{ `domainName`: `string` ; `hostedZone`: `route53.IHostedZone`  }[] | Route53-managed domain to be used for the static website. Currently it supports a maximum of 1 domain. To add multiple Route53 domains (or non Route53 domains) you can leave this prop empty and specify your own domain and certificate in distributionProps. |
| `waitForCloudFrontInvalidationCompletion?` | `boolean` | When the website Asset is updated, a CloudFront invalidation is created to allow the new contents to start being served. This prop specifies whether to wait for the invalidation to be completed before allowing the CloudFormation update to continue. **`Default`** ```ts false ``` |

#### Defined in

[constructs/static-website.ts:12](https://github.com/paulbarmstrong/cdk-static-website-from-asset/blob/main/lib/constructs/static-website.ts#L12)
