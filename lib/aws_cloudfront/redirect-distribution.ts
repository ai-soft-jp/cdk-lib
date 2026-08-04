import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import type { Construct } from 'constructs';
import type { MappedRedirectProps } from './mapped-redirect';
import { MappedRedirect } from './mapped-redirect';
import type { SimpleRedirectProps } from './simple-redirect';
import { SimpleRedirect } from './simple-redirect';

export interface RedirectDistributionProps extends Omit<
  cloudfront.DistributionProps,
  'defaultBehavior' | 'additionalBehaviors'
> {
  readonly redirection: Redirection;
  readonly viewerProtocolPolicy?: cloudfront.ViewerProtocolPolicy;
  readonly responseHeadersPolicy?: cloudfront.IResponseHeadersPolicy;
}

export abstract class Redirection {
  static simple(props: SimpleRedirectProps): Redirection {
    return new SimpleRedirectRedirection(props);
  }

  static mapped(props: MappedRedirectProps): Redirection {
    return new MappedRedirectRedirection(props);
  }

  static custom(func: cloudfront.IFunction): Redirection {
    return new CustomRedirection(func);
  }

  abstract bind(scope: Construct): cloudfront.IFunction;
}

class SimpleRedirectRedirection extends Redirection {
  constructor(readonly props: SimpleRedirectProps) {
    super();
  }
  bind(scope: Construct) {
    return new SimpleRedirect(scope, 'Redirection', this.props);
  }
}

class MappedRedirectRedirection extends Redirection {
  constructor(readonly props: MappedRedirectProps) {
    super();
  }
  bind(scope: Construct) {
    return new MappedRedirect(scope, 'Redirection', this.props);
  }
}

class CustomRedirection extends Redirection {
  constructor(readonly func: cloudfront.IFunction) {
    super();
  }
  bind(_scope: Construct) {
    return this.func;
  }
}

export class RedirectDistribution extends cdk.Resource implements cloudfront.IDistributionRef {
  readonly distributionRef: cloudfront.DistributionReference;
  readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: RedirectDistributionProps) {
    super(scope, id);

    const redirection = props.redirection.bind(this);

    const origin = new origins.HttpOrigin('redirect.aws');
    const resource = new cloudfront.Distribution(this, 'Distribution', {
      ...props,
      defaultBehavior: {
        origin,
        viewerProtocolPolicy: props.viewerProtocolPolicy ?? cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: props.responseHeadersPolicy,
        functionAssociations: [{ eventType: cloudfront.FunctionEventType.VIEWER_REQUEST, function: redirection }],
      },
    });

    this.distribution = resource;
    this.distributionRef = resource.distributionRef;
  }
}
