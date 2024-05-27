import { Construct } from "constructs"
import * as cloudfront from "aws-cdk-lib/aws-cloudfront"
import * as s3_assets from "aws-cdk-lib/aws-s3-assets"
import * as cloudfront_origins from "aws-cdk-lib/aws-cloudfront-origins"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as route53 from "aws-cdk-lib/aws-route53"
import * as route53_targets from "aws-cdk-lib/aws-route53-targets"
import { ManagedObjectsBucket, ManagedObjectsBucketProps, ObjectChangeAction } from "cdk-managed-objects-bucket"
import { DnsValidatedCertificate } from "aws-cdk-lib/aws-certificatemanager"

export type StaticWebsiteProps = {
	/** 
	 * The [Asset](
	 * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3_assets-readme.html) to be
	 * hosted as a static website. StaticWebsite expects the index document to be "index.html"
	 */
	asset: s3_assets.Asset,
	/**
	 * Route53-managed domain to be used for the static website.
	 * 
	 * Currently it supports a maximum of 1 domain. To add multiple Route53 domains (or non
	 * Route53 domains) you can leave this prop empty and specify your own domain and
	 * certificate in distributionProps.
	 */
	domains?: Array<{
		domainName: string,
		hostedZone: route53.IHostedZone
	}>,
	/**
	 * When the website Asset is updated, a CloudFront invalidation is created to allow the
	 * new contents to start being served. This prop specifies whether to wait for the
	 * invalidation to be completed before allowing the CloudFormation update to continue.
	 * 
	 * @default false
	 */
	waitForCloudFrontInvalidationCompletion?: boolean
	/**
	 * Overrides for the props for the underlying [Bucket](
	 * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3.Bucket.html).
	 */
	bucketProps?: Partial<s3.BucketProps & ManagedObjectsBucketProps>,
	/**
	 * Overrides for the props for the underlying [Distribution](
	 * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront.Distribution.html).
	 */
	distributionProps?: (bucket: s3.Bucket) => Partial<cloudfront.DistributionProps>,
}

/**
 * A construct that represents infrastructure for hosting an [Asset](
 * https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3_assets-readme.html) as a static
 * website.
 */
export class StaticWebsite extends Construct {
	/** Underlying Bucket for the StaticWebsite */
	bucket: s3.Bucket
	/** @hidden */
	#bucketInternal: ManagedObjectsBucket
	/** Underlying Distribution for the StaticWebsite */
	distribution: cloudfront.Distribution
	constructor(scope: Construct, id: string, props: StaticWebsiteProps) {
		super(scope, id)

		const domains = props.domains ?? []

		if (domains.length > 1) {
			throw new Error("Multiple Route53 domains isn't supported yet.")
		}

		if (new Set(domains.map(domain => domain.domainName)).size !== domains.length) {
			throw new Error("Domain names must be unique.")
		}

		const certificate = domains.length > 0 ? (
			new DnsValidatedCertificate(this, "Certificate", {
				domainName: domains[0].domainName,
				hostedZone: domains[0].hostedZone,
				region: "us-east-1"
			})
		) : (
			undefined
		)

		this.#bucketInternal = new ManagedObjectsBucket(this, "Bucket", {
			websiteIndexDocument: "index.html",
			publicReadAccess: true,
			blockPublicAccess: {
				blockPublicPolicy: false,
				blockPublicAcls: false,
				ignorePublicAcls: false,
				restrictPublicBuckets: false
			},
			...props.bucketProps
		})
		this.bucket = this.#bucketInternal

		this.distribution = new cloudfront.Distribution(this, "Distribution", {
			defaultBehavior: {
				origin: new cloudfront_origins.S3Origin(this.bucket),
				viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
			},
			errorResponses: [
				{
					httpStatus: 403,
					responsePagePath: "/index.html",
					responseHttpStatus: 200
				}, {
					httpStatus: 404,
					responsePagePath: "/index.html",
					responseHttpStatus: 200
				}
			],
			domainNames: domains.map(domain => domain.domainName),
			certificate: certificate,
			...(props.distributionProps !== undefined ? props.distributionProps(this.bucket) : {})
		})

		domains.forEach(domain => {
			new route53.ARecord(this, `${domain.domainName}ARecord`, {
				zone: domain.hostedZone!,
				recordName: domain.domainName,
				target: route53.RecordTarget.fromAlias(new route53_targets.CloudFrontTarget(this.distribution))
			})
		})
		this.#bucketInternal.addObjectsFromAsset({ asset: props.asset })
		this.#bucketInternal.addObjectChangeAction(ObjectChangeAction.cloudFrontInvalidation({
			distribution: this.distribution,
			waitForCompletion: props.waitForCloudFrontInvalidationCompletion
		}))
	}

	/**
	 * Add an object to the static website's bucket based on a given key and body. Deploy-time
	 * values from the CDK like resource ARNs can be used here.
	 */
	addObject(props: {
		/** S3 object key for the object. */
		key: string,
		/** Content to be stored within the S3 object. */
		body: string
	}) {
		this.#bucketInternal.addObject(props)
	}
}
