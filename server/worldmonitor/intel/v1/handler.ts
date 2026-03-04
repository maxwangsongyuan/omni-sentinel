import type { IntelServiceHandler, ServerContext, ChatRequest, BriefingRequest } from '../../../../src/generated/server/worldmonitor/intel/v1/service_server';
import { handleChat } from './chat';
import { handleBriefing } from './briefing';

export const intelHandler: IntelServiceHandler = {
  chat: (_ctx: ServerContext, req: ChatRequest) => handleChat(req),
  briefing: (_ctx: ServerContext, req: BriefingRequest) => handleBriefing(req),
};
