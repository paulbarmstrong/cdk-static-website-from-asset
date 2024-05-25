[cdk-static-website-from-asset](../index.md) / StaticWebsite

# Class: StaticWebsite

A construct that represents infrastructure for hosting an [Asset](
https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3_assets-readme.html) as a static
website.

## Hierarchy

- `Construct`

  ↳ **`StaticWebsite`**

## Table of contents

### Constructors

- [constructor](StaticWebsite.md#constructor)

### Properties

- [bucket](StaticWebsite.md#bucket)
- [distribution](StaticWebsite.md#distribution)

### Methods

- [addBucketObject](StaticWebsite.md#addbucketobject)

## Constructors

### constructor

• **new StaticWebsite**(`scope`, `id`, `props`): [`StaticWebsite`](StaticWebsite.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `scope` | `Construct` |
| `id` | `string` |
| `props` | [`StaticWebsiteProps`](../index.md#staticwebsiteprops) |

#### Returns

[`StaticWebsite`](StaticWebsite.md)

#### Overrides

Construct.constructor

#### Defined in

[constructs/static-website.ts:67](https://github.com/paulbarmstrong/cdk-static-website-from-asset/blob/main/lib/constructs/static-website.ts#L67)

## Properties

### bucket

• **bucket**: `Bucket`

Underlying Bucket for the StaticWebsite

#### Defined in

[constructs/static-website.ts:62](https://github.com/paulbarmstrong/cdk-static-website-from-asset/blob/main/lib/constructs/static-website.ts#L62)

___

### distribution

• **distribution**: `Distribution`

Underlying Distribution for the StaticWebsite

#### Defined in

[constructs/static-website.ts:66](https://github.com/paulbarmstrong/cdk-static-website-from-asset/blob/main/lib/constructs/static-website.ts#L66)

## Methods

### addBucketObject

▸ **addBucketObject**(`props`): `void`

Add an object to the static website's bucket based on a given key and body. Deploy-time
values from the CDK like resource ARNs can be used here.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | `Object` | - |
| `props.body` | `string` | Content to be stored within the S3 object. |
| `props.key` | `string` | S3 object key for the object. |

#### Returns

`void`

#### Defined in

[constructs/static-website.ts:145](https://github.com/paulbarmstrong/cdk-static-website-from-asset/blob/main/lib/constructs/static-website.ts#L145)
