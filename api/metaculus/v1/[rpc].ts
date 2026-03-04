export const config = { runtime: 'edge' };

import { checkKillswitch } from '../../../server/_shared/killswitch';
import { createDomainGateway, serverOptions } from '../../../server/gateway';
import { createMetaculusServiceRoutes } from '../../../src/generated/server/worldmonitor/metaculus/v1/service_server';
import { metaculusHandler } from '../../../server/worldmonitor/metaculus/v1/handler';

const gateway = createDomainGateway(
  createMetaculusServiceRoutes(metaculusHandler, serverOptions),
);

export default async function handler(req: Request): Promise<Response> {
  const disabled = checkKillswitch('METACULUS');
  if (disabled) return disabled;
  return gateway(req);
}
