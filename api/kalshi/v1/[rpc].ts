export const config = { runtime: 'edge' };

import { checkKillswitch } from '../../../server/_shared/killswitch';
import { createDomainGateway, serverOptions } from '../../../server/gateway';
import { createKalshiServiceRoutes } from '../../../src/generated/server/worldmonitor/kalshi/v1/service_server';
import { kalshiHandler } from '../../../server/worldmonitor/kalshi/v1/handler';

const gateway = createDomainGateway(
  createKalshiServiceRoutes(kalshiHandler, serverOptions),
);

export default async function handler(req: Request): Promise<Response> {
  const disabled = checkKillswitch('KALSHI');
  if (disabled) return disabled;
  return gateway(req);
}
