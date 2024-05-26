[cdk-static-website-from-asset](../index.md) / AssetWithBuild

# Class: AssetWithBuild

An extension of the [Asset](
https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3_assets-readme.html) construct for
conveniently building your app. It simplifies Asset's `bundling` prop with its own `build` prop
which allows directly specifying a series of commands to run.

## Hierarchy

- `Asset`

  ↳ **`AssetWithBuild`**

## Table of contents

### Constructors

- [constructor](AssetWithBuild.md#constructor)

## Constructors

### constructor

• **new AssetWithBuild**(`scope`, `id`, `props`): [`AssetWithBuild`](AssetWithBuild.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `scope` | `Construct` |
| `id` | `string` |
| `props` | [`AssetWithBuildProps`](../index.md#assetwithbuildprops) |

#### Returns

[`AssetWithBuild`](AssetWithBuild.md)

#### Overrides

s3\_assets.Asset.constructor

#### Defined in

[constructs/asset-with-build.ts:30](https://github.com/paulbarmstrong/cdk-static-website-from-asset/blob/main/lib/constructs/asset-with-build.ts#L30)
