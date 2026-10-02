import client from './api-page.client';
import { openapi } from '@/lib/openapi';
import type { OpenAPIPageProps } from 'fumadocs-openapi/ui';

export async function APIPage(props: OpenAPIPageProps) {
  const { document, operations, webhooks, showTitle, showDescription } = props;

  if ('payload' in props) {
    return <client {...props} />;
  }

  const schema = await openapi.getSchema(document);

  return (
    <client
      document={document}
      operations={operations}
      webhooks={webhooks}
      showTitle={showTitle}
      showDescription={showDescription}
      payload={{
        bundled: schema.bundled,
      }}
    />
  );
}